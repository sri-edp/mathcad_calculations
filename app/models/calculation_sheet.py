from app import db
from datetime import datetime
import json


class CalculationSheet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120))
    description = db.Column(db.Text)
    content = db.Column(db.Text)  # JSON string of the sheet content
    variables = db.Column(db.Text)  # JSON string of variables
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_template = db.Column(db.Boolean, default=False)
    is_public = db.Column(db.Boolean, default=False)
    version = db.Column(db.Integer, default=1)

    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    parent_id = db.Column(db.Integer, db.ForeignKey('calculation_sheet.id'), nullable=True)

    # Relationships
    revisions = db.relationship('CalculationSheet',
                                backref=db.backref('parent', remote_side=[id]),
                                lazy='dynamic')

    def __repr__(self):
        return f'<CalculationSheet {self.title}>'

    def get_content(self):
        if not self.content:
            return {}
        return json.loads(self.content)

    def set_content(self, content_dict):
        self.content = json.dumps(content_dict)

    def get_variables(self):
        if not self.variables:
            return {}
        return json.loads(self.variables)

    def set_variables(self, variables_dict):
        self.variables = json.dumps(variables_dict)

    def create_revision(self):
        """Create a new revision of this calculation sheet"""
        revision = CalculationSheet(
            title=self.title,
            description=self.description,
            content=self.content,
            variables=self.variables,
            user_id=self.user_id,
            parent_id=self.id,
            is_template=self.is_template,
            is_public=self.is_public,
            version=self.version + 1
        )
        return revision


class CalculationRevision(db.Model):
    """Track changes to calculation sheets"""
    id = db.Column(db.Integer, primary_key=True)
    sheet_id = db.Column(db.Integer, db.ForeignKey('calculation_sheet.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    changes = db.Column(db.Text)  # JSON string describing changes
    version = db.Column(db.Integer)

    def __repr__(self):
        return f'<CalculationRevision {self.sheet_id}:{self.version}>'

    def get_changes(self):
        if not self.changes:
            return {}
        return json.loads(self.changes)

    def set_changes(self, changes_dict):
        self.changes = json.dumps(changes_dict)