"""
Template filters for the Engineering Calculator application
"""

import markdown
from markupsafe import Markup


def register_filters(app):
    """Register custom filters with the Flask application"""

    @app.template_filter('markdown')
    def markdown_filter(text):
        """Convert Markdown text to HTML"""
        if not text:
            return ''
        return Markup(markdown.markdown(text, extensions=['fenced_code', 'tables']))