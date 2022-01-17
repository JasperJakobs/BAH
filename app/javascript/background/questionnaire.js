let correctAnswers = [];

function startQuestionnaire(questions, sessionUUID, rHeaders, requestBody, url, tabID) {
    let interval = 0;

    this.tabID = tabID;

    chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Juiste antwoorden ophalen..."}, function (response) {
        console.log(response);
    });


    questions.forEach(function(question, index, array) {

        setTimeout(() => {
            chrome.tabs.sendMessage(tabID, {
                action: "setOverlayMessage",
                message: "Juiste antwoorden ophalen... (" + (index + 1) + "/" + array.length + ")"
            }, function (response) {
                console.log(response);
            });

            switch (question.questionType) {
                case "single_choice":
                    getCorrectSingleChoiceAnswer(question, sessionUUID, rHeaders, requestBody, url);
                    break;
                case "multiple_choice":
                    getCorrectMultipleChoiceAnswer(question, sessionUUID, rHeaders, requestBody, url);
                    break;
                case "pairing":
                    getCorrectPairingAnswer(question, sessionUUID, rHeaders, requestBody, url);
                    break;
            }
        }, 1250 * interval);

        interval++;
    });

    setTimeout(() => { runQuestionnaire(rHeaders, requestBody, url) }, 1250 * interval);
}

function getCorrectSingleChoiceAnswer(question, sessionUUID, rHeaders, requestBody, url) {
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
            const correctAnswerUUID = result.question.answerData.correctAnswer;
            if (correctAnswerUUID)
                correctAnswers.push({
                    questionUUID: questionUUID,
                    correctAnswerUUID: correctAnswerUUID,
                    questionType: 'single_choice'
                });
        })
        .catch(error => console.log('error', error));
}

function getCorrectMultipleChoiceAnswer(question, sessionUUID, rHeaders, requestBody, url) {
    let questionUUID = question.uuid;
    let answers = question.answerData.answers;
    let answerUUID = [
        answers[0].uuid
    ];
    url = url.replace("questionnaire_sessions", "given_answers");

    var raw = JSON.stringify({
        "questionnaireSessionUuid": sessionUUID,
        "questionUuid": questionUUID,
        "answer": {
            "uuids": answerUUID
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
            const correctAnswerUUIDs = result.question.answerData.correctAnswers;
            if (correctAnswerUUIDs)
                correctAnswers.push({
                    questionUUID: questionUUID,
                    correctAnswerUUID: correctAnswerUUIDs,
                    questionType: 'multiple_choice'
                });
        })
        .catch(error => console.log('error', error));
}

function getCorrectPairingAnswer(question, sessionUUID, rHeaders, requestBody, url) {
    const questionUUID = question.uuid;
    // let answers = question.answerData.answers;
    const leftAnswers = question.answerData.leftAnswers;
    const rightAnswers = question.answerData.rightAnswers;
    let answerUUID = "Array()";

    leftAnswers.forEach(function(leftAnswer, index, array) {
        answerUUID.push(JSON.stringify(
            {
                "left": leftAnswer.uuid,
                "right": rightAnswers[index].uuid
            }
        ));
    });

    url = url.replace("questionnaire_sessions", "given_answers");

    var raw = JSON.stringify({
        "questionnaireSessionUuid": sessionUUID,
        "questionUuid": questionUUID,
        "answer": {
            "pairs": answerUUID
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
            const correctPairs = result.question.answerData.correctPairs;
            let correctAnswerUUIDs = Array();

            correctPairs.forEach(function (correctPair, index, array) {
                const leftAnswer = correctPair.left.uuid;
                const rightAnswer = correctPair.right.uuid;
                correctAnswerUUIDs.push(JSON.stringify({
                    "left": leftAnswer,
                    "right": rightAnswer
                }));
            });

            if (correctAnswerUUIDs)
                correctAnswers.push({
                    questionUUID: questionUUID,
                    correctAnswerUUID: correctAnswerUUIDs,
                    questionType: 'pairing'
                });
        })
        .catch(error => console.log('error', error));
}

function runQuestionnaire(rHeaders, requestBody, url) {
        chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Vragen beantwoorden..."}, function (response) {
            console.log(response);
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
        .catch(error => console.log('error', error));

    setTimeout(() => {
        let interval = 0;
        correctAnswers.forEach(function(correctAnswer, index, array) {
            setTimeout(() => {
                let answerUrl = url.replace("questionnaire_sessions", "given_answers");

                let raw = "";

                switch (correctAnswer.questionType) {
                    case 'single_choice':
                        raw = JSON.stringify({
                            "questionnaireSessionUuid": sessionUUID,
                            "questionUuid": correctAnswer.questionUUID,
                            "answer": {
                                "uuid": correctAnswer.correctAnswerUUID
                            }
                        });
                        break;
                    case 'multiple_choice':
                        raw = JSON.stringify({
                            "questionnaireSessionUuid": sessionUUID,
                            "questionUuid": correctAnswer.questionUUID,
                            "answer": {
                                "uuids": correctAnswer.correctAnswerUUID
                            }
                        });
                        break
                    case 'pairing':
                        raw = JSON.stringify({
                            "questionnaireSessionUuid": sessionUUID,
                            "questionUuid": correctAnswer.questionUUID,
                            "answer": {
                                "pairs": correctAnswer.correctAnswerUUID
                            }
                        });
                        break
                }

                const requestOptions = {
                    method: 'POST',
                    headers: rHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch(answerUrl, requestOptions)
                    .then(response => response.json())
                    .catch(error => console.log('error', error));

                chrome.tabs.sendMessage(tabID, {
                    action: "setOverlayMessage",
                    message: "Vragen beantwoorden... (" + (index + 1) + "/" + array.length + ")"
                }, function (response) {
                    console.log(response);
                });

                if (index === array.length - 1) {
                    setTimeout(() => {
                        correctAnswers = [];
                        chrome.tabs.sendMessage(tabID, {action: "endRequest"}, function (response) {
                            console.log(response);
                        });
                        chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Toets beëindigen..."}, function (response) {
                            console.log(response);
                        });
                        endRequest();
                    }, 1250);
                }
            }, 1250 * interval);
            interval++;
        });
    }, 1250);
}