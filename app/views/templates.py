from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file
from flask_login import current_user, login_required
from app import db
from app.models.template import Template, CustomFunction
from app.models.calculation_sheet import CalculationSheet
from datetime import datetime
import json
import os
from werkzeug.utils import secure_filename
from config import Config

templates_bp = Blueprint('templates', __name__, url_prefix='/templates')


@templates_bp.route('/')
@login_required
def index():
    """List all available templates"""
    # Get search and filter parameters
    search_query = request.args.get('search', '').strip()
    category_filter = request.args.get('category', '')
    sort_by = request.args.get('sort', 'name')
    sort_order = request.args.get('order', 'asc')

    # Build the base query for published templates
    published_query = Template.query.filter_by(is_published=True)

    # Apply search filter
    if search_query:
        published_query = published_query.filter(
            db.or_(
                Template.name.contains(search_query),
                Template.description.contains(search_query),
                Template.category.contains(search_query)
            )
        )

    # Apply category filter
    if category_filter:
        published_query = published_query.filter_by(category=category_filter)

    # Apply sorting
    if sort_by == 'name':
        if sort_order == 'desc':
            published_query = published_query.order_by(Template.name.desc())
        else:
            published_query = published_query.order_by(Template.name.asc())
    elif sort_by == 'created_at':
        if sort_order == 'desc':
            published_query = published_query.order_by(Template.created_at.desc())
        else:
            published_query = published_query.order_by(Template.created_at.asc())
    elif sort_by == 'category':
        if sort_order == 'desc':
            published_query = published_query.order_by(Template.category.desc(), Template.name.asc())
        else:
            published_query = published_query.order_by(Template.category.asc(), Template.name.asc())

    published_templates = published_query.all()

    # Get user's private templates
    private_templates = Template.query.filter_by(
        user_id=current_user.id,
        is_published=False
    ).order_by(Template.name).all()

    # Get all categories for the filter dropdown
    categories = db.session.query(Template.category).filter_by(is_published=True).distinct().all()
    categories = [cat[0] for cat in categories if cat[0]]

    return render_template(
        'templates/index.html',
        title='Templates Library',
        published_templates=published_templates,
        private_templates=private_templates,
        categories=categories,
        search_query=search_query,
        category_filter=category_filter,
        sort_by=sort_by,
        sort_order=sort_order
    )


@templates_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new_template():
    """Create a new template"""
    if request.method == 'POST':
        try:
            data = request.json

            # Validate required fields
            name = data.get('name', 'Untitled Template').strip()
            if not name:
                name = 'Untitled Template'

            new_template = Template(
                name=name,
                description=data.get('description', ''),
                category=data.get('category', 'General'),
                user_id=current_user.id,
                is_published=data.get('is_published', False)
            )

            new_template.set_content(data.get('content', {'blocks': []}))

            db.session.add(new_template)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Template created successfully',
                'id': new_template.id
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Failed to create template: {str(e)}'
            }), 400

    # Handle GET request - show the template editor page
    return render_template(
        'templates/editor.html',
        title='New Template',
        template=None
    )


@templates_bp.route('/<int:id>', methods=['GET'])
@login_required
def view_template(id):
    """View a template"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not template.is_published and template.user_id != current_user.id:
        flash('You do not have permission to view this template', 'error')
        return redirect(url_for('templates.index'))

    # Get related templates in the same category
    related_templates = Template.query.filter(
        Template.category == template.category,
        Template.id != template.id,
        Template.is_published == True
    ).limit(5).all()

    # Get usage statistics if user is the owner
    usage_stats = None
    if template.user_id == current_user.id:
        # Count how many calculations were created using this template
        usage_count = CalculationSheet.query.filter(
            CalculationSheet.content.contains(f'"template_id": {template.id}')
        ).count()
        usage_stats = {'usage_count': usage_count}

    return render_template(
        'templates/view.html',
        title=template.name,
        template=template,
        related_templates=related_templates,
        usage_stats=usage_stats
    )


@templates_bp.route('/<int:id>/edit', methods=['GET', 'PUT'])
@login_required
def edit_template(id):
    """Edit a template"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to edit
    if template.user_id != current_user.id:
        flash('You do not have permission to edit this template', 'error')
        return redirect(url_for('templates.view_template', id=id))

    if request.method == 'PUT':
        try:
            data = request.json

            # Update the template
            template.name = data.get('name', template.name).strip() or 'Untitled Template'
            template.description = data.get('description', template.description)
            template.category = data.get('category', template.category)
            template.is_published = data.get('is_published', template.is_published)

            # Validate and set content
            content = data.get('content', template.get_content())
            if not isinstance(content, dict):
                content = {'blocks': []}
            template.set_content(content)

            # Save changes
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Template updated successfully'
            })

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Failed to update template: {str(e)}'
            }), 400

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
            'message': 'You do not have permission to delete this template'
        }), 403

    try:
        # Check if template is being used by any calculations
        usage_count = CalculationSheet.query.filter(
            CalculationSheet.content.contains(f'"template_id": {template.id}')
        ).count()

        if usage_count > 0:
            return jsonify({
                'status': 'error',
                'message': f'Cannot delete template. It is being used by {usage_count} calculation(s).'
            }), 400

        db.session.delete(template)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Template deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete template: {str(e)}'
        }), 500


@templates_bp.route('/<int:id>/use', methods=['GET'])
@login_required
def use_template(id):
    """Use a template to create a new calculation sheet"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not template.is_published and template.user_id != current_user.id:
        flash('You do not have permission to use this template', 'error')
        return redirect(url_for('templates.index'))

    # Redirect to the new calculation page with the template ID
    return redirect(url_for('calculations.new_calculation', template_id=id))


@templates_bp.route('/<int:id>/duplicate', methods=['POST'])
@login_required
def duplicate_template(id):
    """Create a copy of a template"""
    source_template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not source_template.is_published and source_template.user_id != current_user.id:
        return jsonify({
            'status': 'error',
            'message': 'You do not have permission to duplicate this template'
        }), 403

    try:
        # Create a new template as a copy
        new_template = Template(
            name=f"Copy of {source_template.name}",
            description=source_template.description,
            category=source_template.category,
            content=source_template.content,
            user_id=current_user.id,
            is_published=False  # Copies are private by default
        )

        db.session.add(new_template)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Template duplicated successfully',
            'id': new_template.id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Failed to duplicate template: {str(e)}'
        }), 500


@templates_bp.route('/<int:id>/export', methods=['GET'])
@login_required
def export_template(id):
    """Export a template as JSON"""
    template = Template.query.get_or_404(id)

    # Check if user has permission to view
    if not template.is_published and template.user_id != current_user.id:
        flash('You do not have permission to export this template', 'error')
        return redirect(url_for('templates.view_template', id=id))

    try:
        # Create export data
        export_data = {
            'name': template.name,
            'description': template.description,
            'category': template.category,
            'content': template.get_content(),
            'exported_at': datetime.utcnow().isoformat(),
            'exported_by': f"{current_user.first_name} {current_user.last_name}",
            'version': '1.0'
        }

        # Create filename and file path
        filename = f"{secure_filename(template.name)}_template.json"
        filepath = os.path.join(Config.UPLOAD_FOLDER, 'exports', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Write JSON file
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2)

        return send_file(filepath, as_attachment=True, download_name=filename)

    except Exception as e:
        flash(f'Export failed: {str(e)}', 'error')
        return redirect(url_for('templates.view_template', id=id))


# Custom Functions Management
@templates_bp.route('/functions')
@login_required
def list_functions():
    """List all available custom functions"""
    # Get search and filter parameters
    search_query = request.args.get('search', '').strip()
    category_filter = request.args.get('category', '')

    # Build the base query for published functions
    published_query = CustomFunction.query.filter_by(is_published=True)

    # Apply search filter
    if search_query:
        published_query = published_query.filter(
            db.or_(
                CustomFunction.name.contains(search_query),
                CustomFunction.description.contains(search_query),
                CustomFunction.category.contains(search_query)
            )
        )

    # Apply category filter
    if category_filter:
        published_query = published_query.filter_by(category=category_filter)

    published_functions = published_query.order_by(CustomFunction.category, CustomFunction.name).all()

    # Get user's private functions
    private_functions = CustomFunction.query.filter_by(
        user_id=current_user.id,
        is_published=False
    ).order_by(CustomFunction.name).all()

    # Get all categories for the filter dropdown
    categories = db.session.query(CustomFunction.category).filter_by(is_published=True).distinct().all()
    categories = [cat[0] for cat in categories if cat[0]]

    return render_template(
        'templates/functions.html',
        title='Custom Functions',
        published_functions=published_functions,
        private_functions=private_functions,
        categories=categories,
        search_query=search_query,
        category_filter=category_filter
    )


@templates_bp.route('/functions/new', methods=['GET', 'POST'])
@login_required
def new_function():
    """Create a new custom function"""
    if request.method == 'POST':
        try:
            data = request.json

            # Validate required fields
            name = data.get('name', 'Untitled Function').strip()
            if not name:
                return jsonify({
                    'status': 'error',
                    'message': 'Function name is required'
                }), 400

            code = data.get('code', '').strip()
            if not code:
                return jsonify({
                    'status': 'error',
                    'message': 'Function code is required'
                }), 400

            new_function = CustomFunction(
                name=name,
                description=data.get('description', ''),
                code=code,
                category=data.get('category', 'General'),
                user_id=current_user.id,
                is_published=data.get('is_published', False)
            )

            new_function.set_parameters(data.get('parameters', []))

            db.session.add(new_function)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Function created successfully',
                'id': new_function.id
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Failed to create function: {str(e)}'
            }), 400

    # Handle GET request - show the function editor page
    return render_template(
        'templates/function_editor.html',
        title='New Custom Function',
        function=None
    )


@templates_bp.route('/functions/<int:id>', methods=['GET'])
@login_required
def view_function(id):
    """View a custom function"""
    function = CustomFunction.query.get_or_404(id)

    # Check if user has permission to view
    if not function.is_published and function.user_id != current_user.id:
        flash('You do not have permission to view this function', 'error')
        return redirect(url_for('templates.list_functions'))

    return render_template(
        'templates/function_view.html',
        title=function.name,
        function=function
    )


@templates_bp.route('/functions/<int:id>/edit', methods=['GET', 'PUT'])
@login_required
def edit_function(id):
    """Edit a custom function"""
    function = CustomFunction.query.get_or_404(id)

    # Check if user has permission to edit
    if function.user_id != current_user.id:
        flash('You do not have permission to edit this function', 'error')
        return redirect(url_for('templates.view_function', id=id))

    if request.method == 'PUT':
        try:
            data = request.json

            # Update the function
            function.name = data.get('name', function.name).strip() or 'Untitled Function'
            function.description = data.get('description', function.description)
            function.code = data.get('code', function.code)
            function.category = data.get('category', function.category)
            function.is_published = data.get('is_published', function.is_published)

            function.set_parameters(data.get('parameters', function.get_parameters()))

            # Save changes
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Function updated successfully'
            })

        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Failed to update function: {str(e)}'
            }), 400

    # Handle GET request - show the function editor page
    return render_template(
        'templates/function_editor.html',
        title=f'Edit: {function.name}',
        function=function
    )


@templates_bp.route('/functions/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_function(id):
    """Delete a custom function"""
    function = CustomFunction.query.get_or_404(id)

    # Check if user has permission to delete
    if function.user_id != current_user.id:
        return jsonify({
            'status': 'error',
            'message': 'You do not have permission to delete this function'
        }), 403

    try:
        db.session.delete(function)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Function deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete function: {str(e)}'
        }), 500


@templates_bp.route('/api/categories', methods=['GET'])
@login_required
def api_get_categories():
    """API endpoint to get available categories"""
    template_categories = db.session.query(Template.category).filter_by(is_published=True).distinct().all()
    function_categories = db.session.query(CustomFunction.category).filter_by(is_published=True).distinct().all()

    all_categories = set()
    all_categories.update([cat[0] for cat in template_categories if cat[0]])
    all_categories.update([cat[0] for cat in function_categories if cat[0]])

    return jsonify({
        'status': 'success',
        'categories': sorted(list(all_categories))
    })


@templates_bp.route('/import', methods=['GET', 'POST'])
@login_required
def import_template():
    """Import a template from JSON file"""
    if request.method == 'POST':
        try:
            if 'file' not in request.files:
                return jsonify({
                    'status': 'error',
                    'message': 'No file uploaded'
                }), 400

            file = request.files['file']
            if file.filename == '':
                return jsonify({
                    'status': 'error',
                    'message': 'No file selected'
                }), 400

            if not file.filename.endswith('.json'):
                return jsonify({
                    'status': 'error',
                    'message': 'File must be a JSON file'
                }), 400

            # Read and parse JSON data
            import_data = json.load(file)

            # Validate required fields
            required_fields = ['name', 'content']
            for field in required_fields:
                if field not in import_data:
                    return jsonify({
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    }), 400

            # Create new template
            new_template = Template(
                name=f"Imported: {import_data['name']}",
                description=import_data.get('description', ''),
                category=import_data.get('category', 'Imported'),
                user_id=current_user.id,
                is_published=False  # Imported templates are private by default
            )

            new_template.set_content(import_data['content'])

            db.session.add(new_template)
            db.session.commit()

            return jsonify({
                'status': 'success',
                'message': 'Template imported successfully',
                'id': new_template.id
            })

        except json.JSONDecodeError:
            return jsonify({
                'status': 'error',
                'message': 'Invalid JSON file'
            }), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Import failed: {str(e)}'
            }), 500

    # Handle GET request - show import page
    return render_template(
        'templates/import.html',
        title='Import Template'
    )


# Error handlers specific to templates
@templates_bp.errorhandler(404)
def template_not_found(error):
    return render_template('errors/404.html'), 404


@templates_bp.errorhandler(500)
def template_internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500
