chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes('youtube.com/watch')) {
    const url = tab.url.split('?')[1];
    const urlParameters = new URLSearchParams(url);
    const videoId = urlParameters.get('v');

    chrome.tabs.sendMessage(tabId, {
      event: 'NEW',
      videoId: videoId,
    });
  }
});
