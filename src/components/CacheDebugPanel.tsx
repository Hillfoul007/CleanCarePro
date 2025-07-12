import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  forceReload,
  getCacheBuster,
  fetchWithCacheBuster,
} from "@/utils/cacheBusting";

const CacheDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>("");

  const testCacheBusting = async () => {
    try {
      const response = await fetchWithCacheBuster("/manifest.json");
      const timestamp = new Date().toISOString();
      setLastFetch(`Fetch at ${timestamp}: Status ${response.status}`);
    } catch (error) {
      setLastFetch(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const clearCaches = async () => {
    try {
      // Clear all browser caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Clear localStorage
      localStorage.clear();

      // Force reload
      forceReload();
    } catch (error) {
      console.error("Error clearing caches:", error);
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-500 hover:bg-red-600"
        size="sm"
      >
        Cache Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          Cache Debug Panel
          <Button
            onClick={() => setIsVisible(false)}
            variant="outline"
            size="sm"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs">
          <p>Cache Buster: {getCacheBuster()}</p>
          <p>App Version: v6</p>
          <p>
            Service Worker:{" "}
            {navigator.serviceWorker ? "Available" : "Not Available"}
          </p>
        </div>

        <div className="space-y-1">
          <Button onClick={testCacheBusting} className="w-full" size="sm">
            Test Cache Bust
          </Button>

          <Button
            onClick={clearCaches}
            className="w-full bg-red-500 hover:bg-red-600"
            size="sm"
          >
            Clear All & Reload
          </Button>

          <Button
            onClick={forceReload}
            className="w-full"
            size="sm"
            variant="outline"
          >
            Force Reload
          </Button>
        </div>

        {lastFetch && (
          <div className="text-xs bg-gray-100 p-2 rounded">{lastFetch}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheDebugPanel;
