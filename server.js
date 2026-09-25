const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "com.bhavesh.4khub",
  version: "1.0.0",
  name: "Bhavesh 4K Hub",
  description: "Bhavesh 4K Hub stream provider",
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: [],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  console.log("Requested:", type, id);

  return {
    streams: []
  };
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});
