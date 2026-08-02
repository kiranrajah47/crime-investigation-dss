"""
api.py
------
Blueprint for the JSON REST API to support the React frontend.
Provides routes under the /api prefix.
"""

import os
import re
import html
from datetime import datetime
from functools import wraps
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_login import login_user, logout_user, current_user
from backend.models import db, User, Case
from backend.ranker import build_full_report
from backend.suspect_tracker import find_repeat_suspects


def generate_highlighted_text(profile_text: str, top_keywords: list) -> str:
    if not profile_text:
        return ""
    if not top_keywords:
        return html.escape(profile_text)

    valid_kws = [k for k in top_keywords if k and isinstance(k, str) and k.strip()]
    if not valid_kws:
        return html.escape(profile_text)

    sorted_kws = sorted(set(valid_kws), key=len, reverse=True)
    escaped_text = html.escape(profile_text)
    pattern_str = "|".join(re.escape(html.escape(k)) for k in sorted_kws)
    pattern = re.compile(pattern_str, re.IGNORECASE)

    return pattern.sub(lambda m: f"<mark>{m.group(0)}</mark>", escaped_text)


# ── File helpers (used by /cases/analyze) ─────────────────────────────────────

ALLOWED_EXTENSIONS = {"txt", "docx", "pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def read_uploaded_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".txt":
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    elif ext == ".docx":
        from docx import Document
        doc = Document(filepath)
        return "\n".join([p.text for p in doc.paragraphs])
    elif ext == ".pdf":
        try:
            import fitz
        except ImportError:
            raise ImportError("PyMuPDF is required. Run: pip install PyMuPDF")
        pdf = fitz.open(filepath)
        text = "\n".join([page.get_text() for page in pdf])
        pdf.close()
        return text
    return ""


def parse_suspects_file(raw_text):
    suspects = []
    current_name = None
    current_lines = []

    for line in raw_text.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("SUSPECT:"):
            if current_name and current_lines:
                suspects.append({
                    "name": current_name,
                    "text": "\n".join(current_lines).strip()
                })
            current_name = stripped[len("SUSPECT:"):].strip()
            current_lines = []
        else:
            if current_name:
                current_lines.append(line)

    if current_name and current_lines:
        suspects.append({
            "name": current_name,
            "text": "\n".join(current_lines).strip()
        })

    return suspects

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ── Custom API decorators ──────────────────────────────────────────────────────

def api_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"success": False, "message": "Authentication required."}), 401
        return f(*args, **kwargs)
    return decorated

def api_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"success": False, "message": "Authentication required."}), 401
        if not current_user.is_admin():
            return jsonify({"success": False, "message": "Access denied. Admin privileges required."}), 403
        return f(*args, **kwargs)
    return decorated

# ── Auth endpoints ─────────────────────────────────────────────────────────────

@api_bp.route("/auth/status", methods=["GET"])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            "isAuthenticated": True,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "fullName": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role
            }
        })
    return jsonify({"isAuthenticated": False})

@api_bp.route("/auth/login", methods=["POST"])
def auth_login():
    if current_user.is_authenticated:
        return jsonify({
            "success": True,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "fullName": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role
            }
        })

    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    remember = data.get("remember", False)

    if not username or not password:
        return jsonify({"success": False, "message": "Please enter both username and password."}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Incorrect username or password. Please try again."}), 401

    if not user.is_active:
        return jsonify({"success": False, "message": "Your account has been deactivated. Please contact the admin."}), 403

    login_user(user, remember=remember)
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "email": user.email,
            "role": user.role
        }
    })

@api_bp.route("/auth/logout", methods=["POST"])
@api_login_required
def auth_logout():
    logout_user()
    return jsonify({"success": True, "message": "You have been logged out successfully."})

@api_bp.route("/auth/change-password", methods=["POST"])
@api_login_required
def auth_change_password():
    data = request.get_json() or {}
    current_pw = data.get("current_password", "").strip()
    new_pw = data.get("new_password", "").strip()
    confirm_pw = data.get("confirm_password", "").strip()

    if not current_user.check_password(current_pw):
        return jsonify({"success": False, "message": "Current password is incorrect."}), 400

    if len(new_pw) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters."}), 400

    if new_pw != confirm_pw:
        return jsonify({"success": False, "message": "New passwords do not match."}), 400

    current_user.set_password(new_pw)
    db.session.commit()
    return jsonify({"success": True, "message": "Password changed successfully."})

# ── Stats endpoint ─────────────────────────────────────────────────────────────

@api_bp.route("/dashboard/stats", methods=["GET"])
@api_login_required
def dashboard_stats():
    total_cases = Case.query.filter_by(user_id=current_user.id).count()
    total_suspects = sum(c.num_suspects for c in Case.query.filter_by(user_id=current_user.id).all())
    this_month = Case.query.filter(
        Case.user_id == current_user.id,
        Case.created_at >= datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    ).count()

    return jsonify({
        "total_cases": total_cases,
        "total_suspects": total_suspects,
        "this_month": this_month
    })

# ── Case endpoints ─────────────────────────────────────────────────────────────

@api_bp.route("/cases/analyze", methods=["POST"])
@api_login_required
def cases_analyze():
    for field in ["victim_file", "evidence_file", "suspects_file"]:
        if field not in request.files or request.files[field].filename == "":
            return jsonify({"success": False, "message": f"Please upload all 3 documents. Missing: {field.replace('_', ' ')}."}), 400

    victim_file = request.files["victim_file"]
    evidence_file = request.files["evidence_file"]
    suspects_file = request.files["suspects_file"]

    for f in [victim_file, evidence_file, suspects_file]:
        if not allowed_file(f.filename):
            return jsonify({"success": False, "message": f"Invalid file type: {f.filename}. Upload .txt, .docx, or .pdf only."}), 400

    victim_ext = os.path.splitext(victim_file.filename)[1].lower()
    evidence_ext = os.path.splitext(evidence_file.filename)[1].lower()
    suspects_ext = os.path.splitext(suspects_file.filename)[1].lower()

    victim_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"victim{victim_ext}")
    evidence_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"evidence{evidence_ext}")
    suspects_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"suspects{suspects_ext}")

    victim_file.save(victim_path)
    evidence_file.save(evidence_path)
    suspects_file.save(suspects_path)

    victim_text = read_uploaded_file(victim_path)
    evidence_text = read_uploaded_file(evidence_path)
    suspects_text = read_uploaded_file(suspects_path)

    for label, text in [("victim", victim_text), ("evidence", evidence_text), ("suspects", suspects_text)]:
        if not text.strip():
            return jsonify({"success": False, "message": f"Document ({label}) is empty. Please check the file."}), 400

    suspects = parse_suspects_file(suspects_text)
    if not suspects:
        return jsonify({"success": False, "message": "No suspects found. Each suspect must start with: SUSPECT: Name"}), 400

    try:
        custom_weights = {
            "physical_evidence": float(request.form.get("w_physical", 0.55)),
            "witness_statement": float(request.form.get("w_witness", 0.35)),
            "past_history": float(request.form.get("w_history", 0.25)),
            "alibi_penalty": -float(request.form.get("w_alibi", 0.25)),
        }
    except (ValueError, TypeError):
        custom_weights = None

    try:
        report = build_full_report(suspects, victim_text, evidence_text, custom_weights=custom_weights)
    except Exception as e:
        return jsonify({"success": False, "message": f"Analysis error: {str(e)}"}), 500

    case_id = f"CASE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    raw_title = request.form.get("case_title", "").strip()
    if not raw_title:
        case_title = f"Case — {datetime.utcnow().strftime('%d %b %Y')}"
    else:
        # Title case first letters of words, but preserve internal capitalizations
        case_title = " ".join([w[0].upper() + w[1:] if w else "" for w in raw_title.split()])

    new_case = Case(
        case_id=case_id,
        title=case_title,
        num_suspects=len(suspects),
        top_suspect=report[0]["name"] if report else "",
        top_score=report[0]["final_score"] if report else 0.0,
        victim_text=victim_text,
        evidence_text=evidence_text,
        suspects_text=suspects_text,
        user_id=current_user.id,
    )
    new_case.set_report(report)
    db.session.add(new_case)
    db.session.commit()

    return jsonify({
        "success": True,
        "case_db_id": new_case.id,
        "case_id": new_case.case_id
    })

@api_bp.route("/cases/history", methods=["GET"])
@api_login_required
def cases_history():
    if current_user.is_admin():
        # Admins see all cases
        cases = Case.query.order_by(Case.created_at.desc()).all()
    else:
        # Investigators see their own cases
        cases = Case.query.filter_by(user_id=current_user.id).order_by(Case.created_at.desc()).all()

    return jsonify([{
        "id": c.id,
        "case_id": c.case_id,
        "title": c.title,
        "top_suspect": c.top_suspect,
        "top_score": c.top_score,
        "num_suspects": c.num_suspects,
        "created_at": c.created_at.isoformat(),
        "formatted_date": c.formatted_date(),
        "investigator": {
            "id": c.investigator.id,
            "fullName": c.investigator.full_name
        }
    } for c in cases])

@api_bp.route("/cases/<int:case_db_id>", methods=["GET"])
@api_login_required
def case_details(case_db_id):
    case = Case.query.get_or_404(case_db_id)

    if not current_user.is_admin() and case.user_id != current_user.id:
        return jsonify({"success": False, "message": "Access denied. You can only view your own cases."}), 403

    report = case.get_report() or []
    parsed_suspects = parse_suspects_file(case.suspects_text or "")
    suspect_text_map = {s["name"]: s["text"] for s in parsed_suspects}

    for suspect in report:
        if isinstance(suspect, dict):
            profile_text = suspect.get("text") or suspect_text_map.get(suspect.get("name"), "")
            if not profile_text:
                s_name = suspect.get("name", "").strip().lower()
                for name, txt in suspect_text_map.items():
                    if name.strip().lower() == s_name:
                        profile_text = txt
                        break

            top_keywords = suspect.get("top_keywords", [])
            suspect["highlighted_text"] = generate_highlighted_text(profile_text, top_keywords)

    return jsonify({
        "case": {
            "id": case.id,
            "case_id": case.case_id,
            "title": case.title,
            "num_suspects": case.num_suspects,
            "top_suspect": case.top_suspect,
            "top_score": case.top_score,
            "notes": case.notes or "",
            "formatted_date": case.formatted_date(),
            "created_at": case.created_at.isoformat()
        },
        "report": report
    })


@api_bp.route("/cases/<int:case_db_id>/notes", methods=["POST"])
@api_login_required
def update_case_notes(case_db_id):
    case = Case.query.get_or_404(case_db_id)

    if not current_user.is_admin() and case.user_id != current_user.id:
        return jsonify({"success": False, "message": "Access denied. You can only update notes for your own cases."}), 403

    data = request.get_json() or {}
    notes = data.get("notes", "")

    case.notes = notes
    db.session.commit()

    return jsonify({"success": True, "message": "Notes saved successfully."})

@api_bp.route("/cases/<int:case_db_id>/repeat-suspects", methods=["GET"])
@api_login_required
def case_repeat_suspects(case_db_id):
    case = Case.query.get_or_404(case_db_id)

    if not current_user.is_admin() and case.user_id != current_user.id:
        return jsonify({"success": False, "message": "Access denied. You can only view your own cases."}), 403

    report = case.get_report() or []
    top_4_suspects = [s["name"] for s in report[:4] if isinstance(s, dict) and "name" in s]

    all_repeats = find_repeat_suspects(case.id, top_4_suspects, top_n=4)
    filtered_repeats = [s for s in all_repeats if s["total_appearances"] >= 2]

    return jsonify({
        "repeat_suspects": filtered_repeats
    })

# ── Admin endpoints ────────────────────────────────────────────────────────────

@api_bp.route("/admin/users", methods=["GET"])
@api_admin_required
def admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "fullName": u.full_name,
        "email": u.email,
        "role": u.role,
        "isActive": u.is_active,
        "casesCount": len(u.cases),
        "createdAt": u.created_at.isoformat()
    } for u in users])

@api_bp.route("/admin/users/register", methods=["POST"])
@api_admin_required
def admin_register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "investigator").strip()

    if not all([username, full_name, email, password]):
        return jsonify({"success": False, "message": "All fields are required."}), 400

    if role not in ["admin", "investigator"]:
        return jsonify({"success": False, "message": "Invalid role selected."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": f"Username '{username}' is already taken."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": f"Email '{email}' is already registered."}), 400

    new_user = User(
        username=username,
        full_name=full_name,
        email=email,
        role=role,
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": f"Account created successfully for {full_name} ({role})."})

@api_bp.route("/admin/users/<int:user_id>/toggle", methods=["POST"])
@api_admin_required
def admin_toggle_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.id == current_user.id:
        return jsonify({"success": False, "message": "You cannot deactivate your own account."}), 400

    user.is_active = not user.is_active
    db.session.commit()

    status = "activated" if user.is_active else "deactivated"
    return jsonify({
        "success": True,
        "isActive": user.is_active,
        "message": f"Account for {user.full_name} has been {status}."
    })

@api_bp.route("/admin/users/<int:user_id>/delete", methods=["POST"])
@api_admin_required
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.id == current_user.id:
        return jsonify({"success": False, "message": "You cannot delete your own account."}), 400

    # Delete all cases linked to this user first
    Case.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()

    return jsonify({"success": True, "message": f"User {user.username} and all their cases have been deleted."})

@api_bp.route("/admin/cases/<int:case_id>/delete", methods=["POST"])
@api_admin_required
def admin_delete_case(case_id):
    case = Case.query.get_or_404(case_id)
    db.session.delete(case)
    db.session.commit()
    return jsonify({"success": True, "message": f"Case {case.case_id} has been deleted."})

@api_bp.route("/admin/suspect-search", methods=["GET"])
@api_admin_required
def admin_suspect_search():
    query_str = request.args.get("name", "").strip()
    if not query_str:
        return jsonify({"results": []})

    norm_query = query_str.lower()
    cases = Case.query.order_by(Case.created_at.desc()).all()
    results = []

    for c in cases:
        try:
            report = c.get_report()
        except Exception:
            continue

        if not report or not isinstance(report, list):
            continue

        for suspect in report:
            if not isinstance(suspect, dict):
                continue

            suspect_name = suspect.get("name", "")
            if norm_query in suspect_name.lower():
                results.append({
                    "suspect_name": suspect_name,
                    "case_db_id": c.id,
                    "case_id": c.case_id,
                    "case_title": c.title or c.case_id,
                    "rank": suspect.get("rank"),
                    "score": suspect.get("final_score", 0.0),
                    "priority": suspect.get("priority", ""),
                    "date": c.formatted_date()
                })

    return jsonify({"results": results})
