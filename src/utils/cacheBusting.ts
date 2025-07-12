// Cache busting utilities to force browser to fetch fresh content

// Generate a timestamp-based cache buster
export const getCacheBuster = (): string => {
  return Date.now().toString();
};

// Add cache buster to URL
export const addCacheBuster = (url: string): string => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${getCacheBuster()}`;
};

// Force reload with cache bypass
export const forceReload = (): void => {
  // Clear localStorage cache flags
  localStorage.removeItem("catalogue-version-v2");

  // Use location.reload with forceReload parameter (works in most browsers)
  if ("serviceWorker" in navigator) {
    // Unregister service worker to ensure fresh load
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });

      // Force reload without cache
      window.location.reload();
    });
  } else {
    // Fallback for browsers without service worker
    window.location.reload();
  }
};

// Check if we need to force a reload due to version mismatch
export const checkVersionAndReload = (): void => {
  const currentVersion = "v6"; // Increment this when you need to force reload
  const storedVersion = localStorage.getItem("app-version");

  if (storedVersion !== currentVersion) {
    console.log("Version mismatch detected, forcing reload...");
    localStorage.setItem("app-version", currentVersion);
    forceReload();
  }
};

// Fetch with cache bypass
export const fetchWithCacheBuster = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const cacheBustedUrl = addCacheBuster(url);

  return fetch(cacheBustedUrl, {
    ...options,
    cache: "no-cache",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      ...options.headers,
    },
  });
};
