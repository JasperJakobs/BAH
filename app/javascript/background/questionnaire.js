let correctAnswers = [];

function startQuestionnaire(questions, sessionUUID, rHeaders, requestBody, url, tabID) {
    let interval = 0;

    this.tabID = tabID;

    chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Juiste antwoorden ophalen... (0/" + questions.length + ")"}, function (response) {});

    getCorrectAnswers(questions, 0, sessionUUID, rHeaders, requestBody, url);
}

function getCorrectAnswers(questions, index, sessionUUID, rHeaders, requestBody, url) {
    let questionCount = questions.length;

    if (questionCount === index) {
        runQuestionnaire(rHeaders, requestBody, url, 0, true, generateUUID());
        return;
    }

    let question = questions[index];

    chrome.tabs.sendMessage(tabID, {
        action: "setOverlayMessage",
        message: "Juiste antwoorden ophalen... (" + (index + 1) + "/" + questionCount + ")"
    }, function (response) {});

    switch (question.questionType) {
        case "single_choice":
            getCorrectSingleChoiceAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url);
            break;
        case "multiple_choice":
            getCorrectMultipleChoiceAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url);
            break;
        case "pairing":
            getCorrectPairingAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url);
            break;
    }
}

function getCorrectSingleChoiceAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url) {
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
            getCorrectAnswers(questions, ++index, sessionUUID, rHeaders, requestBody, url);
        })
        .catch(error => console.log('error', error));
}

function getCorrectMultipleChoiceAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url) {
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
            getCorrectAnswers(questions, ++index, sessionUUID, rHeaders, requestBody, url);
        })
        .catch(error => console.log('error', error));
}

function getCorrectPairingAnswer(questions, index, question, sessionUUID, rHeaders, requestBody, url) {
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

            getCorrectAnswers(questions, ++index, sessionUUID, rHeaders, requestBody, url);
        })
        .catch(error => console.log('error', error));
}

function runQuestionnaire(rHeaders, requestBody, url, questionIndex, newSession, sessionUUID) {
    chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Vragen beantwoorden... (0/" + correctAnswers.length +")"}, function (response) {});

    if (newSession) {
        requestBody.questionnaireSessionUuid = sessionUUID;

        let raw = JSON.stringify(requestBody);

        let requestOptions = {
            method: 'POST',
            headers: rHeaders,
            body: raw,
            redirect: 'follow'
        };

        url = url.replace("given_answers", "questionnaire_sessions");

        fetch(url, requestOptions)
            .then(response => response.json())
            .then(result => {
                runQuestionnaire(rHeaders, requestBody, url, questionIndex, false, sessionUUID)
            })
            .catch(error => console.log('error', error));

        return;
    }

    let questionCount = correctAnswers.length;
    let correctAnswer = correctAnswers[questionIndex];
    // console.log(correctAnswer);

    url = url.replace("questionnaire_sessions", "given_answers");

    if (questionCount === questionIndex) {
        correctAnswers = [];
        chrome.tabs.sendMessage(tabID, {action: "endRequest"}, function (response) {});
        chrome.tabs.sendMessage(tabID, {action: "setOverlayMessage", message: "Alle vragen beantwoord..."}, function (response) {});
        endRequest();
        return;
    }

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

    requestOptions = {
        method: 'POST',
        headers: rHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(result => {
            runQuestionnaire(rHeaders, requestBody, url, ++questionIndex, false, sessionUUID)
        })
        .catch(error => console.log('error', error));

    chrome.tabs.sendMessage(tabID, {
        action: "setOverlayMessage",
        message: "Vragen beantwoorden... (" + (questionIndex + 1) + "/" + correctAnswers.length + ")"
    }, function (response) {});
}