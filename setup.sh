#!/bin/bash

# Engineering Calculator Setup Script

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
SECRET_KEY=YourSecretKeyHere-ChangeThisToSomethingRandom
DATABASE_URL=sqlite:///app.db
FLASK_APP=run.py
FLASK_DEBUG=1
EOF

# Create directories
echo "Creating directories..."
python -c "
import os
directories = [
    'app/templates/auth',
    'app/templates/dashboard',
    'app/templates/calculations',
    'app/templates/templates',
    'app/static/css',
    'app/static/js',
    'app/static/img',
    'app/static/uploads',
    'app/static/exports/pdf',
    'app/static/exports/word'
]
for directory in directories:
    os.makedirs(directory, exist_ok=True)
"

# Initialize database
echo "Initializing database..."
python init_db.py

echo "Setup complete! You can now run the application with: flask run"