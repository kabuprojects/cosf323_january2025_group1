from flask import Flask, render_template, request, jsonify, redirect, url_for
from pymongo import MongoClient
from bson import ObjectId
import os

app = Flask(__name__)

# MongoDB Connection
try:
    client = MongoClient('mongodb://localhost:27017/')  # Replace with your MongoDB connection string
    db = client['cybersecuritydb']
    emails_collection = db['emails']
    https_collection = db['httpscontents']
    quiz_collection = db['quizquestions']
    print("Connected to MongoDB")  # Added for debugging
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Consider a more robust error handling strategy here, such as logging to a file
    # or displaying an error message to the user.  For now, the app will still run
    # but database operations will fail.  You might want to exit here in a production
    # environment.
    pass

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FOLDER = os.path.join(BASE_DIR, 'templates')
app.template_folder = TEMPLATE_FOLDER

@app.route('/')
def admin_login():
    return render_template('admin_login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == "admin" and password == "password":
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error="Invalid credentials")
    return render_template('admin_login.html')

@app.route('/admin_dashboard')
def admin_dashboard():
    print("admin_dashboard route called")
    return render_template('admin_dashboard.html')

@app.route('/test')
def test():
    return "This is a test!"

@app.route('/add_email', methods=['POST'])
def add_email():
    try:
        data = request.get_json()
        print(f"Received email data: {data}")  # Added logging
        from_email = data.get('from')
        to = data.get('to')
        subject = data.get('subject')
        body = data.get('body')
        correctAction = data.get('correctAction')

        if not all([from_email, to, subject, body, correctAction]):
            print("Missing required fields for email") # Added logging
            return jsonify({'error': 'Missing required fields'}), 400

        emails_collection.insert_one({
            'from': from_email,
            'to': to,
            'subject': subject,
            'body': body,
            'correctAction': correctAction
        })
        print("Email added successfully")  # Added logging
        return jsonify({'message': 'Email added successfully'}), 201
    except Exception as e:
        print(f"Error adding email: {e}")  # Added logging
        return jsonify({'error': str(e)}), 500

@app.route('/view_emails', methods=['GET'])
def view_emails():
    try:
        emails = list(emails_collection.find())
        for email in emails:
            email['_id'] = str(email['_id'])
        print(f"Retrieved emails: {emails}")  # Added logging
        return jsonify(emails), 200
    except Exception as e:
        print(f"Error viewing emails: {e}")  # Added logging
        return jsonify({'error': str(e)}), 500

@app.route('/add_https', methods=['POST'])
def add_https():
    try:
        data = request.get_json()
        print(f"Received HTTPS data: {data}") # Added
        heading = data.get('heading')
        videos = data.get('videos')

        if not all([heading, videos]):
            print("Missing required fields for HTTPS content") # Added
            return jsonify({'error': 'Missing required fields'}), 400

        https_collection.insert_one({
            'heading': heading,
            'videos': videos
        })
        print("HTTPS content added successfully") # Added
        return jsonify({'message': 'HTTPS content added successfully'}), 201
    except Exception as e:
        print(f"Error adding HTTPS content: {e}") # Added
        return jsonify({'error': str(e)}), 500

@app.route('/view_https', methods=['GET'])
def view_https():
    try:
        https_contents = list(https_collection.find())
        for content in https_contents:
            content['_id'] = str(content['_id'])
        print(f"Retrieved HTTPS content: {https_contents}") # Added
        return jsonify(https_contents), 200
    except Exception as e:
        print(f"Error viewing HTTPS content: {e}") # Added
        return jsonify({'error': str(e)}), 500

@app.route('/add_quiz', methods=['POST'])
def add_quiz():
    try:
        data = request.get_json()
        print(f"Received quiz data: {data}")  # Added logging
        category = data.get('category')
        question = data.get('question')
        options = data.get('options')
        correctAnswerIndex = data.get('correctAnswerIndex')

        if not all([category, question, options, correctAnswerIndex]):
            print("Missing required fields for quiz question") # Added
            return jsonify({'error': 'Missing required fields'}), 400

        #  Validate correctAnswerIndex
        if not isinstance(correctAnswerIndex, int):
            print(f"correctAnswerIndex is not an integer: {correctAnswerIndex}")
            return jsonify({'error': 'correctAnswerIndex must be an integer'}), 400

        if correctAnswerIndex < 0 or correctAnswerIndex >= len(options):
            print(f"correctAnswerIndex out of range: {correctAnswerIndex}, options: {options}")
            return jsonify({'error': 'correctAnswerIndex is out of range'}), 400

        quiz_collection.insert_one({
            'category': category,
            'question': question,
            'options': options,
            'correctAnswerIndex': correctAnswerIndex
        })
        print("Quiz question added successfully") # Added
        return jsonify({'message': 'Quiz question added successfully'}), 201
    except Exception as e:
        print(f"Error adding quiz question: {e}") # Added
        return jsonify({'error': str(e)}), 500

@app.route('/view_quiz', methods=['GET'])
def view_quiz():
    try:
        quiz_questions = list(quiz_collection.find())
        for question in quiz_questions:
            question['_id'] = str(question['_id'])
        print(f"Retrieved quiz questions: {quiz_questions}") # Added
        return jsonify(quiz_questions), 200
    except Exception as e:
        print(f"Error viewing quiz questions: {e}") # Added
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
