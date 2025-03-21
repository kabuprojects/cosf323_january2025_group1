from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from flask import session

auth_bp = Blueprint('auth', __name__)

# ✅ Register Route
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        if not full_name or not username or not email or not password:
            flash("All fields are required!", "danger")
            return redirect(url_for('auth.register'))

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            flash('Username or Email already exists.', 'danger')
            return redirect(url_for('auth.register'))

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(full_name=full_name, username=username, email=email, password=hashed_password, is_admin=False)

        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Account created successfully!', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error: {str(e)}", "danger")
            return redirect(url_for('auth.register'))

    return render_template('register.html')

# ✅ Login Route
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Email and password are required!", "danger")
            return redirect(url_for('auth.login'))

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            flash('Login successful!', 'success')

            return redirect(url_for('admin_dashboard' if user.is_admin else 'home'))
        else:
            flash('Invalid email or password', 'danger')

    return render_template('login.html')

# ✅ Logout Route
@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully', 'success')
    return redirect(url_for('auth.login'))


from flask import session

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, request.form['password']):
        session['user_id'] = user.id
        session['score'] = user.score  # Store the score in the session
        return redirect(url_for('dashboard'))

    return "Invalid credentials"
