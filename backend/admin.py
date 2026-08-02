"""
admin.py
--------
Flask Blueprint for the admin panel.
Only users with role='admin' can access these routes.

Routes:
    GET      /admin/users           -> View all users
    GET/POST /admin/users/<id>/toggle  -> Activate/deactivate a user
    GET/POST /admin/users/<id>/delete  -> Delete a user
    GET      /admin/cases           -> View all cases across all users
    GET/POST /admin/cases/<id>/delete  -> Delete a case record
"""

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from models import db, User, Case

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def admin_required(f):
    """
    Decorator that restricts a route to admin users only.
    Redirects investigators away with an error message.
    """
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            flash("Access denied. Admin privileges required.")
            return redirect(url_for("main.index"))
        return f(*args, **kwargs)
    return decorated


# ── User management ────────────────────────────────────────────────────────────

@admin_bp.route("/users")
@login_required
@admin_required
def manage_users():
    """Show all registered users in a management table."""
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template("admin_users.html", users=users)


@admin_bp.route("/users/<int:user_id>/toggle", methods=["POST"])
@login_required
@admin_required
def toggle_user(user_id):
    """Activate or deactivate a user account."""
    user = User.query.get_or_404(user_id)

    # Prevent admin from deactivating their own account
    if user.id == current_user.id:
        flash("You cannot deactivate your own account.")
        return redirect(url_for("admin.manage_users"))

    user.is_active = not user.is_active
    db.session.commit()

    status = "activated" if user.is_active else "deactivated"
    flash(f"Account for {user.full_name} has been {status}.")
    return redirect(url_for("admin.manage_users"))


@admin_bp.route("/users/<int:user_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_user(user_id):
    """Permanently delete a user account and all their cases."""
    user = User.query.get_or_404(user_id)

    if user.id == current_user.id:
        flash("You cannot delete your own account.")
        return redirect(url_for("admin.manage_users"))

    # Delete all cases linked to this user first
    Case.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()

    flash(f"User {user.username} and all their cases have been deleted.")
    return redirect(url_for("admin.manage_users"))


# ── Case management ────────────────────────────────────────────────────────────

@admin_bp.route("/cases")
@login_required
@admin_required
def all_cases():
    """Show all cases across all investigators."""
    cases = Case.query.order_by(Case.created_at.desc()).all()
    return render_template("admin_cases.html", cases=cases)


@admin_bp.route("/cases/<int:case_id>/delete", methods=["POST"])
@login_required
@admin_required
def delete_case(case_id):
    """Permanently delete a case record."""
    case = Case.query.get_or_404(case_id)
    db.session.delete(case)
    db.session.commit()
    flash(f"Case {case.case_id} has been deleted.")
    return redirect(url_for("admin.all_cases"))
