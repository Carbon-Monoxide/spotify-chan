require("dotenv").config();
const fetch = require("node-fetch");
const request = require("request-promise-native");

//Im using a .env file, if you want to run them make your own

const base64Credentials = Buffer.from(
  `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
).toString("base64");

async function getSpotifyAccessData() {
  let accessData = await request({
    method: "POST",
    uri: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization: `Basic ${base64Credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    json: true,
  });
  // console.log(accessData);
  return accessData;
}

let accessData;
async function getData(searchTerms, type, offset, getNewToken, isNp, id) {
  if (getNewToken == true || !accessData) {
    console.log("before access data");
    accessData = await getSpotifyAccessData();
    console.log("after access data");
  }
  console.log(`isNp: ${isNp}`);
  if (accessData) {
    const token = accessData.access_token;
    // console.log(token);

    let searchTerm = searchTerms
      .join("%20")
      .replace(/[^a-z0-9%\/\:\.\?\=\$\&\-]/gi, "")
      .toLowerCase();

    let url;
    if (isNp) {
      url = `https://api.spotify.com/v1/tracks/${id}`;
    } else {
      url = `https://api.spotify.com/v1/search?q=${searchTerm}&type=${type}&limit=1&offset=${offset}`;
    }

    console.log("Requesting spotify information");
    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) =>
        // console.log(res);
        // if (res.status !== 200) {
        //   throw new Error(res.status);
        // }
        res.json()
      )
      .then((json) => {
        // console.log(json);
        let catagory = type + "s";

        if (json.error) {
          if (json.error.status === 400) {
            return false;
          } else {
            throw new Error("Retrying with token....");
          }
        }

        let information;
        if (isNp != true) {
          if (json[catagory].items.length === 0) {
            return false;
          }
          information = json[catagory].items[0];
        } else {
          //         information = json.
          return {
            name: json.name,
            coverArt: json.album.images[0].url,
            link: json.external_urls.spotify,
            artist: json.artists[0].name,
            releaseDate: json.album.release_date,
            popularity: json.popularity,
            album: json.album.name,
            tracksInAlbum: json.album.total_tracks,
            albumLink: json.album.external_urls.spotify,
            trackNumber: json.track_number,
            isExplicit: json.explicit
          };
        }
        // console.log(json[catagory].items[0]);
        // console.log(json);
        if (catagory === "albums") {
          return {
            name: information.name,
            coverArt: information.images[0].url,
            link: information.external_urls.spotify,
            artist: information.artists[0].name,
            artistLink: information.artists[0].href,
            releaseDate: information.release_date,
            trackCount: information.total_tracks,
          };
        } else if (catagory === "tracks") {
          return {
            name: information.name,
            coverArt: information.album.images[0].url,
            link: information.external_urls.spotify,
            artist: information.artists[0].name,
            releaseDate: information.album.release_date,
            popularity: information.popularity,
            album: information.album.name,
            tracksInAlbum: information.album.total_tracks,
            albumLink: information.album.external_urls.spotify,
            trackNumber: information.track_number,
            isExplicit: information.explicit
          };
        } else if (catagory === "artists") {
          return {
            name: information.name,
            coverArt: information.images[0].url,
            link: information.external_urls.spotify,
            followers: information.followers.total,
            genres: information.genres.join(", "),
            popularity: information.popularity,
          };
        }
      })
      .catch((err) => {
        console.log(`ERROR: ${err}`);
        return getData(searchTerms, type, offset, true, isNp, id);
      });

    //   return fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    //     method: "GET",
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //     json: true,
    //   })
    //     .then((res) => res.json())
    //     .then((json) => {
    //       console.log("got spotify information");
    //       return {
    //         albumName: json.name,
    //         albumCoverArt: json.images[0].url,
    //         albumLink: json.external_urls.spotify,
    //         albumArtist: json.label,
    //         albumReleaseDate: json.release_date,
    //       };
    //     });
  }
}

module.exports = { getData: getData };
