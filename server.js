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
  idPrefixes: ["ia"]
});

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

    const metas = (data.response.docs || []).map(item => ({
      id: "ia:" + item.identifier,
      type: "movie",
      name: item.title || item.identifier,
      description: item.description || "",
      poster:
        "https://archive.org/services/img/" +
        item.identifier
    }));

    return { metas };

  } catch (error) {
    console.error("Internet Archive search error:", error);
    return { metas: [] };
  }
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "movie" || !id.startsWith("ia:")) {
    return { streams: [] };
  }

  const identifier = id.substring(3);

  try {
    const response = await fetch(
      "https://archive.org/metadata/" +
      encodeURIComponent(identifier)
    );

    const data = await response.json();
    const files = data.files || [];

    // Find a real playable MP4 file.
    const video = files.find(file => {
      if (!file || !file.name) return false;
      if (file.private) return false;

      const name = file.name.toLowerCase();

      return (
        name.endsWith(".mp4") &&
        !name.includes(".part") &&
        !name.includes("thumb") &&
        !name.includes("sample")
      );
    });

    if (!video) {
      console.log("No playable MP4 found for:", identifier);
      return { streams: [] };
    }

    // Keep "/" characters in folders while safely encoding spaces
    // and other special characters.
    const safeFileName = video.name
      .split("/")
      .map(part => encodeURIComponent(part))
      .join("/");

    const streamUrl =
      "https://archive.org/download/" +
      encodeURIComponent(identifier) +
      "/" +
      safeFileName;

    console.log("Playing:", streamUrl);

    return {
      streams: [
        {
          name: "Internet Archive",
          title: "MP4 • " + video.name,
          url: streamUrl,
          behaviorHints: {
            bingeGroup: "internet-archive"
          }
        }
      ]
    };

  } catch (error) {
    console.error("Internet Archive stream error:", error);
    return { streams: [] };
  }
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});
