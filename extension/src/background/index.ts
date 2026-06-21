// Firefox MV3 background (event page).
// - opens settings on first install
// - toggles the sidebar on toolbar-icon click
// - auto-closes the sidebar when the last LinkedIn job tab is closed

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.runtime.openOptionsPage();
  }
});

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

// Track LinkedIn job tabs (announced by the content script on load).
const jobTabs = new Set<number>();

browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "LINKEDIN_TAB" && sender.tab?.id != null) {
    const tabId = sender.tab.id;
    jobTabs.add(tabId);
    // Light up the toolbar icon so it's obvious a job is ready to tailor.
    browser.action.setBadgeText({ tabId, text: "●" });
    browser.action.setBadgeBackgroundColor({ tabId, color: "#4A7C3F" });
    browser.action.setTitle({
      tabId,
      title: "Project Tailor — job detected (Ctrl+Shift+L to open)",
    });
  }
  return undefined;
});

browser.tabs.onRemoved.addListener((tabId) => {
  if (jobTabs.delete(tabId) && jobTabs.size === 0) {
    browser.sidebarAction.close();
  }
});
