from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import current_user, login_required
from app import db
from app.models.calculation_sheet import CalculationSheet, CalculationRevision
from app.models.template import Template, CustomFunction
from datetime import datetime
import json
import os
from werkzeug.utils import secure_filename
import numpy as np
import sympy as sp
from reportlab.pdfgen import canvas
from docx import Document
import matplotlib.pyplot as plt
import io
import base64
from app.utils.math_engine import evaluate_expression, solve_equation, generate_plot
from app.utils.unit_converter import convert_unit
from config import Config

calc_bp = Blueprint('calculations', __name__, url_prefix='/calculations')


@calc_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new_calculation():
    """Create a new calculation sheet"""
    if request.method == 'POST':
        data = request.json

        new_sheet = CalculationSheet(
            title=data.get('title', 'Untitled Calculation'),
            description=data.get('description', ''),
            user_id=current_user.id,
            is_template=False,
            is_public=data.get('is_public', False)
        )

        new_sheet.set_content(data.get('content', {}))
        new_sheet.set_variables(data.get('variables', {}))

        db.session.add(new_sheet)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Calculation sheet created',
            'id': new_sheet.id
        }), 201

    # Handle GET request - show the calculation editor page
    template_id = request.args.get('template_id')
    template = None

    if template_id:
        template = Template.query.get_or_404(template_id)

    return render_template(
        'calculations/editor.html',
        title='New Calculation',
        template=template
    )


@calc_bp.route('/<int:id>', methods=['GET'])
@login_required
def view_calculation(id):
    """View a calculation sheet"""
    sheet = CalculationSheet.query.get_or_404(id)

    # Check if user has permission to view
    if sheet.user_id != current_user.id and not sheet.is_public:
        flash('You do not have permission to view this calculation')
        return redirect(url_for('dashboard.index'))

    return render_template(
        'calculations/view.html',
        title=sheet.title,
        sheet=sheet
    )


@calc_bp.route('/<int:id>/edit', methods=['GET', 'PUT'])
@login_required
def edit_calculation(id):
    """Edit a calculation sheet"""
    sheet = CalculationSheet.query.get_or_404(id)

    # Check if user has permission to edit
    if sheet.user_id != current_user.id:
        flash('You do not have permission to edit this calculation')
        return redirect(url_for('dashboard.index'))

    if request.method == 'PUT':
        data = request.json

        # Create a revision record before updating
        revision = CalculationRevision(
            sheet_id=sheet.id,
            user_id=current_user.id,
            version=sheet.version
        )

        changes = {
            'previous_content': sheet.content,
            'previous_variables': sheet.variables
        }
        revision.set_changes(changes)

        # Update the sheet
        sheet.title = data.get('title', sheet.title)
        sheet.description = data.get('description', sheet.description)
        sheet.is_public = data.get('is_public', sheet.is_public)
        sheet.version += 1

        sheet.set_content(data.get('content', sheet.get_content()))
        sheet.set_variables(data.get('variables', sheet.get_variables()))

        # Save changes
        db.session.add(revision)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Calculation sheet updated',
            'version': sheet.version
        })

    # Handle GET request - show the calculation editor page
    return render_template(
        'calculations/editor.html',
        title=f'Edit: {sheet.title}',
        sheet=sheet
    )


@calc_bp.route('/<int:id>/delete', methods=['DELETE'])
@login_required
def delete_calculation(id):
    """Delete a calculation sheet"""
    sheet = CalculationSheet.query.get_or_404(id)

    # Check if user has permission to delete
    if sheet.user_id != current_user.id:
        return jsonify({
            'status': 'error',
            'message': 'Permission denied'
        }), 403

    db.session.delete(sheet)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Calculation sheet deleted'
    })


@calc_bp.route('/<int:id>/export/<format>', methods=['GET'])
@login_required
def export_calculation(id, format):
    """Export a calculation sheet as PDF or Word"""
    sheet = CalculationSheet.query.get_or_404(id)

    # Check if user has permission to view
    if sheet.user_id != current_user.id and not sheet.is_public:
        flash('You do not have permission to export this calculation')
        return redirect(url_for('dashboard.index'))

    if format == 'pdf':
        # Generate PDF
        filename = f"{secure_filename(sheet.title)}.pdf"
        filepath = os.path.join(Config.PDF_EXPORT_FOLDER, filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Generate PDF using ReportLab
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
        from reportlab.lib.styles import getSampleStyleSheet

        doc = SimpleDocTemplate(filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(sheet.title, styles['Title']))
        story.append(Spacer(1, 12))

        # Description
        if sheet.description:
            story.append(Paragraph(f"Description: {sheet.description}", styles['Normal']))
            story.append(Spacer(1, 12))

        # Content
        content = sheet.get_content()
        for item in content.get('blocks', []):
            item_type = item.get('type')
            item_data = item.get('data', {})

            if item_type == 'text':
                story.append(Paragraph(item_data.get('text', ''), styles['Normal']))
                story.append(Spacer(1, 6))

            elif item_type == 'equation':
                story.append(Paragraph(f"Equation: {item_data.get('latex', '')}", styles['Code']))
                story.append(Spacer(1, 6))

            elif item_type == 'calculation':
                input_value = item_data.get('input', '')
                result = item_data.get('result', '')
                story.append(Paragraph(f"Input: {input_value}", styles['Normal']))
                story.append(Paragraph(f"Result: {result}", styles['Normal']))
                story.append(Spacer(1, 6))

            elif item_type == 'plot':
                # Base64 encoded plot image would go here
                # For simplicity, we'll just add a placeholder
                story.append(Paragraph("Plot image would be displayed here", styles['Normal']))
                story.append(Spacer(1, 12))

        # Build the PDF
        doc.build(story)

        # Redirect to download URL
        download_url = url_for('static', filename=f'exports/pdf/{filename}')
        return redirect(download_url)

    elif format == 'word':
        # Generate Word document
        filename = f"{secure_filename(sheet.title)}.docx"
        filepath = os.path.join(Config.WORD_EXPORT_FOLDER, filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Create a new Word document
        doc = Document()

        # Add title
        doc.add_heading(sheet.title, 0)

        # Add description
        if sheet.description:
            doc.add_paragraph(f"Description: {sheet.description}")

        # Content
        content = sheet.get_content()
        for item in content.get('blocks', []):
            item_type = item.get('type')
            item_data = item.get('data', {})

            if item_type == 'text':
                doc.add_paragraph(item_data.get('text', ''))

            elif item_type == 'equation':
                p = doc.add_paragraph()
                p.add_run(f"Equation: {item_data.get('latex', '')}").italic = True

            elif item_type == 'calculation':
                input_value = item_data.get('input', '')
                result = item_data.get('result', '')
                doc.add_paragraph(f"Input: {input_value}")
                doc.add_paragraph(f"Result: {result}")

            elif item_type == 'plot':
                # For simplicity, we'll just add a placeholder
                doc.add_paragraph("Plot image would be displayed here")

        # Save the Word document
        doc.save(filepath)

        # Redirect to download URL
        download_url = url_for('static', filename=f'exports/word/{filename}')
        return redirect(download_url)

    else:
        flash('Unsupported export format')
        return redirect(url_for('calculations.view_calculation', id=id))


@calc_bp.route('/api/evaluate', methods=['POST'])
@login_required
def api_evaluate():
    """API endpoint to evaluate a mathematical expression with unit support"""
    data = request.json

    expression = data.get('expression', '')
    variables = data.get('variables', {})

    try:
        # Call the enhanced evaluate_expression function that returns unit information
        result = evaluate_expression(expression, variables)
        return jsonify({
            'status': 'success',
            'result': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


@calc_bp.route('/api/solve', methods=['POST'])
@login_required
def api_solve():
    """API endpoint to solve equations with unit support"""
    data = request.json

    equation = data.get('equation', '')
    variables = data.get('variables', {})
    solving_for = data.get('solving_for', '')

    try:
        # Call the enhanced solve_equation function that handles units
        solutions = solve_equation(equation, solving_for, variables)
        return jsonify({
            'status': 'success',
            'result': solutions
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


@calc_bp.route('/api/plot', methods=['POST'])
@login_required
def api_plot():
    """API endpoint to generate plots"""
    data = request.json

    plot_type = data.get('type', 'line')
    x_data = data.get('x_data', [])
    y_data = data.get('y_data', [])
    title = data.get('title', 'Plot')
    x_label = data.get('x_label', 'X')
    y_label = data.get('y_label', 'Y')

    try:
        # Generate plot and return as base64 encoded image
        image_data = generate_plot(plot_type, x_data, y_data, title, x_label, y_label)

        return jsonify({
            'status': 'success',
            'image_data': image_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


@calc_bp.route('/api/convert_unit', methods=['POST'])
@login_required
def api_convert_unit():
    """API endpoint to convert units"""
    data = request.json

    value = data.get('value', 0)
    from_unit = data.get('from_unit', '')
    to_unit = data.get('to_unit', '')

    try:
        result = convert_unit(value, from_unit, to_unit)
        return jsonify({
            'status': 'success',
            'result': {
                'value': result,
                'unit': to_unit,
                'formatted': f"{result} {to_unit}"
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


@calc_bp.route('/<int:id>/copy', methods=['POST'])
@login_required
def copy_calculation(id):
    """Copy a shared calculation to the user's personal collection"""
    source_sheet = CalculationSheet.query.get_or_404(id)

    # Check if the calculation is public or belongs to the user
    if not source_sheet.is_public and source_sheet.user_id != current_user.id:
        return jsonify({
            'status': 'error',
            'message': 'Permission denied'
        }), 403

    # Create a new calculation sheet as a copy
    new_sheet = CalculationSheet(
        title=f"Copy of {source_sheet.title}",
        description=source_sheet.description,
        content=source_sheet.content,
        variables=source_sheet.variables,
        user_id=current_user.id,
        is_template=False,
        is_public=False
    )

    db.session.add(new_sheet)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Calculation copied successfully',
        'id': new_sheet.id
    })