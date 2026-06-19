// Firefox MV3 background (event page).
// Opens settings on first install and toggles the sidebar on toolbar click.

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.runtime.openOptionsPage();
  }
});

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});
