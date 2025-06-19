from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user, login_required
from app import db
from app.models.user import User
from datetime import datetime
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, ValidationError
import urllib.parse

auth_bp = Blueprint('auth', __name__)


class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')


class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[DataRequired()])
    last_name = StringField('Last Name', validators=[DataRequired()])
    department = StringField('Department')
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Please use a different username.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Please use a different email address.')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('auth.login'))

        login_user(user, remember=form.remember_me.data)
        user.last_login = datetime.utcnow()
        db.session.commit()

        next_page = request.args.get('next')
        if not next_page or next_page == '':
            next_page = url_for('dashboard.index')
        else:
            # Enhanced security check - make sure the URL is relative
            # by checking if it starts with a slash and doesn't contain ://
            parsed_url = urllib.parse.urlparse(next_page)
            if parsed_url.netloc or not next_page.startswith('/'):
                next_page = url_for('dashboard.index')

        flash(f'Welcome back, {user.first_name}!', 'success')
        return redirect(next_page)

    return render_template('auth/login.html', title='Sign In', form=form)


@auth_bp.route('/logout')
def logout():
    if current_user.is_authenticated:
        flash('You have been logged out successfully.', 'info')
    logout_user()
    return redirect(url_for('auth.login'))


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    form = RegistrationForm()
    if form.validate_on_submit():
        try:
            user = User(
                username=form.username.data,
                email=form.email.data,
                first_name=form.first_name.data,
                last_name=form.last_name.data,
                department=form.department.data or 'General'
            )
            user.set_password(form.password.data)

            db.session.add(user)
            db.session.commit()

            flash('Congratulations, you are now a registered user! Please log in.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Registration failed. Please try again.', 'danger')
            return redirect(url_for('auth.register'))

    return render_template('auth/register.html', title='Register', form=form)


@auth_bp.route('/profile', methods=['GET'])
@login_required
def profile():
    return render_template('auth/profile.html', title='User Profile')


@auth_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """Allow users to edit their profile information"""
    form = RegistrationForm(obj=current_user)
    form.username.data = current_user.username
    form.email.data = current_user.email

    # Remove password validation for profile editing
    delattr(form, 'password')
    delattr(form, 'password2')

    if form.validate_on_submit():
        try:
            # Check if username/email is already taken by another user
            existing_user_username = User.query.filter_by(username=form.username.data).first()
            if existing_user_username and existing_user_username.id != current_user.id:
                flash('Username already taken by another user.', 'danger')
                return render_template('auth/edit_profile.html', form=form)

            existing_user_email = User.query.filter_by(email=form.email.data).first()
            if existing_user_email and existing_user_email.id != current_user.id:
                flash('Email already taken by another user.', 'danger')
                return render_template('auth/edit_profile.html', form=form)

            current_user.username = form.username.data
            current_user.email = form.email.data
            current_user.first_name = form.first_name.data
            current_user.last_name = form.last_name.data
            current_user.department = form.department.data or 'General'

            db.session.commit()
            flash('Your profile has been updated successfully!', 'success')
            return redirect(url_for('auth.profile'))
        except Exception as e:
            db.session.rollback()
            flash('Profile update failed. Please try again.', 'danger')

    return render_template('auth/edit_profile.html', form=form)


@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    """Allow users to change their password"""
    from wtforms import PasswordField
    from wtforms.validators import DataRequired, EqualTo, Length

    class ChangePasswordForm(FlaskForm):
        current_password = PasswordField('Current Password', validators=[DataRequired()])
        new_password = PasswordField('New Password', validators=[
            DataRequired(),
            Length(min=6, message='Password must be at least 6 characters long')
        ])
        new_password2 = PasswordField('Confirm New Password', validators=[
            DataRequired(),
            EqualTo('new_password', message='Passwords must match')
        ])
        submit = SubmitField('Change Password')

    form = ChangePasswordForm()

    if form.validate_on_submit():
        if not current_user.check_password(form.current_password.data):
            flash('Current password is incorrect.', 'danger')
            return render_template('auth/change_password.html', form=form)

        try:
            current_user.set_password(form.new_password.data)
            db.session.commit()
            flash('Your password has been updated successfully!', 'success')
            return redirect(url_for('auth.profile'))
        except Exception as e:
            db.session.rollback()
            flash('Password change failed. Please try again.', 'danger')

    return render_template('auth/change_password.html', form=form)


@auth_bp.errorhandler(404)
def auth_not_found(error):
    return render_template('errors/404.html'), 404


@auth_bp.errorhandler(500)
def auth_internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500