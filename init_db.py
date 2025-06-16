"""
Database initialization script for Engineering Calculator
This script creates the database tables and populates initial data
"""

from app import create_app, db
from app.models.user import User
from app.models.calculation_sheet import CalculationSheet
from app.models.template import Template, CustomFunction
import json
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import random

# Create the Flask application
app = create_app()


def init_db():
    """Initialize the database with tables and sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()

        print("Created database tables")

        # Check if users already exist
        if User.query.count() == 0:
            create_sample_users()
            create_sample_templates()
            create_sample_calculations()
            create_sample_functions()
            print("Added sample data")
        else:
            print("Sample data already exists")


def create_sample_users():
    """Create sample users for testing"""
    # Admin user
    admin = User(
        username='admin',
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        role='admin',
        department='Administration',
        created_at=datetime.utcnow() - timedelta(days=30)
    )
    admin.set_password('admin123')

    # Regular users
    engineer1 = User(
        username='john',
        email='john@example.com',
        first_name='John',
        last_name='Smith',
        role='user',
        department='Mechanical Engineering',
        created_at=datetime.utcnow() - timedelta(days=25)
    )
    engineer1.set_password('password')

    engineer2 = User(
        username='jane',
        email='jane@example.com',
        first_name='Jane',
        last_name='Doe',
        role='user',
        department='Electrical Engineering',
        created_at=datetime.utcnow() - timedelta(days=20)
    )
    engineer2.set_password('password')

    db.session.add_all([admin, engineer1, engineer2])
    db.session.commit()


def create_sample_templates():
    """Create sample calculation templates"""
    # Mechanical engineering template
    stress_analysis = Template(
        name='Stress Analysis',
        description='Template for basic stress analysis calculations including tension, compression, and bending.',
        category='Mechanical Engineering',
        user_id=1,  # Admin user
        is_published=True,
        created_at=datetime.utcnow() - timedelta(days=15)
    )

    stress_content = {
        "blocks": [
            {
                "type": "text",
                "data": {
                    "text": "# Stress Analysis Calculations\n\nThis template provides formulas for basic stress analysis."
                }
            },
            {
                "type": "equation",
                "data": {
                    "latex": "\\sigma = \\frac{F}{A}"
                }
            },
            {
                "type": "text",
                "data": {
                    "text": "Where:\n- σ is the normal stress\n- F is the applied force\n- A is the cross-sectional area"
                }
            }
        ]
    }
    stress_analysis.set_content(stress_content)

    # Electrical engineering template
    circuit_analysis = Template(
        name='Circuit Analysis',
        description='Basic DC circuit analysis template using Ohm\'s Law and Kirchhoff\'s Laws.',
        category='Electrical Engineering',
        user_id=1,  # Admin user
        is_published=True,
        created_at=datetime.utcnow() - timedelta(days=10)
    )

    circuit_content = {
        "blocks": [
            {
                "type": "text",
                "data": {
                    "text": "# DC Circuit Analysis\n\nBasic formulas for analyzing DC circuits."
                }
            },
            {
                "type": "equation",
                "data": {
                    "latex": "V = I \\times R"
                }
            },
            {
                "type": "text",
                "data": {
                    "text": "Where:\n- V is the voltage (volts)\n- I is the current (amps)\n- R is the resistance (ohms)"
                }
            }
        ]
    }
    circuit_analysis.set_content(circuit_content)

    # Civil engineering template
    beam_design = Template(
        name='Beam Design',
        description='Template for calculating beam deflection and stress.',
        category='Civil Engineering',
        user_id=1,  # Admin user
        is_published=True,
        created_at=datetime.utcnow() - timedelta(days=5)
    )

    beam_content = {
        "blocks": [
            {
                "type": "text",
                "data": {
                    "text": "# Beam Design Calculations\n\nThis template helps calculate beam deflection and stress."
                }
            },
            {
                "type": "equation",
                "data": {
                    "latex": "\\delta = \\frac{PL^3}{3EI}"
                }
            },
            {
                "type": "text",
                "data": {
                    "text": "Where:\n- δ is the deflection\n- P is the applied load\n- L is the beam length\n- E is the elastic modulus\n- I is the moment of inertia"
                }
            }
        ]
    }
    beam_design.set_content(beam_content)

    db.session.add_all([stress_analysis, circuit_analysis, beam_design])
    db.session.commit()


def create_sample_calculations():
    """Create sample calculation sheets"""
    # Sample calculation for John
    calc1 = CalculationSheet(
        title='Beam Deflection Analysis',
        description='Calculation of beam deflection under distributed load',
        user_id=2,  # John
        is_template=False,
        is_public=True,
        created_at=datetime.utcnow() - timedelta(days=5),
        updated_at=datetime.utcnow() - timedelta(days=5)
    )

    calc1_content = {
        "blocks": [
            {
                "type": "text",
                "data": {
                    "text": "# Beam Deflection Analysis\n\nThis calculation analyzes the deflection of a simply supported beam under a uniform distributed load."
                }
            },
            {
                "type": "equation",
                "data": {
                    "latex": "\\delta_{max} = \\frac{5wL^4}{384EI}"
                }
            },
            {
                "type": "calculation",
                "data": {
                    "input": "5 * w * L^4 / (384 * E * I)",
                    "result": "<strong>Result:</strong> Depends on input values"
                }
            }
        ]
    }
    calc1.set_content(calc1_content)

    calc1_variables = {
        "w": {
            "value": "10",
            "unit": "kN/m",
            "description": "Distributed load"
        },
        "L": {
            "value": "5",
            "unit": "m",
            "description": "Beam length"
        },
        "E": {
            "value": "200e9",
            "unit": "Pa",
            "description": "Elastic modulus (steel)"
        },
        "I": {
            "value": "0.0004",
            "unit": "m^4",
            "description": "Moment of inertia"
        }
    }
    calc1.set_variables(calc1_variables)

    # Sample calculation for Jane
    calc2 = CalculationSheet(
        title='RC Filter Design',
        description='Design of a simple RC low-pass filter',
        user_id=3,  # Jane
        is_template=False,
        is_public=True,
        created_at=datetime.utcnow() - timedelta(days=3),
        updated_at=datetime.utcnow() - timedelta(days=2)
    )

    calc2_content = {
        "blocks": [
            {
                "type": "text",
                "data": {
                    "text": "# RC Low-Pass Filter Design\n\nDesign calculations for a simple RC low-pass filter."
                }
            },
            {
                "type": "equation",
                "data": {
                    "latex": "f_c = \\frac{1}{2\\pi RC}"
                }
            },
            {
                "type": "calculation",
                "data": {
                    "input": "1 / (2 * pi * R * C)",
                    "result": "<strong>Result:</strong> Cutoff frequency"
                }
            }
        ]
    }
    calc2.set_content(calc2_content)

    calc2_variables = {
        "R": {
            "value": "10000",
            "unit": "Ω",
            "description": "Resistance"
        },
        "C": {
            "value": "1e-6",
            "unit": "F",
            "description": "Capacitance"
        },
        "pi": {
            "value": "3.14159",
            "unit": "",
            "description": "Pi constant"
        }
    }
    calc2.set_variables(calc2_variables)

    db.session.add_all([calc1, calc2])
    db.session.commit()


def create_sample_functions():
    """Create sample custom functions"""
    # Engineering functions
    moment_of_inertia = CustomFunction(
        name='Rectangle Moment of Inertia',
        description='Calculate the moment of inertia for a rectangular cross-section',
        code='def rectangle_moment_of_inertia(b, h):\n    return (b * h**3) / 12',
        category='Mechanical Engineering',
        user_id=1,  # Admin
        is_published=True
    )
    moment_of_inertia.set_parameters([
        {"name": "b", "description": "Width of the rectangle", "type": "float"},
        {"name": "h", "description": "Height of the rectangle", "type": "float"}
    ])

    reynolds_number = CustomFunction(
        name='Reynolds Number',
        description='Calculate the Reynolds number for fluid flow',
        code='def reynolds_number(rho, v, L, mu):\n    return (rho * v * L) / mu',
        category='Fluid Mechanics',
        user_id=1,  # Admin
        is_published=True
    )
    reynolds_number.set_parameters([
        {"name": "rho", "description": "Fluid density", "type": "float"},
        {"name": "v", "description": "Flow velocity", "type": "float"},
        {"name": "L", "description": "Characteristic length", "type": "float"},
        {"name": "mu", "description": "Dynamic viscosity", "type": "float"}
    ])

    db.session.add_all([moment_of_inertia, reynolds_number])
    db.session.commit()


if __name__ == '__main__':
    init_db()
    print("Database initialization complete")