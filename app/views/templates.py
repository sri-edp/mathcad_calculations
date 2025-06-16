from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import current_user, login_required
from app import db
from app.models.template import Template, CustomFunction
from datetime import datetime
import json
import os

templates_bp = Blueprint('templates', __name__, url_prefix='/templates')


@templates_bp.route('/')
@login_required
def index():
    """List all available templates"""
    # Get published templates
    published_templates = Template.query.filter_by(
        is_published=True
    ).order_by(Template.category, Template.name).all()

    # Get user's private templates
    private_templates = Template.query.filter_by(
        user_id=current_user.id,
        is_published=False
    ).order_by(Template.name).all()

    return render_template(
        'templates/index.html',
        title='Templates Library',
        published_templates=published_templates,
        private_templates=private_templates
    )


@templates_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new_template():
    """Create a new template"""
    if request.method == 'POST':
        data = request.json

        new_template = Template(
            name=data.get('name', 'Untitled Template'),
            description=data.get('description', ''),
            category=data.get('category', 'General'),
            user_id=current_user.id,
            is_published=data.get('is_published', False)
        )

        new_template.set_content(data.get('content', {}))

        db.session.add(new_template)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Template created',
            'id': new_template.id
        }), 201

    # Handle GET request - show the template editor page
    return render_template(
        'templates/editor.html',
        title='New Template'
    )


@templates_bp.route('/<int:id>', methods=['GET'])
@login_required
def view_template(id):
    """View a template"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not template.is_published and template.user_id != current_user.id:
        flash('You do not have permission to view this template')
        return redirect(url_for('templates.index'))

    return render_template(
        'templates/view.html',
        title=template.name,
        template=template
    )


@templates_bp.route('/<int:id>/edit', methods=['GET', 'PUT'])
@login_required
def edit_template(id):
    """Edit a template"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to edit
    if template.user_id != current_user.id:
        flash('You do not have permission to edit this template')
        return redirect(url_for('templates.index'))

    if request.method == 'PUT':
        data = request.json

        # Update the template
        template.name = data.get('name', template.name)
        template.description = data.get('description', template.description)
        template.category = data.get('category', template.category)
        template.is_published = data.get('is_published', template.is_published)

        template.set_content(data.get('content', template.get_content()))

        # Save changes
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Template updated'
        })

    # Handle GET request - show the template editor page
    return render_template(
        'templates/editor.html',
        title=f'Edit: {template.name}',
        template=template
    )


@templates_bp.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_template(id):
    """Delete a template"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to delete
    if template.user_id != current_user.id:
        return jsonify({
            'status': 'error',
            'message': 'Permission denied'
        }), 403

    db.session.delete(template)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Template deleted'
    })


@templates_bp.route('/<int:id>/use', methods=['GET'])
@login_required
def use_template(id):
    """Use a template to create a new calculation sheet"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not template.is_published and template.user_id != current_user.id:
        flash('You do not have permission to use this template')
        return redirect(url_for('templates.index'))

    # Redirect to the new calculation page with the template ID
    return redirect(url_for('calculations.new_calculation', template_id=id))


# Custom Functions Management
@templates_bp.route('/functions')
@login_required
def list_functions():
    """List all available custom functions"""
    # Get published functions
    published_functions = CustomFunction.query.filter_by(
        is_published=True
    ).order_by(CustomFunction.category, CustomFunction.name).all()

    # Get user's private functions
    private_functions = CustomFunction.query.filter_by(
        user_id=current_user.id,
        is_published=False
    ).order_by(CustomFunction.name).all()

    return render_template(
        'templates/functions.html',
        title='Custom Functions',
        published_functions=published_functions,
        private_functions=private_functions
    )


@templates_bp.route('/functions/new', methods=['GET', 'POST'])
@login_required
def new_function():
    """Create a new custom function"""
    if request.method == 'POST':
        data = request.json

        new_function = CustomFunction(
            name=data.get('name', 'Untitled Function'),
            description=data.get('description', ''),
            code=data.get('code', ''),
            category=data.get('category', 'General'),
            user_id=current_user.id,
            is_published=data.get('is_published', False)
        )

        new_function.set_parameters(data.get('parameters', []))

        db.session.add(new_function)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Function created',
            'id': new_function.id
        }), 201

    # Handle GET request - show the function editor page
    return render_template(
        'templates/function_editor.html',
        title='New Custom Function'
    )


@templates_bp.route('/functions/<int:id>', methods=['GET'])
@login_required
def view_function(id):
    """View a custom function"""
    function = CustomFunction.query.get_or_404(id)

    # Check if user has permission to view
    if not function.is_published and function.user_id != current_user.id:
        flash('You do not have permission to view this function')
        return redirect(url_for('templates.list_functions'))

    return render_template(
        'templates/function_view.html',
        title=function.name,
        function=function
    )