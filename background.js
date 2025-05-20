// Background script can be used for more complex operations if needed
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getSettings") {
    chrome.storage.sync.get([
      'filterText', 
      'caseSensitive', 
      'wholeWord',
      'whitelist'
    ], function(data) {
      sendResponse(data);
    });
    return true; // Required for async response
  }
});