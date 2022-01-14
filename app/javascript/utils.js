const logoUrl = chrome.extension.getURL("assets/img/bah_logo.png");

function showOverlay() {
    const bahOverlay = document.getElementById("bahOverlay");
    if (document.contains(bahOverlay)) return;
    const overlay = "<img src=\"" + logoUrl + "\" style=\"display: block;margin-left: auto;margin-right: auto;margin-top: 10vh;width: 40%;\"> <h1 style=\"margin-top: 5vw;\">TEST GESTART!</h1> <p>Een moment geduld aub terwijl wij uw vragen invullen...</p><p id='bahOverlayMessage'></p>";
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;background:rgba(0,0,0,0.8);left:0;right:0;top:0;bottom:0;z-index:1000;color: white;text-align: center;';
    div.id = "bahOverlay"
    div.innerHTML = overlay;

    document.body.appendChild(div);
    document.body.style.overflow = "hidden";
}

function setOverlayMessage(message) {
    const overlayMessage = document.getElementById("bahOverlayMessage");
    if (document.contains(overlayMessage)) overlayMessage.innerHTML = message;
}

function hideOverlay() {
    let bahOverlay = document.getElementById("bahOverlay");
    if (document.contains(bahOverlay)) bahOverlay.remove();
}

function changeLogo() {
    const logo = getImagesByAlt("bcc")[0];
    if(document.contains(logo)) logo.src = logoUrl;
}

function getImagesByAlt(alt) {
    const allImages = document.getElementsByTagName("img");
    let images = [];
    for (let i = 0, len = allImages.length; i < len; ++i) {
        if (allImages[i].alt === alt) {
            images.push(allImages[i]);
        }
    }
    return images;
}