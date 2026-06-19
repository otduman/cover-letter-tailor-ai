import pkg from "./package.json";

// Firefox MV3 manifest, consumed by vite-plugin-web-extension.
// The `oauth2` flow for Firefox uses identity.launchWebAuthFlow (Phase 2),
// which needs the "identity" permission and a stable add-on id below.
const manifest = {
  manifest_version: 3,
  name: "Project Tailor — AI Cover Letters",
  version: pkg.version,
  description: pkg.description,

  // Stable add-on id — required so the OAuth redirect URL never changes.
  browser_specific_settings: {
    gecko: {
      id: "project-tailor@addons",
      // 121+ for ES-module background scripts.
      strict_min_version: "121.0",
    },
  },

  icons: {
    48: "icons/icon.svg",
    96: "icons/icon.svg",
    128: "icons/icon.svg",
  },

  // No default_popup: clicking the toolbar icon fires action.onClicked,
  // which toggles the sidebar (see background/index.ts).
  action: {
    default_title: "Project Tailor",
    default_icon: { 128: "icons/icon.svg" },
  },

  sidebar_action: {
    default_panel: "src/sidebar/index.html",
    default_title: "Project Tailor",
    default_icon: { 128: "icons/icon.svg" },
  },

  options_ui: {
    page: "src/options/index.html",
    open_in_tab: true,
  },

  // Firefox MV3 uses an event-page background (scripts), not a service worker.
  background: {
    scripts: ["src/background/index.ts"],
    type: "module",
  },

  permissions: ["storage", "identity"],

  host_permissions: [
    "https://docs.googleapis.com/*",
    "https://www.googleapis.com/*",
    "https://generativelanguage.googleapis.com/*",
  ],

  content_scripts: [
    {
      matches: ["https://*.linkedin.com/jobs/*"],
      js: ["src/content/linkedin.ts"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
