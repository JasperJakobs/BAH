let isRequested = false;

var bahActive = null;

let requestBody = "";

const requests = [
    "questionnaire_sessions",
    "given_answers"
];

function postInterceptor(url, details) {
    if (url.includes("questionnaire_sessions")) {
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

        fetch(url, requestOptions)
            .then(response => response.json())
            .then(result => {
                setTimeout(() => startQuestionnaire(result.questionnaire.questionsToAnswer, sessionUUID, rHeaders, requestBody, url), 750);
            })
            .catch(error => console.log('error', error));


        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "showOverlay"}, function (response) {
                console.log(response);
            });
            chrome.tabs.sendMessage(tabs[0].id, {action: "setOverlayMessage", message: "Vragen ophalen.."}, function (response) {
                console.log(response);
            });
        });
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
