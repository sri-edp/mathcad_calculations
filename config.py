import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File upload settings
    UPLOAD_FOLDER = os.path.join(basedir, 'app/static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

    # Mail settings
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')

    # Other application settings
    CALCULATION_TEMPLATES_FOLDER = os.path.join(basedir, 'app/static/templates')
    PDF_EXPORT_FOLDER = os.path.join(basedir, 'app/static/exports/pdf')
    WORD_EXPORT_FOLDER = os.path.join(basedir, 'app/static/exports/word')

    # Plotting settings
    PLOT_DPI = 100
    MAX_PLOT_SIZE = (1200, 800)  # Width, Height in pixels