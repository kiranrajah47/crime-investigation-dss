"""
app.py  (updated)
-----------------
Main Flask application — now includes:
    - SQLite database via SQLAlchemy
    - User authentication via Flask-Login
    - Admin and Investigator roles
    - Case history logging to database
    - Auth and Admin blueprints

Run:
    python app.py
    Open http://127.0.0.1:5000

First time setup:
    On first run, a default admin account is created automatically:
        Username : admin
        Password : admin123
    Change this password immediately after first login via the admin panel.
"""

import os
from datetime import datetime
from flask import Flask, send_from_directory, request, redirect, url_for, flash, Blueprint
from flask_login import LoginManager, login_required, current_user
from flask_cors import CORS
from models import db, User, Case
from auth import auth
from admin import admin_bp
from api import api_bp
from ranker import build_full_report

# ── App setup ──────────────────────────────────────────────────────────────────

# BASE_DIR = backend/  |  PROJECT_ROOT = crime-investigation-dss/
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

app = Flask(
    __name__,
    static_folder=os.path.join(FRONTEND_DIST, "assets"),
    static_url_path="/assets",
)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])


app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-only-fallback-key-change-in-production")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'crime_dss.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"txt", "docx", "pdf"}

# ── Initialize extensions ──────────────────────────────────────────────────────

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"
login_manager.login_message = "Please log in to access this page."

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ── Register blueprints ────────────────────────────────────────────────────────

app.register_blueprint(auth)
app.register_blueprint(admin_bp)
app.register_blueprint(api_bp)

# ── Main blueprint (Jinja2 / render_template routes) ──────────────────────────
# DISABLED: Flask now serves the React build from frontend/dist/ instead.
# The routes below (GET /, /results/<id>, /history, /reset, /export/<id>)
# are replaced by the React SPA catch-all route at the bottom of this file.
# The /api blueprint in api.py handles all data endpoints for the React app.
#
# main = Blueprint("main", __name__)
#
# def allowed_file(filename): ...
# def read_uploaded_file(filepath): ...
# def parse_suspects_file(raw_text): ...
#
# @main.route("/")              → render_template("index.html")
# @main.route("/analyze")       → build_full_report() + redirect
# @main.route("/results/<id>")  → render_template("results.html")
# @main.route("/history")       → render_template("history.html")
# @main.route("/export/<id>")   → PDF download via make_response()
# @main.route("/reset")         → redirect to index
#
# app.register_blueprint(main)


# ── PDF export ─────────────────────────────────────────────────────────────────
# Must be registered BEFORE the SPA catch-all so Flask routes it correctly.
# Results.jsx uses <a href="/export/<id}"> as a direct browser download link,
# so this cannot live under /api (which would change the URL React expects).

@app.route("/export/<int:case_db_id>")
@login_required
def export_pdf(case_db_id):
    """Generate and stream a PDF report for a case."""
    from flask import make_response
    from pdf_export import generate_case_pdf

    case = Case.query.get_or_404(case_db_id)

    if not current_user.is_admin() and case.user_id != current_user.id:
        return make_response("Access denied.", 403)

    report = case.get_report()

    try:
        pdf_bytes = generate_case_pdf(case, report)
    except Exception as e:
        return make_response(f"PDF generation error: {str(e)}", 500)

    response = make_response(pdf_bytes)
    response.headers["Content-Type"]        = "application/pdf"
    response.headers["Content-Disposition"] = f'attachment; filename="{case.case_id}_report.pdf"'
    return response


# ── React SPA catch-all ────────────────────────────────────────────────────────
# Serves frontend/dist/index.html for every route not matched by /api.
# This allows React Router to handle client-side navigation.

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


# ── Database init ──────────────────────────────────────────────────────────────

def create_default_admin():
    with app.app_context():
        db.create_all()
        if User.query.count() == 0:
            admin = User(
                username  = "admin",
                full_name = "System Administrator",
                email     = "admin@crimeDSS.com",
                role      = "admin",
                is_active = True,
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("=" * 50)
            print("Default admin account created.")
            print("  Username : admin")
            print("  Password : admin123")
            print("Change this password after first login!")
            print("=" * 50)


if __name__ == "__main__":
    create_default_admin()
    app.run(debug=True)
