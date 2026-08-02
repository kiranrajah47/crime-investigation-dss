"""
auth.py
-------
Flask Blueprint handling all authentication routes.
Login, logout, and first-time admin registration.

Routes:
    GET/POST /login     -> Login page
    GET      /logout    -> Logs out current user
    GET/POST /register  -> Admin-only: create new user accounts
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User

auth = Blueprint("auth", __name__)


# ── Login ──────────────────────────────────────────────────────────────────────

@auth.route("/login", methods=["GET", "POST"])
def login():
    """
    Show login form on GET.
    Validate credentials and log in user on POST.
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        remember = request.form.get("remember") == "on"

        if not username or not password:
            flash("Please enter both username and password.")
            return render_template("login.html")

        user = User.query.filter_by(username=username).first()

        if not user or not user.check_password(password):
            flash("Incorrect username or password. Please try again.")
            return render_template("login.html")

        if not user.is_active:
            flash("Your account has been deactivated. Please contact the admin.")
            return render_template("login.html")

        login_user(user, remember=remember)

        # Redirect to the page they were trying to visit, or home
        next_page = request.args.get("next")
        return redirect(next_page or url_for("main.index"))

    return render_template("login.html")


# ── Logout ─────────────────────────────────────────────────────────────────────

@auth.route("/logout")
@login_required
def logout():
    """Log out the current user and redirect to login page."""
    logout_user()
    flash("You have been logged out successfully.")
    return redirect(url_for("auth.login"))


# ── Register (admin only) ──────────────────────────────────────────────────────

@auth.route("/register", methods=["GET", "POST"])
@login_required
def register():
    if not current_user.is_admin():
        flash("Access denied. Only administrators can create new accounts.")
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username  = request.form.get("username", "").strip()
        full_name = request.form.get("full_name", "").strip()
        email     = request.form.get("email", "").strip()
        password  = request.form.get("password", "").strip()
        role      = request.form.get("role", "investigator").strip()

        if not all([username, full_name, email, password]):
            flash("All fields are required.")
            return render_template("register.html")

        if role not in ["admin", "investigator"]:
            flash("Invalid role selected.")
            return render_template("register.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters long.")
            return render_template("register.html")

        if User.query.filter_by(username=username).first():
            flash(f"Username '{username}' is already taken.")
            return render_template("register.html")

        if User.query.filter_by(email=email).first():
            flash(f"Email '{email}' is already registered.")
            return render_template("register.html")

        new_user = User(
            username=username,
            full_name=full_name,
            email=email,
            role=role,
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash(f"Account created successfully for {full_name} ({role}).")
        return redirect(url_for("admin.manage_users"))

    return render_template("register.html")

# ── Change password ────────────────────────────────────────────────────────────

@auth.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    """Allow any logged-in user to change their own password."""
    if request.method == "POST":
        current  = request.form.get("current_password", "").strip()
        new_pw   = request.form.get("new_password", "").strip()
        confirm  = request.form.get("confirm_password", "").strip()

        if not current_user.check_password(current):
            flash("Current password is incorrect.")
            return render_template("change_password.html")

        if len(new_pw) < 6:
            flash("New password must be at least 6 characters.")
            return render_template("change_password.html")

        if new_pw != confirm:
            flash("New passwords do not match.")
            return render_template("change_password.html")

        current_user.set_password(new_pw)
        from models import db
        db.session.commit()
        flash("Password changed successfully.")
        return redirect(url_for("main.index"))

    return render_template("change_password.html")

    if role not in ["admin", "investigator"]:
        flash("Invalid role selected.")
        return render_template("register.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters long.")
            return render_template("register.html")

        # Check for duplicates
        if User.query.filter_by(username=username).first():
            flash(f"Username '{username}' is already taken.")
            return render_template("register.html")

        if User.query.filter_by(email=email).first():
            flash(f"Email '{email}' is already registered.")
            return render_template("register.html")

        # Create and save new user
        new_user = User(
            username  = username,
            full_name = full_name,
            email     = email,
            role      = role,
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash(f"Account created successfully for {full_name} ({role}).")
        return redirect(url_for("admin.manage_users"))

    return render_template("register.html")
