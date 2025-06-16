from app import db
from datetime import datetime
import json


class Template(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    description = db.Column(db.Text)
    category = db.Column(db.String(64))
    content = db.Column(db.Text)  # JSON string of the template content
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_published = db.Column(db.Boolean, default=False)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<Template {self.name}>'

    def get_content(self):
        if not self.content:
            return {}
        return json.loads(self.content)

    def set_content(self, content_dict):
        self.content = json.dumps(content_dict)


class CustomFunction(db.Model):
    """User-defined functions that can be reused"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.Text)
    code = db.Column(db.Text)  # Python code as string
    parameters = db.Column(db.Text)  # JSON string for parameter info
    category = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_published = db.Column(db.Boolean, default=False)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<CustomFunction {self.name}>'

    def get_parameters(self):
        if not self.parameters:
            return []
        return json.loads(self.parameters)

    def set_parameters(self, parameters_list):
        self.parameters = json.dumps(parameters_list)