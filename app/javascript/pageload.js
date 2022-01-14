var bahActive = null;

chrome.storage.sync.get('isExtensionActive', storage => {
    if (storage.isExtensionActive)
        bahActive = storage.isExtensionActive;
});

window.onload = function() {
    if (!bahActive) return;

    changeLogo();

    chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.action === 'showOverlay') showOverlay();

        if (msg.action === 'hideOverlay') hideOverlay();

        if (msg.action === 'endRequest') window.location.href = msg.hrefUrl;

        if (msg.action === 'setOverlayMessage') {
            setOverlayMessage(msg.message);
        }

        sendResponse("Message recieved!");
    });
}