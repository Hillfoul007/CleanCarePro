#!/usr/bin/env node

/**
 * Memory-efficient build script for environments with limited memory (like Render free tier)
 * This script attempts to build with reduced memory usage and fallback strategies
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message) {
  console.log(`[Memory-Efficient Build] ${message}`);
}

function execWithMemoryLimit(command, memoryMB = 512) {
  const nodeOptions = `--max-old-space-size=${memoryMB}`;
  log(`Executing: NODE_OPTIONS="${nodeOptions}" ${command}`);

  try {
    execSync(`NODE_OPTIONS="${nodeOptions}" ${command}`, {
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    return true;
  } catch (error) {
    log(`Command failed with memory limit ${memoryMB}MB: ${error.message}`);
    return false;
  }
}

function cleanupBuildArtifacts() {
  log("Cleaning up build artifacts...");
  try {
    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true, force: true });
    }
    if (fs.existsSync("node_modules/.vite")) {
      fs.rmSync("node_modules/.vite", { recursive: true, force: true });
    }
  } catch (error) {
    log(`Cleanup warning: ${error.message}`);
  }
}

function checkIfBuildExists() {
  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
    log("Build already exists, skipping build process...");
    return true;
  }
  return false;
}

async function main() {
  log("Starting memory-efficient build process...");

  // Check if build already exists
  if (checkIfBuildExists()) {
    log("Build completed (already existed)");
    return;
  }

  // Clean up any existing artifacts
  cleanupBuildArtifacts();

  // Force garbage collection if available
  if (global.gc) {
    log("Running garbage collection...");
    global.gc();
  }

  // Try building with progressively higher memory limits
  const memoryLimits = [384, 512, 768, 1024];

  for (const memoryMB of memoryLimits) {
    log(`Attempting build with ${memoryMB}MB memory limit...`);

    const success = execWithMemoryLimit(
      "vite build --logLevel warn --clearScreen false",
      memoryMB,
    );

    if (success && checkIfBuildExists()) {
      log(`Build successful with ${memoryMB}MB memory limit!`);

      // Run optimization script if it exists
      if (fs.existsSync("scripts/optimize-build.js")) {
        log("Running build optimization...");
        try {
          execSync("node scripts/optimize-build.js", { stdio: "inherit" });
        } catch (error) {
          log(`Optimization failed but build succeeded: ${error.message}`);
        }
      }

      return;
    }

    // Clean up failed build artifacts
    cleanupBuildArtifacts();

    // Force garbage collection between attempts
    if (global.gc) {
      global.gc();
    }
  }

  // If all attempts failed, try one final time with a simplified config
  log("All memory-limited attempts failed. Trying minimal build...");

  // Create a minimal vite config for emergency builds
  const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: { maxParallelFileOps: 1 }
  }
});
`;

  fs.writeFileSync("vite.config.minimal.ts", minimalConfig);

  const finalSuccess = execWithMemoryLimit(
    "vite build --config vite.config.minimal.ts --logLevel error",
    256,
  );

  // Clean up minimal config
  if (fs.existsSync("vite.config.minimal.ts")) {
    fs.unlinkSync("vite.config.minimal.ts");
  }

  if (finalSuccess && checkIfBuildExists()) {
    log("Minimal build successful!");
  } else {
    log(
      "ERROR: All build attempts failed. Please check your code and dependencies.",
    );
    process.exit(1);
  }
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
