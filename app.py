"""
app.py  (project root launcher)
---------------------------------
Alternative entry point — run from the project root:

    python app.py

This adds the backend/ folder to sys.path so all the direct
(bare) imports inside backend/ resolve correctly, then starts
the Flask app defined in backend/app.py.

Preferred method:
    cd backend
    python app.py
"""

import sys
import os

# Add the backend directory to sys.path so all bare imports
# (e.g. `from models import db`) resolve correctly from the root too.
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, BACKEND_DIR)

# Also set cwd to backend so Flask can locate frontend/dist correctly
os.chdir(BACKEND_DIR)

from app import app, create_default_admin  # noqa: E402 (path patched above)

if __name__ == "__main__":
    create_default_admin()
    app.run(debug=True)
