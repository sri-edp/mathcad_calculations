from app import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json


@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    role = db.Column(db.String(20), default='user')  # 'user', 'admin', etc.
    department = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    settings = db.Column(db.Text)  # JSON string for user preferences

    # Relationships
    calculation_sheets = db.relationship('CalculationSheet', backref='author', lazy='dynamic')
    templates = db.relationship('Template', backref='author', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        # Using werkzeug's password hashing which uses pbkdf2:sha256
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_settings(self):
        if not self.settings:
            return {}
        return json.loads(self.settings)

    def set_settings(self, settings_dict):
        self.settings = json.dumps(settings_dict)

    def is_admin(self):
        return self.role == 'admin'