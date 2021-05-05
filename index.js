const Discord = require("discord.js");
const DBL = require("dblapi.js");
const client = new Discord.Client();
const Reply = require("./response");

//comment out when testing
const dbl = new DBL(process.env.TOPGG_KEY, client);

const prefix = "S>";

// const dashBoard = new Dashboard (client, {
//   port: 5999,
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET, 
// //   redirectURL: "http://localhost:5999/auth/discord/callback"
// })

client.on("ready", () => {
// Dashboard({
//     port: 5999,
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://serv.stackdoubleflow.net:5999/auth/discord/callback"
//     // requestLogger: false
// });
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Serving ${client.guilds.cache.size} server(s).`);
});

client.on("message", async (msg) => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  const loadingEmbed = new Discord.MessageEmbed()
    .setColor("#2BB55F")
    .setTitle("Loading...");
  if (command == "album") {
    if (args < 1) {
      const noArgsEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle("You didnt specify what to search...");
      msg.channel.send(noArgsEmbed);
      return;
    }
    let mainMessage = await msg.channel.send(loadingEmbed);
    let album = new Reply.Album(args, "album", mainMessage, msg.author, client);
    album.makeRequest();
  } else if (command == "track") {
    if (args < 1) {
      const noArgsEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle("You didnt specify what to search...");
      msg.channel.send(noArgsEmbed);
      return;
    }
    let mainMessage = await msg.channel.send(loadingEmbed);
    let track = new Reply.Track(
      args,
      "track",
      mainMessage,
      msg.author,
      client,
      false
    );
    track.makeRequest();
  } else if (command == "artist") {
    if (args < 1) {
      const noArgsEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle("You didnt specify what to search...");
      msg.channel.send(noArgsEmbed);
      return;
    }
    let mainMessage = await msg.channel.send(loadingEmbed);
    let artist = new Reply.Artist(
      args,
      "artist",
      mainMessage,
      msg.author,
      client
    );
    artist.makeRequest();
  } else if (command == "np") {
    let user;
    let notFoundEmbed;
    if (msg.mentions.members.first()) {
      await dbl.hasVoted(msg.author.id).then((voted) => {
        console.log(`Has voted: ${voted}`);
        if (!voted) {
          let voteEmbed = new Discord.MessageEmbed()
            .setColor("#0099cc")
            .setTitle("Vote!")
            .setDescription(
              "Sorry about this, but you need to vote first before using this! Using S> np without a selected user does not require voting."
            )
            .setURL("https://top.gg/bot/732713261501513800/vote");
          msg.channel.send(voteEmbed);
          user = false;
        } else {
          let mention = args[0];
          if (mention.startsWith("<@") && mention.endsWith(">")) {
            mention = mention.slice(2, -1);

            if (mention.startsWith("!")) {
              mention = mention.slice(1);
            }
            user = client.users.cache.get(mention);
            notFoundEmbed = new Discord.MessageEmbed()
              .setColor("#808080")
              .setTitle("Uh oh!")
              .setDescription(
                "Looks like this person isn't playing anything!"
              );
          }
        }
      });
    } else {
      user = msg.author;
      console.log(user);
      console.log(user.presence);
      console.log(user.presence.activities);
      notFoundEmbed = new Discord.MessageEmbed()
        .setColor("#de1738")
        .setTitle("Uh oh!")
        .setDescription(
          "Make sure you've linked your spotify to discord under connections and are playing something!"
        );
    }
    for (let i = 0; i < user.presence.activities.length; i++) {
      console.log(user);
      console.log(user.presence);
      let presence = user.presence.activities[i];
      if (presence.name == "Spotify") {
        console.log("Spotify detected");
        console.log(presence);
        let id = presence.syncID;
        let search = `${presence.details} ${presence.state}`;
        let args = search.split(" ");

        let mainMessage = await msg.channel.send(loadingEmbed);
        let track = new Reply.Track(
          args,
          "track",
          mainMessage,
          msg.author,
          client,
          true,
          id
        );
        track.makeRequest();
        return;
      }
    }

    msg.channel.send(notFoundEmbed);
  } else if (command == "help") {
    const helpEmbed = new Discord.MessageEmbed()
      .setColor("#2BB55F")
      .setTitle("Commands")
      .setAuthor(`Made by Carbon monoxide is underrated#9999`)
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/669717144845680658/733425260262588547/spotifyanimegirlthing_2.jpg"
      )
      .addFields(
        { name: "S> album {item}", value: "Searches for the album on spotify" },
        { name: "S> track {item}", value: "Searches for the track on spotify" },
        {
          name: "S> artist {item}",
          value: "Searches for the artist on spotify",
        },
        {
          name: "S> np {@user: optional}",
          value:
            "Shows what track you or another person are playing, requires you to connect your spotify to discord. Will still work even if another presence is hiding it. User is optional.",
        },
        {
          name: "S> info",
          value: "Learn why Spotify-chan is so special from everything else!",
        },
        {
          name: "S> vote",
          value: "Vote me!",
        },
        {
          name: "S> invite",
          value: "Invite me to another server!",
        },
        {
          name: "S> discord",
          value: "Join our support discord!",
        },
      );

    msg.channel.send(helpEmbed);
  } else if (command == "info") {
    const infoEmbed = new Discord.MessageEmbed()
      .setColor("#2BB55F")
      .setTitle("Information")
      .setAuthor(`Made by Carbon monoxide is underrated#9999`)
      .setDescription(
        "Unlike most bots, Spotify-chan doesnt use youtube, last.fm, or others to get song results. Instead, Spotify-chan gets them directly from the spotify web api! In short, this means that everything on spotify can be searched, with more information about that item, and a plus of no missing images or missing information (unless spotify has an issue). ```Dev note: Spotify-chan is still in beta so please be patient.```"
      );
    msg.channel.send(infoEmbed);
  } else if (command == "vote") {
    const voteEmbed = new Discord.MessageEmbed()
      .setColor("#2BB55F")
      .setTitle("Vote!")
      .setDescription(
        "Thanks for voting! It really means a lot! https://top.gg/bot/732713261501513800/vote"
      );
    msg.channel.send(voteEmbed);
  } else if (command == "invite") {
    let inviteEmbed = new Discord.MessageEmbed()
      .setColor("#2BB55F")
      .setTitle("Invite me!")
      .setDescription("https://top.gg/bot/732713261501513800");
    msg.channel.send(inviteEmbed);
  } else if (command == "discord") {
    let discordEmbed = new Discord.MessageEmbed()
      .setColor("#2BB55F")
      .setTitle("Heres our support discord!")
      .setDescription("https://discord.gg/gPcY2NU");
    msg.channel.send(discordEmbed);
  } else {
    msg.channel.send("thats not a command!");
  }
});

//comment these out when testing

dbl.on("posted", () => {
  console.log("Server count posted!");
    client.user.setActivity(
    `Use S> help to get started | Serving ${client.guilds.cache.size} servers!`
  );
});

dbl.on("error", (e) => {
  console.log(`Oops! ${e}`);
});

//DEV_BUILD_TOKEN for dev build and DISCORD_TOKEN for regular bot
client.login(process.env.DISCORD_TOKEN);
