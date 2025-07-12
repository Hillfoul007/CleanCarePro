// Simple test to verify API client doesn't have response stream issues
import { apiClient } from "./lib/apiClient.js";

async function testApiClient() {
  console.log("Testing API client...");

  try {
    // Test health check endpoint
    const response = await apiClient.healthCheck();
    console.log("Health check response:", response);

    // Test multiple rapid requests to same endpoint (should use deduplication)
    const promises = [
      apiClient.healthCheck(),
      apiClient.healthCheck(),
      apiClient.healthCheck(),
    ];

    const results = await Promise.all(promises);
    console.log("Multiple requests results:", results);

    console.log("✅ API client test passed - no body stream errors");
  } catch (error) {
    console.error("❌ API client test failed:", error);
    if (error.message.includes("body stream already read")) {
      console.error("🚫 Body stream error still present!");
    }
  }
}

// Only run if this file is executed directly
if (typeof window !== "undefined") {
  window.testApiClient = testApiClient;
  console.log("API client test function available as window.testApiClient()");
}

export { testApiClient };
