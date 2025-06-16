from app import create_app, db
from app.models.user import User
from app.models.calculation_sheet import CalculationSheet
from app.models.template import Template

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'CalculationSheet': CalculationSheet,
        'Template': Template
    }

if __name__ == '__main__':
    app.run(debug=True)