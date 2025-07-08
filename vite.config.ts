import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 10000,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      // Reduce memory usage during build
      target: "esnext",
      minify: mode === "production" ? "esbuild" : false, // esbuild is faster and uses less memory than terser
      rollupOptions: {
        // Reduce memory pressure by limiting concurrent operations
        maxParallelFileOps: 2,
        output: {
          // Smaller, more manageable chunks
          manualChunks: (id) => {
            // Create smaller chunks to reduce memory usage
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "react-vendor";
              }
              if (id.includes("@radix-ui")) {
                return "ui-vendor";
              }
              if (id.includes("leaflet")) {
                return "leaflet-vendor";
              }
              if (id.includes("lucide-react")) {
                return "icons-vendor";
              }
              return "vendor";
            }
          },
          // Reduce chunk size for better memory management
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      // Enable CSS code splitting to reduce memory usage
      cssCodeSplit: true,
      // Disable source maps in production to save memory
      sourcemap: false,
      // Reduce memory by not creating extra bundles
      reportCompressedSize: false,
    },
    // Enable gzip compression for assets
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    plugins: [
      react({
        // Enable React Fast Refresh for better dev experience
        fastRefresh: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
