// Middleware to disable caching for specific resources
const noCache = (options = {}) => {
  return (req, res, next) => {
    // Check if this is a request that should bypass cache
    const noCachePatterns = options.patterns || [
      /\/index\.html$/,
      /\.html$/,
      /manifest\.json/,
      /sw\.js$/,
    ];

    const shouldDisableCache = noCachePatterns.some(
      (pattern) => pattern.test(req.url) || pattern.test(req.path),
    );

    if (shouldDisableCache) {
      // Remove ETag header that Express.js sets by default
      res.removeHeader("ETag");

      // Set comprehensive no-cache headers
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");

      // Add a timestamp to make each response unique
      res.setHeader("X-Timestamp", Date.now().toString());

      // Add vary header to prevent intermediate caches
      res.setHeader("Vary", "*");
    }

    next();
  };
};

module.exports = noCache;
