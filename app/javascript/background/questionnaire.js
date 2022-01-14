let correctAnswers = [];

function startQuestionnaire(questions, sessionUUID, rHeaders, requestBody, url) {
    let interval = 0;
    console.log("Fetching correct answers")

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "setOverlayMessage", message: "Juiste antwoorden ophalen..."}, function (response) {
            console.log(response);
        });
    });

    questions.forEach(function(question, index, array) {
        if (question.questionType !== "single_choice") return;

        setTimeout(() => {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "setOverlayMessage", message: "Juiste antwoorden ophalen... (" + (index + 1) + "/" + array.length + ")"}, function (response) {
                    console.log(response);
                });
            });
            getCorrectAnswer(question, sessionUUID, rHeaders, requestBody, url)
        }, 1250 * interval);
        interval++;
    });

    setTimeout(() => { runQuestionnaire(rHeaders, requestBody, url) }, 1250 * interval);
}

function getCorrectAnswer(question, sessionUUID, rHeaders, requestBody, url) {
    let questionUUID = question.uuid;
    let answers = question.answerData.answers;
    let answerUUID = answers[0].uuid;
    url = url.replace("questionnaire_sessions", "given_answers");

    var raw = JSON.stringify({
        "questionnaireSessionUuid": sessionUUID,
        "questionUuid": questionUUID,
        "answer": {
            "uuid": answerUUID
        }
    });

    const requestOptions = {
        method: 'POST',
        headers: rHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(result => {
            console.log(result)
            const correctAnswerUUID = result.question.answerData.correctAnswer;
            if (correctAnswerUUID)
                correctAnswers.push({questionUUID: questionUUID, correctAnswerUUID: correctAnswerUUID});
        })
        .catch(error => console.log('error', error));
}

function runQuestionnaire(rHeaders, requestBody, url) {
    console.log("Filling in questionnaire");
    console.log(correctAnswers);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "setOverlayMessage", message: "Vragen beantwoorden..."}, function (response) {
            console.log(response);
        });
    });
    const sessionUUID = generateUUID();
    requestBody.questionnaireSessionUuid = sessionUUID;

    const raw = JSON.stringify(requestBody);

    const requestOptions = {
        method: 'POST',
        headers: rHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));

    setTimeout(() => {
        let interval = 0;
        correctAnswers.forEach(function(correctAnswer, index, array) {
            setTimeout(() => {
                answerUrl = url.replace("questionnaire_sessions", "given_answers");

                var raw = JSON.stringify({
                    "questionnaireSessionUuid": sessionUUID,
                    "questionUuid": correctAnswer.questionUUID,
                    "answer": {
                        "uuid": correctAnswer.correctAnswerUUID
                    }
                });

                const requestOptions = {
                    method: 'POST',
                    headers: rHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch(answerUrl, requestOptions)
                    .then(response => response.json())
                    .then(result => console.log(result))
                    .catch(error => console.log('error', error));

                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "setOverlayMessage",
                        message: "Vragen beantwoorden... (" + (index + 1) + "/" + array.length + ")"
                    }, function (response) {
                        console.log(response);
                    });
                });

                if (index === array.length - 1) {
                    setTimeout(() => {
                        correctAnswers = [];
                        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {action: "endRequest"}, function (response) {
                                console.log(response);
                            });
                            chrome.tabs.sendMessage(tabs[0].id, {action: "setOverlayMessage", message: "Toets beëindigen..."}, function (response) {
                                console.log(response);
                            });
                        });
                        endRequest();
                    }, 1250);
                }
            }, 1250 * interval);
            interval++;
        });
    }, 1250);
}