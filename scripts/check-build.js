#!/usr/bin/env node

/**
 * Build check utility - helps avoid unnecessary builds in deployment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkBuildExists() {
  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
    console.log("✅ Build exists");
    return true;
  }

  console.log("❌ Build does not exist");
  return false;
}

function getBuildInfo() {
  const distPath = path.join(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(distPath);
    const files = fs.readdirSync(distPath, { recursive: true });
    const jsFiles = files.filter((f) => f.toString().endsWith(".js"));
    const cssFiles = files.filter((f) => f.toString().endsWith(".css"));

    return {
      created: stats.mtime,
      totalFiles: files.length,
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length,
    };
  } catch (error) {
    return null;
  }
}

function main() {
  const command = process.argv[2];

  if (command === "--info") {
    const buildInfo = getBuildInfo();
    if (buildInfo) {
      console.log("📦 Build Information:");
      console.log(`   Created: ${buildInfo.created.toISOString()}`);
      console.log(`   Total files: ${buildInfo.totalFiles}`);
      console.log(`   JS files: ${buildInfo.jsFiles}`);
      console.log(`   CSS files: ${buildInfo.cssFiles}`);
    } else {
      console.log("❌ No build information available");
    }
    return;
  }

  const exists = checkBuildExists();
  process.exit(exists ? 0 : 1);
}

main();
