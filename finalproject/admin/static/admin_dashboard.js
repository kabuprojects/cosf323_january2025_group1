document.addEventListener('DOMContentLoaded', () => {
    const addEmailBtn = document.getElementById('add-email');
    const viewEmailsBtn = document.getElementById('view-emails');
    const emailDataDisplay = document.getElementById('email-data');
    const addEmailForm = document.getElementById('add-email-form');
    const submitEmailBtn = document.getElementById('submit-email');

    const addHttpsBtn = document.getElementById('add-https');
    const viewHttpsBtn = document.getElementById('view-https');
    const httpsDataDisplay = document.getElementById('https-data');
    const addHttpsForm = document.getElementById('add-https-form');
    const submitHttpsBtn = document.getElementById('submit-https');

    const addQuizBtn = document.getElementById('add-quiz');
    const viewQuizBtn = document.getElementById('view-quiz');
    const quizDataDisplay = document.getElementById('quiz-data');
    const addQuizForm = document.getElementById('add-quiz-form');
    const submitQuizBtn = document.getElementById('submit-quiz');

    addEmailBtn.addEventListener('click', () => {
        addEmailForm.style.display = 'block';
        addHttpsForm.style.display = 'none';
        addQuizForm.style.display = 'none';
    });

    addHttpsBtn.addEventListener('click', () => {
        addHttpsForm.style.display = 'block';
        addEmailForm.style.display = 'none';
        addQuizForm.style.display = 'none';
    });

    addQuizBtn.addEventListener('click', () => {
        addQuizForm.style.display = 'block';
        addEmailForm.style.display = 'none';
        addHttpsForm.style.display = 'none';
    });

    submitEmailBtn.addEventListener('click', (event) => { // Added event
        event.preventDefault(); // Prevent default form submission
        const from = document.getElementById('email-from').value;
        const to = document.getElementById('email-to').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;
        const correctAction = document.getElementById('email-correctAction').value;

        if (!from || !to || !subject || !body || !correctAction) {
            alert('Please fill in all email fields.');
            return;
        }

        fetch('/add_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to, subject, body, correctAction }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || data.error);
            if (data.message) {
                addEmailForm.style.display = 'none';
                document.getElementById('email-from').value = '';
                document.getElementById('email-to').value = '';
                document.getElementById('email-subject').value = '';
                document.getElementById('email-body').value = '';
                document.getElementById('email-correctAction').value = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding email: ' + error.message);
        });
    });

    submitHttpsBtn.addEventListener('click', (event) => { // Added event
        event.preventDefault();
        const heading = document.getElementById('https-heading').value;
        const videos = document.getElementById('https-videos').value.split(',').map(v => v.trim());

        if (!heading || videos.length === 0 || videos.some(v => !v)) {
            alert('Please fill in all HTTPS fields and provide at least one video URL.');
            return;
        }

        fetch('/add_https', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ heading, videos }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || data.error);
            if (data.message) {
                addHttpsForm.style.display = 'none';
                document.getElementById('https-heading').value = '';
                document.getElementById('https-videos').value = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding HTTPS content: ' + error.message);
        });
    });

    submitQuizBtn.addEventListener('click', (event) => { // Added event
        event.preventDefault();
        const category = document.getElementById('quiz-category').value;
        const question = document.getElementById('quiz-question').value;
        const options = document.getElementById('quiz-options').value.split(',').map(o => o.trim());
        const correctAnswerIndex = parseInt(document.getElementById('quiz-correctAnswerIndex').value);

        if (!category || !question || options.length < 2 || isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
            alert('Please fill in all quiz fields correctly.');
            return;
        }

        fetch('/add_quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, question, options, correctAnswerIndex }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || data.error);
            if (data.message) {
                addQuizForm.style.display = 'none';
                document.getElementById('quiz-category').value = '';
                document.getElementById('quiz-question').value = '';
                document.getElementById('quiz-options').value = '';
                document.getElementById('quiz-correctAnswerIndex').value = '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding the quiz question: ' + error.message);
        });
    });

    viewEmailsBtn.addEventListener('click', () => {
        fetch('/view_emails')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(emails => {
                emailDataDisplay.innerHTML = "";
                if (emails && emails.length > 0) {
                    const emailsList = document.createElement('ul');
                    emails.forEach(email => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `From: ${email.from}, Subject: ${email.subject}, Body: ${email.body}, Correct Action: ${email.correctAction}, ID: ${email._id}`;
                        emailsList.appendChild(listItem);
                    });
                    emailDataDisplay.appendChild(emailsList);
                } else {
                    emailDataDisplay.innerHTML = "No emails found.";
                }
            })
            .catch(error => {
                console.error('Error:', error);
                emailDataDisplay.innerHTML = 'Error fetching emails: ' + error.message;
                alert('Failed to fetch emails. Check console for details.');
            });
    });

    viewHttpsBtn.addEventListener('click', () => {
        fetch('/view_https')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(httpsContents => {
                httpsDataDisplay.innerHTML = "";
                if (httpsContents && httpsContents.length > 0) {
                    const httpsList = document.createElement('ul');
                    httpsContents.forEach(content => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `Heading: ${content.heading}, Videos: ${content.videos.join(', ')}, ID: ${content._id}`;
                        httpsList.appendChild(listItem);
                    });
                    httpsDataDisplay.appendChild(httpsList);
                } else {
                    httpsDataDisplay.innerHTML = "No HTTPS content found.";
                }
            })
            .catch(error => {
                console.error('Error:', error);
                httpsDataDisplay.innerHTML = 'Error fetching HTTPS content: ' + error.message;
                alert('Failed to fetch HTTPS content. Check console for details.');
            });
    });

    viewQuizBtn.addEventListener('click', () => {
        fetch('/view_quiz')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(quizQuestions => {
                quizDataDisplay.innerHTML = "";
                if (quizQuestions && quizQuestions.length > 0) {
                    const quizList = document.createElement('ul');
                    quizQuestions.forEach(question => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `Category: ${question.category}, Question: ${question.question}, Options: ${question.options.join(', ')}, Correct Answer Index: ${question.correctAnswerIndex}, ID: ${question._id}`;
                        quizList.appendChild(listItem);
                    });
                    quizDataDisplay.appendChild(quizList);
                } else {
                    quizDataDisplay.innerHTML = "No quiz questions found.";
                }
            })
            .catch(error => {
                console.error('Error:', error);
                quizDataDisplay.innerHTML = 'Error fetching quiz questions: ' + error.message;
                alert('Failed to fetch quiz questions. Check console for details.');
            });
    });
});
