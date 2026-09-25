const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const builder = new addonBuilder({
  id: "com.bhavesh.4khub",
  version: "1.0.0",
  name: "Bhavesh 4K Hub",
  description: "Bhavesh 4K Hub",
  resources: ["stream"],
  types: ["movie"],
  catalogs: [],
  idPrefixes: ["tt"]
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type === "movie" && id === "tt1254207") {
    return {
      streams: [
        {
          name: "Test Stream",
          title: "1080p • Test Video",
          url: "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
        }
      ]
    };
  }

  return { streams: [] };
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});
