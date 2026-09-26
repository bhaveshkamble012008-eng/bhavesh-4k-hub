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
  idPrefixes: ["tt"]
});

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  const search = (extra && extra.search || "").toLowerCase();

  const movies = [
    {
      id: "tt1254207",
      type: "movie",
      name: "Big Buck Bunny",
      poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg"
    }
  ];

  if (!search) {
    return { metas: movies };
  }

  return {
    metas: movies.filter(movie =>
      movie.name.toLowerCase().includes(search)
    )
  };
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type === "movie" && id === "tt1254207") {
    return {
      streams: [
        {
          name: "Test Stream",
          title: "1080p • Test Video",
          url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-60fps-30s/master/video.mp4"
        }
      ]
    };
  }

  return { streams: [] };
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
});
