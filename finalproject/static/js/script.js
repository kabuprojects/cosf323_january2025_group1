document.addEventListener("DOMContentLoaded", function () {
    const scoreElement = document.getElementById('user-score');
    let userScore = 0; // Keep track of the score in JS

    function updateUserScoreDisplay() {
        if (scoreElement) {
            scoreElement.innerText = userScore;
        } else {
            console.error("Element with ID 'user-score' not found!");
        }
    }

    // Fetch and display the initial score
    function fetchInitialScore() {
        fetch('/get_score')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch score: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && typeof data.score === 'number') {
                    userScore = data.score; // Update the JS variable
                    updateUserScoreDisplay(); // Display it
                } else {
                    console.error("Invalid score data:", data);
                }
            })
            .catch(error => {
                console.error("Error fetching score:", error);
            });
    }

    fetchInitialScore(); // Call the function

    // Helper function to fetch data and handle loading state
    async function fetchData(url, targetElementId, processDataCallback) {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) return; // Important: Check if element exists
        targetElement.classList.add('loading');
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            processDataCallback(data, targetElement); // Pass both data and element
        } catch (error) {
            targetElement.textContent = `Error: ${error.message}`;
            targetElement.classList.remove('loading');
        }
    }

    // --- Phishing Simulation ---
    let currentEmail;
    let emails = [];
    let currentEmailIndex = 0;
    const phishingContentEl = document.getElementById('phishingContent');
    const reportBtn = document.getElementById('reportButton'); // Corrected ID
    const acceptBtn = document.getElementById('acceptButton');
    const ignoreBtn = document.getElementById('ignoreButton');
    const phishingFeedback = document.getElementById('phishingFeedback');
    const phishingOverlay = document.getElementById('phishingOverlay');
    const overlayText = document.getElementById('overlayText');
    const nextEmailButton = document.getElementById('nextEmailButton');

    function displayEmail(email) {
        currentEmail = email;
        if (!phishingContentEl) return;
        const emailStructure = `
                    <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                        <strong>From:</strong> ${email.from || 'Unknown'}
                    </div>
                    <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                        <strong>To:</strong> ${email.to || 'Undisclosed Recipients'}
                    </div>
                    <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                        <strong>Subject:</strong> ${email.subject || 'No Subject'}
                    </div>
                    <div>
                        ${email.body || 'No content provided.'}
                    </div>
                `;
        phishingContentEl.innerHTML = emailStructure;
        phishingContentEl.classList.remove('loading');
        phishingOverlay.style.display = 'none';
        phishingFeedback.textContent = '';
    }

    function loadAndDisplayEmail() {
        if (emails && emails.length > 0) {
            displayEmail(emails[currentEmailIndex]);
        } else {
            fetch('/api/phishing')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch emails: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    emails = data;
                    if (emails.length > 0) {
                        currentEmailIndex = 0;
                        displayEmail(emails[currentEmailIndex]);
                    } else {
                        if (phishingContentEl) {
                            phishingContentEl.innerHTML = "No emails available.";
                            phishingContentEl.classList.remove('loading');
                        }
                    }
                })
                .catch(error => {
                    if (phishingContentEl) {
                        phishingContentEl.textContent = `Error: ${error.message}`;
                        phishingContentEl.classList.remove('loading');
                    }
                });
        }
    }
    loadAndDisplayEmail();

    if (nextEmailButton) {
        nextEmailButton.addEventListener('click', () => {
            currentEmailIndex = (currentEmailIndex + 1) % emails.length;
            displayEmail(emails[currentEmailIndex]);
        });
    }

    function handleAction(action) {
        if (!currentEmail) return;

        let message = '';
        let isCorrect = false;
        let points = 0; // Define points
        switch (action) {
            case 'report':
                if (currentEmail.correctAction === 'report') {
                    message = 'You reported the email. You have evaded hacking!';
                    isCorrect = true;
                    points = 150;
                } else {
                    message = 'Incorrect. This was a phishing attempt. You should have reported it.';
                }
                break;
            case 'accept':
                if (currentEmail.correctAction === 'accept') {
                    message = 'You accepted the email. You have evaded hacking!';
                    isCorrect = true;
                    points = 150;
                } else {
                    message = 'Incorrect.  This was a phishing attempt. Accepting it is dangerous.';
                }
                break;
            case 'ignore':
                if (currentEmail.correctAction === 'ignore') {
                    message = 'You ignored the email. You have evaded hacking!';
                    isCorrect = true;
                    points = 150;
                } else {
                    message = 'Incorrect. This was a phishing attempt. Ignoring it is not the best action.';
                }
                break;
            default:
                message = 'Invalid action.';
        }

        overlayText.textContent = message;
        phishingOverlay.style.display = 'flex';
        overlayText.style.color = isCorrect ? "green" : "red";

        if (isCorrect) {
            updateScore(points); // Call updateScore when the answer is correct
        }
    }

    if (reportBtn) {
        reportBtn.addEventListener('click', () => handleAction('report'));
    }
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => handleAction('accept'));
    }
    if (ignoreBtn) {
        ignoreBtn.addEventListener('click', () => handleAction('ignore'));
    }

    // --- Password Strength Checker ---
    const passwordInput = document.getElementById('passwordInput');
    const passwordStrengthDiv = document.querySelector('#passwordStrength div');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const showPasswordCheckbox = document.getElementById('showPassword');

    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            passwordStrengthDiv.style.width = strength + '%';
            passwordStrengthDiv.style.backgroundColor = getStrengthColor(strength);

            let strengthText = '';
            if (strength < 20) {
                strengthText = 'Very Weak';
            } else if (strength < 40) {
                strengthText = 'Weak';
            } else if (strength < 60) {
                strengthText = 'Moderate';
            } else if (strength < 80) {
                strengthText = 'Strong';
            } else {
                strengthText = 'Very Strong';
            }
            passwordStrengthText.textContent = strengthText;
            passwordStrengthText.style.color = getStrengthColor(strength);
        });
    }

    if (showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener('change', function () {
            passwordInput.type = this.checked ? 'text' : 'password';
        });
    }

    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length > 8) strength += 20;
        if (password.match(/[a-z]/)) strength += 15;
        if (password.match(/[A-Z]/)) strength += 15;
        if (password.match(/[0-9]/)) strength += 15;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 35;
        return Math.min(strength, 100);
    }

    function getStrengthColor(strength) {
        if (strength < 20) return '#e53e3e';
        if (strength < 40) return '#dc2626';
        if (strength < 60) return '#f59e0b';
        if (strength < 80) return '#65a30d';
        return '#16a34a';
    }

    // --- Security Quiz ---
    const quizCategoriesDiv = document.getElementById('quizCategories');
    const quizQuestionsDiv = document.getElementById('quizQuestions');
    const quizQuestionEl = document.getElementById('quizQuestion');
    const quizOptionsDiv = document.getElementById('quizOptions');
    const quizFeedbackDiv = document.getElementById('quizFeedback');
    const nextQuestionButton = document.getElementById('nextQuestionButton');
    const retakeQuizButton = document.getElementById('retakeQuizButton');

    let currentCategory = null;
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let quizScore = 0; // Use a different variable name for quiz score
    let quizEnded = false;

    if (quizCategoriesDiv) {
        quizCategoriesDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                currentCategory = event.target.dataset.category;
                quizCategoriesDiv.classList.add('hidden');
                quizQuestionsDiv.classList.remove('hidden');
                loadQuizQuestions(currentCategory);
            }
        });
    }

    if (retakeQuizButton) {
        retakeQuizButton.addEventListener('click', () => {
            currentQuestionIndex = 0;
            quizScore = 0;
            quizEnded = false;
            quizFeedbackDiv.textContent = '';
            quizFeedbackDiv.className = 'quiz-feedback';
            nextQuestionButton.classList.remove('hidden');
            retakeQuizButton.classList.add('hidden');
            loadQuizQuestions(currentCategory);
        });
    }

    if (nextQuestionButton) {
        nextQuestionButton.addEventListener('click', () => {
            currentQuestionIndex++;
            quizFeedbackDiv.textContent = '';
            quizFeedbackDiv.className = 'quiz-feedback';
            loadAndDisplayQuizQuestion();
        });
    }

    function loadQuizQuestions(category) {
        if (!quizQuestionEl) return;
        quizQuestionEl.classList.add('loading');
        fetch(`/api/quiz?category=${category}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch quiz questions: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                currentQuestions = data;
                currentQuestionIndex = 0;
                quizScore = 0;
                quizEnded = false;
                loadAndDisplayQuizQuestion();
                quizQuestionEl.classList.remove('loading');
            })
            .catch(error => {
                quizQuestionEl.textContent = `Error: ${error.message}`;
                quizQuestionEl.classList.remove('loading');
            });
    }

    function loadAndDisplayQuizQuestion() {
        if (!quizQuestionsDiv) return;
        if (currentQuestionIndex < currentQuestions.length) {
            const questionData = currentQuestions[currentQuestionIndex];
            quizQuestionEl.textContent = questionData.question;
            quizOptionsDiv.innerHTML = '';

            questionData.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.textContent = option;
                button.dataset.optionIndex = index;
                button.addEventListener('click', () => {
                    checkAnswer(index, questionData.correctAnswerIndex);
                });
                quizOptionsDiv.appendChild(button);
            });
            nextQuestionButton.classList.add('hidden');
        } else {
            endQuiz();
        }
    }

    function checkAnswer(selectedIndex, correctAnswerIndex) {
        if (quizEnded) return;
        if (selectedIndex === correctAnswerIndex) {
            quizFeedbackDiv.textContent = 'Correct!';
            quizFeedbackDiv.className = 'correct quiz-feedback';
            quizScore++;
            updateScore(150); // Award 5 points for a correct answer
        } else {
            quizFeedbackDiv.textContent = 'Incorrect!';
            quizFeedbackDiv.className = 'incorrect quiz-feedback';
        }

        if (currentQuestionIndex < currentQuestions.length - 1) {
            nextQuestionButton.classList.remove('hidden');
        } else {
            endQuiz();
        }

        const options = quizOptionsDiv.querySelectorAll('button');
        options.forEach(button => {
            button.disabled = true;
        });
    }

    function endQuiz() {
        quizEnded = true;
        if (!quizQuestionEl) return;
        quizQuestionEl.textContent = `Quiz Ended! Your score: ${quizScore} out of ${currentQuestions.length}.`;
        quizOptionsDiv.innerHTML = '';
        nextQuestionButton.classList.add('hidden');
        retakeQuizButton.classList.remove('hidden');

        if (quizScore === currentQuestions.length) {
            quizFeedbackDiv.textContent = "Perfect Score! Well done!";
            quizFeedbackDiv.className = "correct quiz-feedback";
        } else if (quizScore >= currentQuestions.length / 2) {
            quizFeedbackDiv.textContent = "Good job!";
            quizFeedbackDiv.className = "correct quiz-feedback";
        } else {
            quizFeedbackDiv.textContent = "Try again to improve your score.";
            quizFeedbackDiv.className = "incorrect quiz-feedback";
        }
    }

       // --- HTTPS Education ---
       fetchData('/api/https', 'httpsContent', (data, element) => {
        const httpsContentDiv = document.getElementById('httpsContent');
        if (!httpsContentDiv) return;
        httpsContentDiv.innerHTML = '<h3>' + data.heading + '</h3>';

        const videoList = document.createElement('ul');
        videoList.id = 'httpsVideosList';

        if(data && data.videos && Array.isArray(data.videos)){
            data.videos.forEach(video => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = video.url;
                link.textContent = video.title;
                listItem.appendChild(link);
                videoList.appendChild(listItem);
            });
        }


        httpsContentDiv.appendChild(videoList);
        httpsContentDiv.classList.remove('loading');
    });

    // --- URL Analysis ---
    const urlInput = document.getElementById('urlInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const urlAnalysisResult = document.getElementById('urlAnalysisResult');

    if (analyzeButton) {
        analyzeButton.addEventListener('click', () => {
            const url = urlInput.value;
            urlAnalysisResult.textContent = 'Analyzing...';
            urlAnalysisResult.classList.add('loading');
            fetch(`/api/analyze?url=${encodeURIComponent(url)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to analyze URL: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    urlAnalysisResult.textContent = data.result;
                    urlAnalysisResult.classList.remove('loading');
                })
                .catch(error => {
                    urlAnalysisResult.textContent = `Error: ${error.message}`;
                    urlAnalysisResult.classList.remove('loading');
                });
        });
    }

    // --- Report Phishing ---
    const reportPhishingButton = document.getElementById('reportButton'); // Correct ID
    const phishingReport = document.getElementById('phishingReport');
    const reportFeedback = document.getElementById('reportFeedback');

    if (reportPhishingButton) {
        reportPhishingButton.addEventListener('click', () => {
            const reportText = phishingReport.value;
            reportFeedback.textContent = 'Sending report...';
            fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ report: reportText }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to send report: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    reportFeedback.textContent = data.message;
                    phishingReport.value = '';
                })
                .catch(error => {
                    reportFeedback.textContent = `Error: ${error.message}`;
                });
        });
    }

    // --- Update Score Function ---
    function updateScore(points) {
        fetch('/update_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: points }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to update score: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && typeof data.new_score === 'number') {
                    userScore += points; // Update local score
                    updateUserScoreDisplay();
                    console.log('Score updated successfully:', data.new_score);
                } else {
                    console.error("Invalid score update response:", data);
                }
            })
            .catch(error => {
                console.error('Error updating score:', error);
            });
    }
});
