chrome.runtime.onInstalled.addListener(function(details){
    chrome.storage.sync.get('isExtensionActive', storage => {
        chrome.storage.sync.set({
            isExtensionActive: true,
        });
    });
});