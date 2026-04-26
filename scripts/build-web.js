const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "src");
const outDir = path.join(root, "web-dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
copyDir(sourceDir, outDir);

// Keep GitHub Pages from trying to run Jekyll on the static build.
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

console.log(`Web build ready: ${path.relative(root, outDir)}`);
