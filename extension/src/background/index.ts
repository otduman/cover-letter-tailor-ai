// Firefox MV3 background (event page).
// - opens settings on first install
// - toggles the sidebar on toolbar-icon click
// - lights up the toolbar icon (badge) on LinkedIn job tabs
//
// Note: Firefox does NOT allow opening OR closing the sidebar without a user
// gesture (sidebarAction.open/close throw otherwise), so auto-open/close is not
// possible. The badge is the visual cue; the user toggles via icon or Ctrl+Shift+L.

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.runtime.openOptionsPage();
  }
});

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

function isJobUrl(url?: string): boolean {
  return !!url && /https:\/\/([a-z-]+\.)?linkedin\.com\/jobs\//i.test(url);
}

function setBadge(tabId: number, url?: string): void {
  if (isJobUrl(url)) {
    browser.action.setBadgeText({ tabId, text: "●" });
    browser.action.setBadgeBackgroundColor({ tabId, color: "#4A7C3F" });
    browser.action.setTitle({
      tabId,
      title: "Project Tailor — job detected (Ctrl+Shift+L to open)",
    });
  } else {
    browser.action.setBadgeText({ tabId, text: "" });
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    setBadge(tabId, changeInfo.url ?? tab.url);
  }
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browser.tabs.get(tabId);
    setBadge(tabId, tab.url);
  } catch {
    /* tab gone */
  }
});
