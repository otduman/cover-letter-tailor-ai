import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => manifest,
      browser: "firefox",
      // Auto-launches Firefox with the add-on loaded during `npm run dev`.
      // A dedicated, persistent profile keeps your saved keys, your LinkedIn
      // login, AND a stable OAuth redirect URL across restarts.
      // NOTE: close your normal Firefox windows before `npm run dev`, or
      // Firefox shows the profile-picker dialog.
      webExtConfig: {
        target: ["firefox-desktop"],
        firefoxProfile: resolve(process.cwd(), ".firefox-profile"),
        profileCreateIfMissing: true,
        keepProfileChanges: true,
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
