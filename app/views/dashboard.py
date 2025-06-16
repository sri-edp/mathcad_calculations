from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from app import db
from app.models.calculation_sheet import CalculationSheet
from app.models.template import Template
from datetime import datetime

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
@login_required
def index():
    # Get user's recent calculation sheets
    recent_sheets = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).order_by(CalculationSheet.updated_at.desc()).limit(5).all()

    # Get available templates
    templates = Template.query.filter_by(
        is_published=True
    ).order_by(Template.name).all()

    return render_template(
        'dashboard/index.html',
        title='Dashboard',
        recent_sheets=recent_sheets,
        templates=templates
    )


@dashboard_bp.route('/my-calculations')
@login_required
def my_calculations():
    # Get all of the user's calculation sheets
    sheets = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).order_by(CalculationSheet.updated_at.desc()).all()

    return render_template(
        'dashboard/my_calculations.html',
        title='My Calculations',
        sheets=sheets
    )


@dashboard_bp.route('/shared-calculations')
@login_required
def shared_calculations():
    # Get all public calculation sheets from other users
    sheets = CalculationSheet.query.filter(
        CalculationSheet.user_id != current_user.id,
        CalculationSheet.is_public == True,
        CalculationSheet.is_template == False
    ).order_by(CalculationSheet.updated_at.desc()).all()

    return render_template(
        'dashboard/shared_calculations.html',
        title='Shared Calculations',
        sheets=sheets
    )


@dashboard_bp.route('/statistics')
@login_required
def statistics():
    # Count user's calculation sheets
    sheet_count = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).count()

    # Count user's template sheets
    template_count = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=True
    ).count()

    # Get latest activity
    latest_sheet = CalculationSheet.query.filter_by(
        user_id=current_user.id
    ).order_by(CalculationSheet.updated_at.desc()).first()

    # Count total calculations in the system
    total_sheets = CalculationSheet.query.filter_by(is_template=False).count()

    return render_template(
        'dashboard/statistics.html',
        title='Statistics',
        sheet_count=sheet_count,
        template_count=template_count,
        latest_sheet=latest_sheet,
        total_sheets=total_sheets
    )
