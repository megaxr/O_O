import * as esbuild from "https://deno.land/x/esbuild@v0.17.7/mod.js";

await esbuild.build({
  entryPoints: ["src/server/server.ts"],
  outdir: "server",
  format:"esm",
  bundle: true,
  allowOverwrite: true,
  // minify: true,
});

await esbuild.build({
  entryPoints: ["src/server/O_O.ts"],
  outdir: "server",
  format:"esm",
  bundle: true,
  allowOverwrite: true,
  // minify: true,
});

Deno.exit();
