import * as esbuild from "https://deno.land/x/esbuild@v0.17.7/mod.js";

await esbuild.build({
  entryPoints: ["src/app/app.ts"],
  outdir: "dist/js",
  bundle: true,
  platform: "browser",
  format: "esm",
  allowOverwrite: true,
  // minify: true,
});

Deno.exit();
