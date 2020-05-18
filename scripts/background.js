'use strict';
console.log("Initializing Tab Manger");
window.tabman = window.tabman || new tabManager();

// handling keyboard short cut commands
chrome.commands.onCommand.addListener(function(command) {
  console.log('Received Command:' +  command);
  window.tabman.tab.execute(command);
});

// handling icon click on browser
chrome.browserAction.onClicked.addListener(function(activeTab){
  window.tabman.viewOpenTabs();
});

// initialization of extension
chrome.runtime.onInstalled.addListener(function(e){
  console.log("TabMan Installation Finished.");
});
