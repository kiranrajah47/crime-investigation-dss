# Crime Investigation Decision Support System (DSS)

An AI-driven Crime Investigation Decision Support System that assists investigators in analyzing victim statements, evidence documents, and suspect profiles to generate weighted relevance scores, rankings, and transparent explanations.

## Configuration & Environment Variables

### Secret Key Configuration
For security reasons, the Flask application uses the `FLASK_SECRET_KEY` environment variable to sign session cookies and cryptographic tokens.

- **Local Development**: If `FLASK_SECRET_KEY` is not set, the app falls back to a default development key.
- **Production Deployment**: You **must** set `FLASK_SECRET_KEY` as an environment variable in production to ensure secure session management.

Refer to `.env.example` for setting up your environment configuration:
```bash
FLASK_SECRET_KEY=your-secure-random-secret-key
```

## Running the Application

### Backend
```bash
cd backend
python app.py
```
The Flask backend will run on `http://127.0.0.1:5000`.
