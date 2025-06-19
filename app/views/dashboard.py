from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import current_user, login_required
from app import db
from app.models.calculation_sheet import CalculationSheet
from app.models.template import Template
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
@login_required
def index():
    """Main dashboard page with overview and recent activity"""
    # Get user's recent calculation sheets
    recent_sheets = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).order_by(CalculationSheet.updated_at.desc()).limit(5).all()

    # Get available templates - prioritize published ones
    featured_templates = Template.query.filter_by(
        is_published=True
    ).order_by(Template.created_at.desc()).limit(6).all()

    # Get user statistics for quick overview
    user_stats = {
        'total_calculations': CalculationSheet.query.filter_by(
            user_id=current_user.id, is_template=False
        ).count(),
        'total_templates': CalculationSheet.query.filter_by(
            user_id=current_user.id, is_template=True
        ).count(),
        'public_calculations': CalculationSheet.query.filter_by(
            user_id=current_user.id, is_template=False, is_public=True
        ).count()
    }

    return render_template(
        'dashboard/index.html',
        title='Dashboard',
        recent_sheets=recent_sheets,
        templates=featured_templates,
        user_stats=user_stats
    )


@dashboard_bp.route('/my-calculations')
@login_required
def my_calculations():
    """Display all user's calculation sheets with sorting and filtering"""
    # Get sorting and filtering parameters
    sort_by = request.args.get('sort', 'updated_at')
    sort_order = request.args.get('order', 'desc')
    search_query = request.args.get('search', '').strip()

    # Build the base query
    query = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    )

    # Apply search filter if provided
    if search_query:
        search_filter = or_(
            CalculationSheet.title.contains(search_query),
            CalculationSheet.description.contains(search_query)
        )
        query = query.filter(search_filter)

    # Apply sorting
    if sort_by == 'title':
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.title.asc())
        else:
            query = query.order_by(CalculationSheet.title.desc())
    elif sort_by == 'created_at':
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.created_at.asc())
        else:
            query = query.order_by(CalculationSheet.created_at.desc())
    else:  # default to updated_at
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.updated_at.asc())
        else:
            query = query.order_by(CalculationSheet.updated_at.desc())

    sheets = query.all()

    return render_template(
        'dashboard/my_calculations.html',
        title='My Calculations',
        sheets=sheets,
        sort_by=sort_by,
        sort_order=sort_order,
        search_query=search_query
    )


@dashboard_bp.route('/shared-calculations')
@login_required
def shared_calculations():
    """Display public calculation sheets from other users"""
    # Get sorting parameters
    sort_by = request.args.get('sort', 'updated_at')
    sort_order = request.args.get('order', 'desc')
    search_query = request.args.get('search', '').strip()
    category = request.args.get('category', '')

    # Build the base query for public calculations from other users
    query = CalculationSheet.query.filter(
        CalculationSheet.user_id != current_user.id,
        CalculationSheet.is_public == True,
        CalculationSheet.is_template == False
    )

    # Apply search filter if provided
    if search_query:
        search_filter = or_(
            CalculationSheet.title.contains(search_query),
            CalculationSheet.description.contains(search_query),
            User.first_name.contains(search_query),
            User.last_name.contains(search_query)
        )
        query = query.join(User).filter(search_filter)
    else:
        query = query.join(User)

    # Apply sorting with proper joins
    if sort_by == 'title':
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.title.asc())
        else:
            query = query.order_by(CalculationSheet.title.desc())
    elif sort_by == 'author':
        if sort_order == 'asc':
            query = query.order_by(User.first_name.asc(), User.last_name.asc())
        else:
            query = query.order_by(User.first_name.desc(), User.last_name.desc())
    elif sort_by == 'created_at':
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.created_at.asc())
        else:
            query = query.order_by(CalculationSheet.created_at.desc())
    else:  # default to updated_at
        if sort_order == 'asc':
            query = query.order_by(CalculationSheet.updated_at.asc())
        else:
            query = query.order_by(CalculationSheet.updated_at.desc())

    sheets = query.all()

    return render_template(
        'dashboard/shared_calculations.html',
        title='Shared Calculations',
        sheets=sheets,
        sort_by=sort_by,
        sort_order=sort_order,
        search_query=search_query
    )


@dashboard_bp.route('/statistics')
@login_required
def statistics():
    """Display detailed user statistics and analytics"""
    # Count user's calculation sheets
    sheet_count = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).count()

    # Count user's template sheets
    template_count = Template.query.filter_by(
        user_id=current_user.id
    ).count()

    # Get latest activity
    latest_sheet = CalculationSheet.query.filter_by(
        user_id=current_user.id
    ).order_by(CalculationSheet.updated_at.desc()).first()

    # Count total calculations in the system
    total_sheets = CalculationSheet.query.filter_by(is_template=False).count()

    # Count public vs private calculations
    public_sheets = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False,
        is_public=True
    ).count()

    private_sheets = sheet_count - public_sheets

    # Calculate activity over time (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_activity = CalculationSheet.query.filter(
        CalculationSheet.user_id == current_user.id,
        CalculationSheet.created_at >= thirty_days_ago
    ).count()

    # Get creation dates for activity chart data
    daily_activity = db.session.query(
        func.date(CalculationSheet.created_at).label('date'),
        func.count(CalculationSheet.id).label('count')
    ).filter(
        CalculationSheet.user_id == current_user.id,
        CalculationSheet.created_at >= thirty_days_ago
    ).group_by(func.date(CalculationSheet.created_at)).all()

    # Get user's department statistics
    department_stats = None
    if current_user.department:
        department_users = User.query.filter_by(department=current_user.department).count()
        department_calculations = db.session.query(func.count(CalculationSheet.id)).join(User).filter(
            User.department == current_user.department,
            CalculationSheet.is_template == False
        ).scalar()
    else:
        department_users = 0
        department_calculations = 0

    return render_template(
        'dashboard/statistics.html',
        title='Statistics',
        sheet_count=sheet_count,
        template_count=template_count,
        latest_sheet=latest_sheet,
        total_sheets=total_sheets,
        public_sheets=public_sheets,
        private_sheets=private_sheets,
        recent_activity=recent_activity,
        daily_activity=daily_activity,
        department_users=department_users,
        department_calculations=department_calculations
    )


@dashboard_bp.route('/api/activity-data')
@login_required
def activity_data():
    """API endpoint to get user activity data for charts"""
    days = request.args.get('days', 30, type=int)
    days_ago = datetime.utcnow() - timedelta(days=days)

    # Get daily activity counts
    daily_counts = db.session.query(
        func.date(CalculationSheet.created_at).label('date'),
        func.count(CalculationSheet.id).label('count')
    ).filter(
        CalculationSheet.user_id == current_user.id,
        CalculationSheet.created_at >= days_ago
    ).group_by(func.date(CalculationSheet.created_at)).all()

    # Format data for charts
    activity_data = []
    for date, count in daily_counts:
        activity_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })

    return jsonify({
        'status': 'success',
        'data': activity_data
    })


@dashboard_bp.route('/search')
@login_required
def search():
    """Global search across user's calculations and templates"""
    query = request.args.get('q', '').strip()

    if not query:
        return render_template('dashboard/search_results.html',
                               query='', results=[], title='Search')

    # Search in calculations
    calculation_results = CalculationSheet.query.filter(
        CalculationSheet.user_id == current_user.id,
        or_(
            CalculationSheet.title.contains(query),
            CalculationSheet.description.contains(query)
        )
    ).all()

    # Search in templates (user can access)
    template_results = Template.query.filter(
        or_(
            and_(Template.user_id == current_user.id),
            and_(Template.is_published == True)
        ),
        or_(
            Template.name.contains(query),
            Template.description.contains(query)
        )
    ).all()

    results = {
        'calculations': calculation_results,
        'templates': template_results
    }

    return render_template('dashboard/search_results.html',
                           query=query, results=results, title=f'Search: {query}')


@dashboard_bp.route('/quick-actions')
@login_required
def quick_actions():
    """Display quick action shortcuts for common tasks"""
    # Get recently used templates
    recent_templates = Template.query.filter_by(
        is_published=True
    ).order_by(Template.created_at.desc()).limit(5).all()

    # Get user's recent calculations that can be copied
    recent_calculations = CalculationSheet.query.filter_by(
        user_id=current_user.id,
        is_template=False
    ).order_by(CalculationSheet.updated_at.desc()).limit(5).all()

    return render_template('dashboard/quick_actions.html',
                           recent_templates=recent_templates,
                           recent_calculations=recent_calculations,
                           title='Quick Actions')


@dashboard_bp.errorhandler(404)
def dashboard_not_found(error):
    return render_template('errors/404.html'), 404


@dashboard_bp.errorhandler(500)
def dashboard_internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500