function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  chrome.scripting.executeScript({
    target: {tabId: tabs[0].id, allFrames: true},
    files: ['./contentScript.js'],
  });

  openOptionsPage();
});
