window.onload = function () {
    const bahToggle = document.getElementById('bah-toggle')

    chrome.storage.sync.get('isExtensionActive', storage => {
        if (storage.isExtensionActive)
            bahToggle.checked  = storage.isExtensionActive;
    });

    bahToggle.addEventListener('change', (event) => {
        setToggleState(bahToggle.checked);
        console.log("Active: " + bahToggle.checked);

    });
}

function setToggleState(state) {
    chrome.storage.sync.get('isExtensionActive', storage => {
        chrome.storage.sync.set({
            isExtensionActive: state,
        });
    });
}