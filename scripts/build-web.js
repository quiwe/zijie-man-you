const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

function getBuildVersion() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 12);
  }

  try {
    return execSync("git rev-parse --short=12 HEAD", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
copyDir(sourceDir, outDir);

const buildVersion = getBuildVersion();
const indexPath = path.join(outDir, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replace('href="./styles.css"', `href="./styles.css?v=${buildVersion}"`)
  .replace('src="./game.js"', `src="./game.js?v=${buildVersion}"`);
fs.writeFileSync(indexPath, html);

// Keep GitHub Pages from trying to run Jekyll on the static build.
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");

console.log(`Web build ready: ${path.relative(root, outDir)} (v=${buildVersion})`);
