let isRequested = false;

let bahActive = null;

let requestBody = "";

const requests = [
    "questionnaire_sessions",
    "given_answers"
];

function postInterceptor(url, details) {
    if (url.includes("questionnaire_sessions")) {

        let tabID = 0;

        isRequested = true;

        const requestHeaders = details.requestHeaders;
        const rHeaders = new Headers();
        const sessionUUID = generateUUID();

        requestBody.questionnaireSessionUuid = sessionUUID;

        const raw = JSON.stringify(requestBody);

        requestHeaders.forEach(requestHeader => rHeaders.append(requestHeader.name, requestHeader.value));

        const requestOptions = {
            method: 'POST',
            headers: rHeaders,
            body: raw,
            redirect: 'follow'
        };

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            tabID = tabs[0].id;

            chrome.tabs.sendMessage(tabID, {action: "showOverlay"}, function (response) {

            });
            chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Vragen ophalen.."}, function (response) {

            });
        });

        fetch(url, requestOptions)
            .then(response => response.json())
            .then(result => {
                setTimeout(() => startQuestionnaire(result.questionnaire.questionsToAnswer, sessionUUID, rHeaders, requestBody, url, tabID), 0);
            })
            .catch(error => console.log('error', error));
    }
}

function endRequest() {
    requestBody = "";
    isRequested = false;
}

// Get the body of the request
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (isRequested || !bahActive) return;
        const url = details.url;

        if (!requests.some(value => url.includes(value))) return;

        if(details.method === "POST")
            var postedString = decodeURIComponent(String.fromCharCode.apply(null,
                new Uint8Array(details.requestBody.raw[0].bytes)));
        if (!postedString) return
        requestBody = JSON.parse(postedString);

    },
    { urls: ["*://*.etd-academy.nl/api/*"]},
    ['extraHeaders', 'requestBody']
);

// Get the headers of the request/
chrome.webRequest.onSendHeaders.addListener(
    (details) => {
        if (isRequested || !bahActive) return;
        const url = details.url;

        if (!requests.some(value => url.includes(value))) return;

        if (details.method === "POST") postInterceptor(url, details);

    },
    { urls: ["*://*.etd-academy.nl/api/*"]},
    ['requestHeaders']
);


chrome.storage.sync.get('isExtensionActive', storage => {
    if (storage.isExtensionActive)
        bahActive = storage.isExtensionActive;
});

chrome.storage.onChanged.addListener(changes => {
    if (changes.isExtensionActive) {
        bahActive = changes.isExtensionActive.newValue;
    }
});
