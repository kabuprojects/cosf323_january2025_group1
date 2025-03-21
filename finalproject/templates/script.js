
document.addEventListener('DOMContentLoaded', () => {
    // Helper function to fetch data and handle loading state
    async function fetchData(url, targetElementId, processDataCallback) {
        const targetElement = document.getElementById(targetElementId);
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

    // Phishing Simulation
    let currentEmail;
    let emails = []; // Array to store emails fetched from the server
    let currentEmailIndex = 0;
    const phishingContentEl = document.getElementById('phishingContent');
    const reportBtn = document.getElementById('reportButton');
    const acceptBtn = document.getElementById('acceptButton');
    const ignoreBtn = document.getElementById('ignoreButton');
    const phishingFeedback = document.getElementById('phishingFeedback');
    const phishingOverlay = document.getElementById('phishingOverlay');
    const overlayText = document.getElementById('overlayText');
    const nextEmailButton = document.getElementById('nextEmailButton');


  function displayEmail(email) {
        currentEmail = email;
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
        phishingOverlay.style.display = 'none'; // Hide overlay when displaying a new email
        phishingFeedback.textContent = ''; // Clear previous feedback.

    }

    function loadAndDisplayEmail() {
          if (emails && emails.length > 0) {
            displayEmail(emails[currentEmailIndex]);
        } else {
             fetch('/api/phishing') // Fetch the emails
                .then(response => response.json())
                .then(data => {
                    emails = data; // Store the emails
                    if(emails.length > 0){
                        currentEmailIndex = 0;
                        displayEmail(emails[currentEmailIndex]); // Display the first email
                    }
                    else{
                        phishingContentEl.innerHTML = "No emails available.";
                        phishingContentEl.classList.remove('loading');
                    }

                })
                .catch(error => {
                    phishingContentEl.textContent = `Error: ${error.message}`;
                    phishingContentEl.classList.remove('loading');
                });
        }
    }
  loadAndDisplayEmail();

    nextEmailButton.addEventListener('click', () => {
        currentEmailIndex = (currentEmailIndex + 1) % emails.length; // Loop through emails
        displayEmail(emails[currentEmailIndex]);
    });

    function handleAction(action) {
        if (!currentEmail) return;

        let message = '';
        let isCorrect = false;
        switch (action) {
            case 'report':
                if (currentEmail.correctAction === 'report') {
                    message = 'You reported the email. You have evaded hacking!';
                    isCorrect = true;
                } else {
                    message = 'Incorrect. This was a phishing attempt. You should have reported it.';
                }
                break;
            case 'accept':
                if (currentEmail.correctAction === 'accept') {
                    message = 'You accepted the email. You have evaded hacking!';
                    isCorrect = true;
                } else {
                    message = 'Incorrect.  This was a phishing attempt. Accepting it is dangerous.';
                }
                break;
            case 'ignore':
                 if (currentEmail.correctAction === 'ignore') {
                    message = 'You ignored the email. You have evaded hacking!';
                    isCorrect = true;
                } else {
                    message = 'Incorrect. This was a phishing attempt. Ignoring it is not the best action.';
                }
                break;
            default:
                message = 'Invalid action.';
        }

        overlayText.textContent = message;
        phishingOverlay.style.display = 'flex'; // Show the overlay
        if(isCorrect){
             overlayText.style.color = "green";
        }
        else{
            overlayText.style.color = "red";
        }
       // phishingFeedback.textContent = message;
       // phishingFeedback.style.color = isCorrect ? 'green' : 'red';
    }

    reportBtn.addEventListener('click', () => handleAction('report'));
    acceptBtn.addEventListener('click', () => handleAction('accept'));
    ignoreBtn.addEventListener('click', () => handleAction('ignore'));



    // Password Strength Checker
    const passwordInput = document.getElementById('passwordInput');
    const passwordStrengthDiv = document.querySelector('#passwordStrength div');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const showPasswordCheckbox = document.getElementById('showPassword');

    passwordInput.addEventListener('input', function() {
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

    showPasswordCheckbox.addEventListener('change', function() {
        passwordInput.type = this.checked ? 'text' : 'password';
    });

    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length > 8) strength += 20;
        if (password.match(/[a-z]/)) strength += 15;
        if (password.match(/[A-Z]/)) strength += 15;
        if (password.match(/[0-9]/)) strength += 15;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 35;
        return Math.min(strength, 100); // Cap at 100
    }

    function getStrengthColor(strength) {
        if (strength < 20) return '#e53e3e'; // Very Weak - Red
        if (strength < 40) return '#dc2626'; // Weak - Darker Red
        if (strength < 60) return '#f59e0b'; // Moderate - Yellow/Orange
        if (strength < 80) return '#65a30d'; // Strong - Green
        return '#16a34a';       // Very Strong - Darker Green
    }

    // Security Quiz
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
    let score = 0;
    let quizEnded = false;

    quizCategoriesDiv.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            currentCategory = event.target.dataset.category;
            quizCategoriesDiv.classList.add('hidden');
            quizQuestionsDiv.classList.remove('hidden');
            loadQuizQuestions(currentCategory);
        }
    });

     retakeQuizButton.addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        quizEnded = false;
        quizFeedbackDiv.textContent = '';
        quizFeedbackDiv.className = 'quiz-feedback';
        nextQuestionButton.classList.remove('hidden');
        retakeQuizButton.classList.add('hidden');
        loadQuizQuestions(currentCategory);
    });

    nextQuestionButton.addEventListener('click', () => {
        currentQuestionIndex++;
        quizFeedbackDiv.textContent = '';
        quizFeedbackDiv.className = 'quiz-feedback';
        loadAndDisplayQuizQuestion();
    });

    function loadQuizQuestions(category) {
        quizQuestionEl.classList.add('loading');
        fetch(`/api/quiz?category=${category}`)
            .then(response => response.json())
            .then(data => {
                currentQuestions = data;
                currentQuestionIndex = 0;
                score = 0;
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
        if (currentQuestionIndex < currentQuestions.length) {
            const questionData = currentQuestions[currentQuestionIndex];
            quizQuestionEl.textContent = questionData.question;
            quizOptionsDiv.innerHTML = ''; // Clear previous options

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
            score++;
        } else {
            quizFeedbackDiv.textContent = 'Incorrect!';
            quizFeedbackDiv.className = 'incorrect quiz-feedback';
        }

        if (currentQuestionIndex < currentQuestions.length - 1) {
             nextQuestionButton.classList.remove('hidden');
        }
        else{
            endQuiz();
        }

        // Disable options after an answer
        const options = quizOptionsDiv.querySelectorAll('button');
        options.forEach(button => {
            button.disabled = true;
        });
    }

    function endQuiz() {
        quizEnded = true;
        quizQuestionEl.textContent = `Quiz Ended! Your score: ${score} out of ${currentQuestions.length}.`;
        quizOptionsDiv.innerHTML = '';
        nextQuestionButton.classList.add('hidden');
        retakeQuizButton.classList.remove('hidden');

        if (score === currentQuestions.length) {
            quizFeedbackDiv.textContent = "Perfect Score! Well done!";
            quizFeedbackDiv.className = "correct quiz-feedback";
        } else if (score >= currentQuestions.length / 2) {
            quizFeedbackDiv.textContent = "Good job!";
            quizFeedbackDiv.className = "correct quiz-feedback";
        }
         else {
            quizFeedbackDiv.textContent = "Try again to improve your score.";
            quizFeedbackDiv.className = "incorrect quiz-feedback";
        }
    }



    // HTTPS Education
    fetchData('/api/https', 'httpsContent