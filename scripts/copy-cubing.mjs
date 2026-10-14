import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = path.join(root, "node_modules/cubing/dist/lib/cubing");
const dest = path.join(root, "public/cubing");

await rm(dest, { recursive: true, force: true });
await cp(src, dest, {
  recursive: true,
  filter: (p) => !p.endsWith(".map"),
});

// Vendor bare deps so the browser can load the copy as native ESM
// (bare specifiers don't resolve outside a bundler).
await mkdir(path.join(dest, "vendor"), { recursive: true });
await cp(
  path.join(root, "node_modules/random-uint-below/dist/esm/index.js"),
  path.join(dest, "vendor/random-uint-below.js"),
);

const bareTarget = (spec) => {
  if (spec === "random-uint-below") return "vendor/random-uint-below.js";
  if (spec.startsWith("cubing/")) {
    const sub = spec.slice("cubing/".length);
    if (sub === "twisty" || sub === "bluetooth") return null; // never loaded by CubeTime (3D/Bluetooth paths)
    return `${sub}/index.js`;
  }
  return null; // three/* etc. — only reached by the unused 3D/Bluetooth chunks
};

const rewritten = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(p);
    } else if (entry.name.endsWith(".js")) {
      const original = await readFile(p, "utf8");
      const updated = original.replace(
        /((?:from\s+|import\s*\(\s*|import\s+)["'])([^"']+)(["'])/g,
        (match, pre, spec, post) => {
          const target = bareTarget(spec);
          if (!target) return match;
          let rel = path.posix.relative(
            path.posix.relative(dest, path.dirname(p)) || ".",
            target,
          );
          if (!rel.startsWith(".")) rel = `./${rel}`;
          rewritten.push(`${path.relative(dest, p)}: ${spec} -> ${rel}`);
          return `${pre}${rel}${post}`;
        },
      );
      if (updated !== original) await writeFile(p, updated);
    }
  }
}
await walk(dest);

console.log(
  `cubing browser copy ready → public/cubing (${rewritten.length} bare imports rewritten)`,
);
