const spotifyLookUp = require("./spotifyLookUp");
const Discord = require("discord.js");

const itemNotFoundEmbed = new Discord.MessageEmbed()
.setColor("#2BB55F")
.setTitle("Cant find it!")
.setDescription("Are you sure you spelled it right?");


const loadingEmbed = new Discord.MessageEmbed()
.setColor("#2BB55F")
.setTitle("Loading...");

class Reply {
  constructor(args, type, mainMessage, author, client, np, id) {
    this.type = type;
    this.mainMessage = mainMessage;
    this.args = args;
    this.author = author;
    this.offset = 0;
    this.client = client;
    this.isNp = np;
    this.id = id;
  }

  makeRequest() {
    if (this.args.length < 1) {
      let incorrectSyntaxEmbed = new Discord.MessageEmbed()
        .setTitle("Oops!")
        .setDescription(`Correct syntax: ${prefix} {searchType} {searchTerm}`);
      this.mainMessage.edit(incorrectSyntaxEmbed);
      return;
    }
    console.log(this.offset);
    console.log(`this.np: ${this.isNp}`);
    spotifyLookUp
      .getData(this.args, this.type, this.offset, false, this.isNp, this.id)
      .then((res) => {
        console.log("Serving information");
        this.handleResponse(res);
      })
      .catch((error) => {
        console.log(error);
        let errorEmbed = new Discord.MessageEmbed()
          .setColor("#2BB55F")
          .setTitle("Oops!")
          .setDescription(`Looks like something went wrong: ${error}`);
        this.mainMessage.edit(errorEmbed);
      });
  }

  handleResponse() {
    throw new Error("handleResponse should be overwritten!");
  }

  reactions() {
    this.mainMessage.react("⬅️");
    this.mainMessage.react("➡️");
    this.mainMessage.react("✅");

    let filter = ({ emoji }) => ["⬅️", "➡️", "✅"].includes(emoji.name);

    // (reaction, user) => {
    //   return (
    //     reaction.emoji.name === "⬅️" &&
    //     reaction.emoji.name === "➡️" &&
    //     reaction.emoji.name === "✅" &&
    //     user.id === this.author.id
    //   );
    // };

    let collector = this.mainMessage.createReactionCollector(filter, {
      time: 60000,
    });
    collector.on("collect", (reaction, user) => {
      if (user.id === this.author.id) {
        console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        if (reaction.emoji.name === "⬅️") {
          if (this.offset > 0) {
            this.offset--;
            this.mainMessage.edit(loadingEmbed);
            this.makeRequest();
          }
        } else if (reaction.emoji.name === "➡️") {
          this.offset++;
          this.mainMessage.edit(loadingEmbed);
          this.makeRequest();
        } else if (reaction.emoji.name === "✅") {
          // console.log(client.user.id)
          let userReactions = this.mainMessage.reactions.cache.filter(
            (reaction) => reaction.users.cache.has(this.client.user.id)
          );
          try {
            for (const reaction of userReactions.values()) {
              reaction.users.remove(this.client.user.id);
            }
          } catch (error) {
            console.log(error);
            console.error("Failed to remove reactions.");
          }
        }
      }
    });

    collector.on("end", () => {
      let userReactions = this.mainMessage.reactions.cache.filter((reaction) =>
        reaction.users.cache.has(this.client.user.id)
      );
      try {
        for (const reaction of userReactions.values()) {
          reaction.users.remove(this.client.user.id);
        }
      } catch (error) {
        console.log(error);
        console.error("Failed to remove reactions.");
      }
      // console.log(`Collected ${collected.size} items`);
    });
  }
}

class Album extends Reply {
  handleResponse(res) {
    if (res === false) {
      this.mainMessage.edit(itemNotFoundEmbed);
    } else {
      let albumInformationEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle(res.name)
        .setURL(res.link)
        .setAuthor(`By: ${res.artist}`)
        .setDescription(`**Released** ${res.releaseDate}`)
        .setThumbnail(res.coverArt)
        .addFields(
          { name: "Artist", value: res.artistLink },
          { name: "Tracks", value: res.trackCount },
          { name: "Requested by", value: `<@${this.author.id}>` }
        );
      this.mainMessage.edit(albumInformationEmbed);
      this.reactions();
    }
  }
}

class Track extends Reply {
  handleResponse(res) {
    if (res === false) {
      this.mainMessage.edit(itemNotFoundEmbed);
      return false;
    } else {
      if (res.isExplicit) {
        res.name = `${res.name} (Explicit)`;
      }
      let albumInformationEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle(`${res.name}`)
        .setURL(res.link)
        .setAuthor(`By: ${res.artist}`)
        .setDescription(`**Released** ${res.releaseDate}`)
        .setThumbnail(res.coverArt)
        .addFields(
          { name: "Found in", value: `${res.album}, #${res.trackNumber} out of ${res.tracksInAlbum} track(s) total` },
          { name: "Link to album", value: `${res.albumLink}` },
          { name: "Popularity", value: `${res.popularity}/100` },
          { name: "Requested by", value: `<@${this.author.id}>` }
        );

      this.mainMessage.edit(albumInformationEmbed);
      if (this.isNp != true) {
        this.reactions();
      }
    }
  }
}

class Artist extends Reply {
  handleResponse(res) {
    if (res === false) {
      this.mainMessage.edit(itemNotFoundEmbed);
    } else {
      let artistEmbed = new Discord.MessageEmbed()
        .setColor("#2BB55F")
        .setTitle(res.name)
        .setURL(res.link)
        .setThumbnail(res.coverArt)
        .addFields(
          { name: "Followers", value: res.followers },
          { name: "Popularity", value: `${res.popularity}/100` },
          { name: "Requested by", value: `<@${this.author.id}>` }
        )
        .setFooter(`Genre(s): ${res.genres}`);

      this.mainMessage.edit(artistEmbed);
      this.reactions();      
    }
  }
}

module.exports = { Album: Album, Track: Track, Artist: Artist };
