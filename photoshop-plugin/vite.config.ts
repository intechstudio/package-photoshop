import { defineConfig } from "vite";
import { runAction, uxp, uxpSetup } from "vite-uxp-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess/dist/autoProcess";
import { config } from "./uxp.config";

const action = process.env.ACTION;
const mode = process.env.MODE;

if (action) {
  runAction({}, action);
  process.exit();
}

const shouldNotEmptyDir =
  mode === "dev" && config.manifest.requiredPermissions?.enableAddon;

export default defineConfig({
  plugins: [
    uxp(config, mode),
    svelte({ preprocess: sveltePreprocess({ typescript: true }) }),
  ],
  build: {
    sourcemap: mode && ["dev", "build"].includes(mode) ? true : false,
    // minify: false,
    emptyOutDir: !shouldNotEmptyDir,
    rollupOptions: {
      external: ["photoshop", "uxp", "fs", "os", "path", "process", "shell"],
      output: {
        format: "cjs",
      },
    },
  },
  publicDir: "public",
});
