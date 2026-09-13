import { readdirSync, readFileSync, writeFileSync } from "node:fs";
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);
}
const build = readFileSync(".next/BUILD_ID", "utf8").trim();
const assets = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon.svg", ...walk(".next/static").filter(path => !path.endsWith(".map")).map(path => path.replace(".next/", "/_next/"))];
const source = readFileSync("scripts/service-worker.template.js", "utf8").replace("const CACHE = __CACHE_NAME__;", `const CACHE = ${JSON.stringify(`pagokiosco-${build}`)};`).replace("const ASSETS = __PRECACHE_ASSETS__;", `const ASSETS = ${JSON.stringify(assets)};`);
writeFileSync("public/sw.js", source);
console.log(`PWA: ${assets.length} recursos preparados para la versión ${build}.`);
