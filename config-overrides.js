module.exports = function override(config, env) {
  //do stuff with the webpack config...config.resolve.alias = {
  config.resolve.alias = {
    ...config.resolve.alias,
    "react-redux":
      process.env.NODE_ENV === "development"
        ? "react-redux/dist/react-redux.js"
        : "react-redux/lib",
  };
  return config;
};
