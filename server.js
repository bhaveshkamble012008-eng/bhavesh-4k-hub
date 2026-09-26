const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const builder = new addonBuilder({
  id: "com.bhavesh.4khub",
  version: "1.0.0",
  name: "Bhavesh 4K Hub",
  description: "Bhavesh 4K Hub",

  resources: ["catalog", "stream"],

  types: ["movie"],

  catalogs: [
    {
      id: "bhavesh_movies",
      type: "movie",
      name: "Bhavesh 4K Hub",
      extra: [
        {
          name: "search",
          isRequired: false
        }
      ]
    }
  ],

  idPrefixes: ["tt", "ia:"]
});


// ==========================================
// CATALOG / SEARCH
// ==========================================

builder.defineCatalogHandler(async ({ extra }) => {

  const search = (extra && extra.search || "").trim();

  if (!search) {
    return { metas: [] };
  }

  const apiUrl =
    "https://archive.org/advancedsearch.php" +
    "?q=" +
    encodeURIComponent(
      'title:("' + search + '") AND mediatype:movies'
    ) +
    "&fl[]=identifier" +
    "&fl[]=title" +
    "&fl[]=description" +
    "&rows=20" +
    "&page=1" +
    "&output=json";

  try {

    const response = await fetch(apiUrl);
    const data = await response.json();

    const docs = data.response?.docs || [];

    const metas = [];

    for (const item of docs) {

      const title =
        (item.title || "").toLowerCase();

      // ======================================
      // BIG BUCK BUNNY
      // Use the official IMDb/Cinemeta ID
      // ======================================

      if (
        title.includes("big buck bunny") ||
        item.identifier === "big-buck-bunny_202406"
      ) {

        metas.push({
          id: "tt1254207",
          type: "movie",
          name: "Big Buck Bunny",
          poster:
            "https://archive.org/services/img/" +
            item.identifier,
          posterShape: "poster",
          releaseInfo: "2008"
        });

        continue;
      }


      // ======================================
      // OTHER INTERNET ARCHIVE ITEMS
      // ======================================

      metas.push({
        id: "ia:" + item.identifier,
        type: "movie",
        name: item.title || item.identifier,
        description: item.description || "",
        poster:
          "https://archive.org/services/img/" +
          item.identifier,
        posterShape: "poster"
      });
    }

    return { metas };

  } catch (error) {

    console.error(
      "Internet Archive search error:",
      error
    );

    return {
      metas: []
    };
  }
});


// ==========================================
// STREAM HANDLER
// ==========================================

builder.defineStreamHandler(async ({ type, id }) => {

  if (type !== "movie") {
    return { streams: [] };
  }


  // ==========================================
  // BIG BUCK BUNNY
  // IMDb ID = tt1254207
  // ==========================================

  if (id === "tt1254207") {

    console.log(
      "Big Buck Bunny stream requested"
    );

    return {
      streams: [
        {
          name: "Bhavesh 4K Hub",
          title: "Big Buck Bunny • Internet Archive",

          url:
            "https://archive.org/download/big-buck-bunny_202406/BigBuckBunny.mp4",

          behaviorHints: {
            bingeGroup: "bhavesh-archive"
          }
        }
      ]
    };
  }


  // ==========================================
  // OTHER INTERNET ARCHIVE ITEMS
  // ==========================================

  if (!id.startsWith("ia:")) {
    return { streams: [] };
  }

  const identifier = id.substring(3);

  try {

    const metadataUrl =
      "https://archive.org/metadata/" +
      encodeURIComponent(identifier);

    const response =
      await fetch(metadataUrl);

    const data =
      await response.json();

    const files =
      data.files || [];


    // Find a playable MP4

    const video = files.find(file => {

      if (!file || !file.name) {
        return false;
      }

      if (file.private) {
        return false;
      }

      const name =
        file.name.toLowerCase();

      return (
        name.endsWith(".mp4") &&
        !name.includes(".part") &&
        !name.includes("thumb") &&
        !name.includes("thumbnail") &&
        !name.includes("sample")
      );
    });


    if (!video) {

      console.log(
        "No MP4 found:",
        identifier
      );

      return {
        streams: []
      };
    }


    const safeFileName =
      video.name
        .split("/")
        .map(part =>
          encodeURIComponent(part)
        )
        .join("/");


    const streamUrl =
      "https://archive.org/download/" +
      encodeURIComponent(identifier) +
      "/" +
      safeFileName;


    console.log(
      "Playing:",
      streamUrl
    );


    return {
      streams: [
        {
          name: "Internet Archive",
          title: "MP4 • " + video.name,
          url: streamUrl,

          behaviorHints: {
            bingeGroup: "bhavesh-archive"
          }
        }
      ]
    };

  } catch (error) {

    console.error(
      "Internet Archive stream error:",
      error
    );

    return {
      streams: []
    };
  }
});


// ==========================================
// START SERVER
// ==========================================

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});
