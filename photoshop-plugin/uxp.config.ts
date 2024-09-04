import { UXP_Manifest, UXP_Config } from "vite-uxp-plugin";
import { version } from "./package.json";
import { EditorWebsocketUrl } from "./src/lib/variables";

const extraPrefs = {
  hotReloadPort: 8080,
  copyZipAssets: ["public-zip/*"],
};

const manifest: UXP_Manifest = {
  id: "f6c64709",
  name: "Grid Controller Plugin",
  version,
  main: "index.html",
  manifestVersion: 6,
  host: [
    {
      app: "PS",
      minVersion: "24.2.0",
    },
  ],
  entrypoints: [
    {
      type: "panel",
      id: "grid.controller.plugin.panel",
      label: {
        default: "Grid Controller Plugin",
      },
      minimumSize: { width: 230, height: 100 },
      maximumSize: { width: 2000, height: 2000 },
      preferredDockedSize: { width: 230, height: 100 },
      preferredFloatingSize: { width: 230, height: 100 },
      icons: [
        {
          width: 23,
          height: 23,
          path: "icons/icon.png",
          scale: [1, 2],
          theme: ["darkest", "dark", "medium", "lightest", "light", "all"],
        },
      ],
    },
  ],
  requiredPermissions: {
    localFileSystem: "fullAccess",
    launchProcess: {
      schemes: ["https", "slack", "file", "ws"],
      extensions: [".xd", ".psd", ".bat", ".cmd"],
    },
    network: {
      domains: [
        `ws://localhost:${extraPrefs.hotReloadPort}`, // Required for hot reload
        `${EditorWebsocketUrl}`,
      ],
    },
    allowCodeGenerationFromStrings: true,
  },
  icons: [
    {
      width: 48,
      height: 48,
      path: "icons/icon.png",
      scale: [1, 2],
      theme: ["darkest", "dark", "medium", "lightest", "light", "all"],
      species: ["pluginList"],
    },
  ],
};

export const config: UXP_Config = {
  manifest,
  ...extraPrefs,
};
