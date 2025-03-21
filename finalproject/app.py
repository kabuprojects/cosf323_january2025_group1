# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson import ObjectId
import os
import logging
from sqlalchemy import inspect  # Import the inspect function
from sqlalchemy import text # Import the text function
from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import logging

app = Flask(__name__)

# ✅ Database Configuration (SQLite for User Authentication)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'cybersafe.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key_here'

# ✅ Initialize Extensions
db = SQLAlchemy()
db.init_app(app)

# ✅ Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# ✅ Configure Logging
logging.basicConfig(level=logging.DEBUG)

# ✅ User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, default=0)  # Add the score column

    def __repr__(self):
        return f'<User {self.username}>'


@login_manager.user_loader
def load_user(user_id):
    logging.debug(f"load_user called with user_id: {user_id}")
    try:
        user = db.session.get(User, int(user_id))
        logging.debug(f"User found: {user}")
        return user
    except Exception as e:
        logging.error(f"Error in load_user: {e}")
        return None


# ✅ MongoDB Connection
mongo_client = MongoClient('mongodb://localhost:27017/')
mongo_db = mongo_client.get_database('cybersecuritydb')

# ✅ Define Collections
email_collection = mongo_db.emails
quiz_collection = mongo_db.quizquestions
https_collection = mongo_db.httpscontents
users_collection = mongo_db.users

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html', user=current_user)
    return redirect(url_for('login'))

# ✅ Register Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        if not full_name or not username or not email or not password:
            flash("All fields are required!", "danger")
            return redirect(url_for('register'))

        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)).first()
        if existing_user:
            flash('Username or Email already exists. Try a different one.', 'danger')
            return redirect(url_for('register'))

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(full_name=full_name, username=username, email=email,
                        password=hashed_password, is_admin=False)

        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            flash(f"An error occurred: {str(e)}", "danger")
            return redirect(url_for('register'))

    return render_template('register.html')

# ✅ Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Email and password are required!", "danger")
            return redirect(url_for('login'))

        logging.debug(f"Attempting to log in with email: {email}")
        user = User.query.filter_by(email=email).first()

        if user:
            logging.debug(f"User found in database: {user}")
            if check_password_hash(user.password, password):
                logging.debug("Password check successful")
                login_user(user)
                session['username'] = user.username
                session['score'] = user.score
                flash('Login successful!', 'success')
                return redirect(url_for('index'))
            else:
                logging.debug("Password check failed")
                flash('Invalid password', 'danger')
        else:
            logging.debug("User not found in database")
            flash('Invalid email', 'danger')

    return render_template('login.html')

# ✅ Admin Login Route
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        admin_user = User.query.filter_by(email=email, is_admin=True).first()

        if admin_user and check_password_hash(admin_user.password, password):
            login_user(admin_user)
            flash('Admin login successful!', 'success')
            return redirect(url_for('admin_dashboard'))

        flash('Invalid admin credentials', 'danger')

    return render_template('admin_login.html')

# api to get score
@app.route('/get_score')
@login_required
def get_score():
    #  Return the user's score directly from the database.
    user = User.query.get(current_user.id) # Get the user.
    if user:
        return jsonify({'score': user.score})
    else:
        return jsonify({'error': 'User not found'}), 404


# ✅ Admin Dashboard Route
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash("Access Denied: Admins only!", "danger")
        return redirect(url_for('index'))

    return render_template('admin_dashboard.html', user=current_user)

# ✅ Logout Route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully', 'success')
    return redirect(url_for('login'))

# ✅ Learning Modules Route
@app.route('/learning_modules')
def learning_modules():
    return render_template('modules.html')

# ✅ Phishing Simulation Route
@app.route('/api/phishing')
def get_phishing_emails():
    emails = list(email_collection.find())
    for email in emails:
        email['_id'] = str(email['_id'])
    return jsonify(emails)

# ✅ Quiz Route
@app.route('/api/quiz')
def get_quiz_questions():
    category = request.args.get('category')
    questions = list(quiz_collection.find({'category': category}))
    for question in questions:
        question['_id'] = str(question['_id'])
    return jsonify(questions)

# ✅ HTTPS Content Route
@app.route('/api/https')
def get_https_content():
    try:
        https_content = https_collection.find_one()
        if https_content:
            https_content['_id'] = str(https_content['_id'])
            return jsonify(https_content)
        else:
            return jsonify({}), 200
    except Exception as e:
        logging.error(f"Error fetching HTTPS content: {e}")
        return jsonify({'error': 'Failed to retrieve HTTPS content'}), 500

# ✅ Report Phishing Route
@app.route('/api/report', methods=['POST'])
def report_phishing():
    report_data = request.get_json()
    logging.debug("Phishing report received:", report_data)
    return jsonify({'message': 'Report submitted successfully!'})

# ✅ URL Analysis
 
@app.route('/api/analyze')
def analyze_url():
    url = request.args.get('url')
    logging.debug("URL to analyze:", url)
    analysis_result = {
        'result': f'Analysis of {url}: (Placeholder - Implement real analysis)'}
    return jsonify(analysis_result)


# ✅ Update User Score (Incremental)
@app.route('/update_score', methods=['POST'])
@login_required
def update_score():
    data = request.get_json()
    points = data.get('points', 0)
    logging.debug(f"update_score called with points: {points}")

    if points < 0:
        return jsonify({'error': 'Invalid score update'}), 400

    try:
        # Use current_user.id
        user = User.query.get(current_user.id)
        if user:
            user.score += points
            db.session.commit()
            logging.debug(f"Score updated for user {user.username}. New score: {user.score}")
            return jsonify({'message': 'Score updated!', 'new_score': user.score})
        else:
            logging.error(f"User with id {current_user.id} not found")
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        logging.error(f"Error updating score: {e}")
        db.session.rollback()
        return jsonify({'error': f'Failed to update score: {str(e)}'}), 500



# ✅ Ensure Database Tables Exist Before Running the App
if __name__ == '__main__':
    with app.app_context():
        # Use inspect to check for the table
        engine = db.engine
        if not inspect(engine).has_table('user'):
            db.create_all()
        else:
            #check if the score column exists
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("SELECT score FROM user LIMIT 1"))
                except Exception:
                    #if the score column does not exist, add it.
                    with app.app_context():
                         with db.session.begin():
                            db.session.execute(text("ALTER TABLE user ADD COLUMN score INTEGER DEFAULT 0"))
                            db.session.commit()

    app.run(debug=True)
