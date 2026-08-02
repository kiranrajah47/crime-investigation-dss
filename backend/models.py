"""
models.py
---------
Database models for the Crime Investigation DSS.
Uses SQLAlchemy ORM with SQLite as the database.

Tables:
    User    — stores admin and investigator accounts
    Case    — stores every analysis run with full results

Usage:
    from models import db, User, Case
    db.init_app(app)
    with app.app_context():
        db.create_all()
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()


# ── User model ─────────────────────────────────────────────────────────────────

class User(UserMixin, db.Model):
    """
    Stores all system users — admins and investigators.

    Roles:
        'admin'        — can manage users, view all cases, delete records
        'investigator' — can upload documents, run analysis, view own cases
    """
    __tablename__ = "users"

    id           = db.Column(db.Integer, primary_key=True)
    username     = db.Column(db.String(80),  unique=True, nullable=False)
    full_name    = db.Column(db.String(120), nullable=False)
    email        = db.Column(db.String(120), unique=True, nullable=False)
    password_hash= db.Column(db.String(256), nullable=False)
    role         = db.Column(db.String(20),  nullable=False, default="investigator")
    is_active    = db.Column(db.Boolean,     nullable=False, default=True)
    created_at   = db.Column(db.DateTime,    default=datetime.utcnow)

    # Relationship — one user can run many cases
    cases = db.relationship("Case", backref="investigator", lazy=True)

    def set_password(self, password: str):
        """Hash and store the password — never store plain text."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a password attempt against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def is_admin(self) -> bool:
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


# ── Case model ─────────────────────────────────────────────────────────────────

class Case(db.Model):
    """
    Stores every analysis run — the full ranked report, scores,
    timestamps, and which investigator ran it.

    The full report (list of suspect dicts) is stored as JSON
    in the report_json column so we can retrieve and display it
    exactly as it was when the analysis was run.
    """
    __tablename__ = "cases"

    id              = db.Column(db.Integer,     primary_key=True)
    case_id         = db.Column(db.String(50),  nullable=False)         # e.g. "2024-047"
    title           = db.Column(db.String(200), nullable=True)          # Optional case title
    num_suspects    = db.Column(db.Integer,     nullable=False)
    top_suspect     = db.Column(db.String(120), nullable=True)          # Name of #1 ranked
    top_score       = db.Column(db.Float,       nullable=True)          # Score of #1 ranked
    report_json     = db.Column(db.Text,        nullable=False)         # Full report as JSON
    victim_text     = db.Column(db.Text,        nullable=True)          # Document 1 text
    evidence_text   = db.Column(db.Text,        nullable=True)          # Document 2 text
    suspects_text   = db.Column(db.Text,        nullable=True)          # Document 3 text
    notes           = db.Column(db.Text,        nullable=True, default="") # Case investigator notes
    created_at      = db.Column(db.DateTime,    default=datetime.utcnow)

    # Foreign key — links each case to the user who ran it
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    def set_report(self, report: list):
        """Serialize the report list to JSON for storage."""
        self.report_json = json.dumps(report)

    def get_report(self) -> list:
        """Deserialize the stored JSON back to a Python list."""
        return json.loads(self.report_json)

    def formatted_date(self) -> str:
        """Return a human-readable date string for the dashboard."""
        return self.created_at.strftime("%d %b %Y, %I:%M %p")

    def __repr__(self):
        return f"<Case {self.case_id} by User {self.user_id}>"
