"""
Clinical Trials Dashboard - Main Application

This is the main entry point for the Flask application that serves
the Clinical Trials Dashboard.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # DON'T CHANGE THIS !!!

from flask import Flask, jsonify, request, render_template, send_from_directory
import sqlite3
import pandas as pd
import json

app = Flask(__name__)

# Database connection - Fix the relative path issue
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../analytics_project/data/clinical_trials.db'))

def get_db_connection():
    """Create a connection to the SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        app.logger.error(f"Database connection error: {e}")
        return None

# Import routes
from src.routes.api import api_bp

# Register blueprints
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    """Render the main dashboard page"""
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

# Add a route to check database connectivity
@app.route('/api/check-db')
def check_db():
    """Check database connectivity and return status"""
    try:
        conn = get_db_connection()
        if conn:
            conn.execute("SELECT 1").fetchone()
            conn.close()
            return jsonify({"status": "connected", "path": DB_PATH, "exists": os.path.exists(DB_PATH)})
        else:
            return jsonify({"status": "connection_failed", "path": DB_PATH, "exists": os.path.exists(DB_PATH)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "path": DB_PATH, "exists": os.path.exists(DB_PATH)})

if __name__ == '__main__':
    # Print database path for debugging
    print(f"Database path: {DB_PATH}")
    print(f"Database exists: {os.path.exists(DB_PATH)}")
    
    # Disabled debug mode and use_reloader to prevent looping issues
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
