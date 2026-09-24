import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory()
      ? findTests(file)
      : /\.test\.(ts|mjs)$/.test(entry.name)
        ? [file]
        : [];
  });
}
const files = ["features", "entities", "tests/integration"].flatMap(findTests).sort();
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
