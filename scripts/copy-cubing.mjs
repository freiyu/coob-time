import { cp, rm } from "node:fs/promises";

const src = new URL("../node_modules/cubing/dist/lib/cubing/", import.meta.url);
const dest = new URL("../public/cubing/", import.meta.url);

await rm(dest, { recursive: true, force: true });
await cp(src, dest, {
  recursive: true,
  filter: (path) => !path.endsWith(".map"),
});
console.log("cubing browser copy ready → public/cubing");
