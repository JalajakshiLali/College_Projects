"""
API routes for the Clinical Trials Dashboard
"""

from flask import Blueprint, jsonify, request
import sqlite3
import pandas as pd
import os

api_bp = Blueprint('api', __name__)

# Database connection - Use absolute path instead of relative path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../analytics_project/data/clinical_trials.db'))

def get_db_connection():
    """Create a connection to the SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}, Path: {DB_PATH}, Exists: {os.path.exists(DB_PATH)}")
        return None

@api_bp.route('/summary', methods=['GET'])
def get_summary():
    """Get overall study summary statistics"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get patient counts
    patient_query = """
    SELECT 
        COUNT(*) as total_patients,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn,
        SUM(CASE WHEN status = 'Lost to Follow-up' THEN 1 ELSE 0 END) as lost_to_followup,
        SUM(CASE WHEN study_arm = 'Treatment' THEN 1 ELSE 0 END) as treatment_arm,
        SUM(CASE WHEN study_arm = 'Placebo' THEN 1 ELSE 0 END) as placebo_arm
    FROM patients
    """
    patient_stats = conn.execute(patient_query).fetchone()
    
    # Get site counts
    site_query = "SELECT COUNT(DISTINCT site_id) as total_sites FROM site_performance"
    site_stats = conn.execute(site_query).fetchone()
    
    # Get adverse event counts
    ae_query = "SELECT COUNT(*) as total_ae FROM adverse_events"
    ae_stats = conn.execute(ae_query).fetchone()
    
    # Get lab test counts
    lab_query = "SELECT COUNT(*) as total_labs FROM lab_results"
    lab_stats = conn.execute(lab_query).fetchone()
    
    conn.close()
    
    return jsonify({
        'patients': {
            'total': patient_stats['total_patients'],
            'completed': patient_stats['completed'],
            'ongoing': patient_stats['ongoing'],
            'withdrawn': patient_stats['withdrawn'],
            'lost_to_followup': patient_stats['lost_to_followup'],
            'treatment_arm': patient_stats['treatment_arm'],
            'placebo_arm': patient_stats['placebo_arm']
        },
        'sites': {
            'total': site_stats['total_sites']
        },
        'adverse_events': {
            'total': ae_stats['total_ae']
        },
        'lab_tests': {
            'total': lab_stats['total_labs']
        }
    })

@api_bp.route('/enrollment', methods=['GET'])
def get_enrollment():
    """Get enrollment data by site"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get enrollment by site
    enrollment_query = """
    SELECT 
        s.site_id,
        s.country,
        s.site_type,
        s.enrollment_target,
        s.actual_enrollment,
        s.enrollment_rate,
        s.retention_rate,
        COUNT(p.patient_id) as current_patients
    FROM site_performance s
    LEFT JOIN patients p ON s.site_id = p.site_id
    GROUP BY s.site_id
    """
    
    enrollment_data = []
    for row in conn.execute(enrollment_query):
        enrollment_data.append({
            'site_id': row['site_id'],
            'country': row['country'],
            'site_type': row['site_type'],
            'enrollment_target': row['enrollment_target'],
            'actual_enrollment': row['actual_enrollment'],
            'enrollment_rate': row['enrollment_rate'],
            'retention_rate': row['retention_rate'],
            'current_patients': row['current_patients']
        })
    
    # Get enrollment over time (simulated based on enrollment date)
    enrollment_time_query = """
    SELECT 
        enrollment_date,
        COUNT(*) as patients_enrolled
    FROM patients
    GROUP BY enrollment_date
    ORDER BY enrollment_date
    """
    
    enrollment_time_data = []
    cumulative_count = 0
    for row in conn.execute(enrollment_time_query):
        cumulative_count += row['patients_enrolled']
        enrollment_time_data.append({
            'date': row['enrollment_date'],
            'patients_enrolled': row['patients_enrolled'],
            'cumulative_enrolled': cumulative_count
        })
    
    conn.close()
    
    return jsonify({
        'by_site': enrollment_data,
        'over_time': enrollment_time_data
    })

@api_bp.route('/retention', methods=['GET'])
def get_retention():
    """Get patient retention data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get retention by site
    retention_query = """
    SELECT 
        site_id,
        COUNT(*) as total_patients,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn,
        SUM(CASE WHEN status = 'Lost to Follow-up' THEN 1 ELSE 0 END) as lost_to_followup
    FROM patients
    GROUP BY site_id
    """
    
    retention_data = []
    for row in conn.execute(retention_query):
        total = row['total_patients']
        retention_data.append({
            'site_id': row['site_id'],
            'total_patients': total,
            'completed': row['completed'],
            'ongoing': row['ongoing'],
            'withdrawn': row['withdrawn'],
            'lost_to_followup': row['lost_to_followup'],
            'completion_rate': row['completed'] / total if total > 0 else 0,
            'dropout_rate': (row['withdrawn'] + row['lost_to_followup']) / total if total > 0 else 0
        })
    
    conn.close()
    
    return jsonify(retention_data)

@api_bp.route('/timeline', methods=['GET'])
def get_timeline():
    """Get study timeline data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    timeline_query = "SELECT * FROM study_timeline"
    timeline_data = []
    
    for row in conn.execute(timeline_query):
        timeline_data.append({
            'phase': row['phase'],
            'planned_start_date': row['planned_start_date'],
            'planned_end_date': row['planned_end_date'],
            'actual_start_date': row['actual_start_date'],
            'actual_end_date': row['actual_end_date'],
            'status': row['status']
        })
    
    conn.close()
    
    return jsonify(timeline_data)

@api_bp.route('/adverse_events', methods=['GET'])
def get_adverse_events():
    """Get adverse event data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get adverse events by type
    ae_type_query = """
    SELECT 
        adverse_event,
        COUNT(*) as count
    FROM adverse_events
    GROUP BY adverse_event
    ORDER BY count DESC
    """
    
    ae_type_data = []
    for row in conn.execute(ae_type_query):
        ae_type_data.append({
            'adverse_event': row['adverse_event'],
            'count': row['count']
        })
    
    # Get adverse events by severity
    ae_severity_query = """
    SELECT 
        severity,
        COUNT(*) as count
    FROM adverse_events
    GROUP BY severity
    ORDER BY 
        CASE 
            WHEN severity = 'Mild' THEN 1
            WHEN severity = 'Moderate' THEN 2
            WHEN severity = 'Severe' THEN 3
            WHEN severity = 'Life-threatening' THEN 4
        END
    """
    
    ae_severity_data = []
    for row in conn.execute(ae_severity_query):
        ae_severity_data.append({
            'severity': row['severity'],
            'count': row['count']
        })
    
    # Get adverse events by site
    ae_site_query = """
    SELECT 
        site_id,
        COUNT(*) as count
    FROM adverse_events
    GROUP BY site_id
    ORDER BY count DESC
    """
    
    ae_site_data = []
    for row in conn.execute(ae_site_query):
        ae_site_data.append({
            'site_id': row['site_id'],
            'count': row['count']
        })
    
    # Get adverse events by relationship to treatment
    ae_relationship_query = """
    SELECT 
        relationship,
        COUNT(*) as count
    FROM adverse_events
    GROUP BY relationship
    """
    
    ae_relationship_data = []
    for row in conn.execute(ae_relationship_query):
        ae_relationship_data.append({
            'relationship': row['relationship'],
            'count': row['count']
        })
    
    conn.close()
    
    return jsonify({
        'by_type': ae_type_data,
        'by_severity': ae_severity_data,
        'by_site': ae_site_data,
        'by_relationship': ae_relationship_data
    })

@api_bp.route('/lab_results', methods=['GET'])
def get_lab_results():
    """Get lab results data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get abnormal lab results by test
    lab_abnormal_query = """
    SELECT 
        test_name,
        COUNT(*) as total,
        SUM(CASE WHEN normal_flag = 'Abnormal' THEN 1 ELSE 0 END) as abnormal_count
    FROM lab_results
    GROUP BY test_name
    """
    
    lab_abnormal_data = []
    for row in conn.execute(lab_abnormal_query):
        lab_abnormal_data.append({
            'test_name': row['test_name'],
            'total': row['total'],
            'abnormal_count': row['abnormal_count'],
            'abnormal_rate': row['abnormal_count'] / row['total'] if row['total'] > 0 else 0
        })
    
    conn.close()
    
    return jsonify(lab_abnormal_data)

@api_bp.route('/site_performance', methods=['GET'])
def get_site_performance():
    """Get site performance data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    site_query = "SELECT * FROM site_performance"
    site_data = []
    
    for row in conn.execute(site_query):
        site_data.append({
            'site_id': row['site_id'],
            'country': row['country'],
            'site_type': row['site_type'],
            'experience_level': row['experience_level'],
            'enrollment_target': row['enrollment_target'],
            'actual_enrollment': row['actual_enrollment'],
            'enrollment_rate': row['enrollment_rate'],
            'retention_rate': row['retention_rate'],
            'protocol_deviations': row['protocol_deviations'],
            'data_queries': row['data_queries'],
            'query_resolution_time': row['query_resolution_time']
        })
    
    conn.close()
    
    return jsonify(site_data)

@api_bp.route('/patient_demographics', methods=['GET'])
def get_patient_demographics():
    """Get patient demographic data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Get age distribution
    age_query = """
    SELECT 
        CASE
            WHEN age < 20 THEN '< 20'
            WHEN age BETWEEN 20 AND 29 THEN '20-29'
            WHEN age BETWEEN 30 AND 39 THEN '30-39'
            WHEN age BETWEEN 40 AND 49 THEN '40-49'
            WHEN age BETWEEN 50 AND 59 THEN '50-59'
            WHEN age BETWEEN 60 AND 69 THEN '60-69'
            WHEN age BETWEEN 70 AND 79 THEN '70-79'
            ELSE '80+'
        END as age_group,
        COUNT(*) as count
    FROM patients
    GROUP BY age_group
    ORDER BY 
        CASE
            WHEN age_group = '< 20' THEN 1
            WHEN age_group = '20-29' THEN 2
            WHEN age_group = '30-39' THEN 3
            WHEN age_group = '40-49' THEN 4
            WHEN age_group = '50-59' THEN 5
            WHEN age_group = '60-69' THEN 6
            WHEN age_group = '70-79' THEN 7
            ELSE 8
        END
    """
    
    age_data = []
    for row in conn.execute(age_query):
        age_data.append({
            'age_group': row['age_group'],
            'count': row['count']
        })
    
    # Get gender distribution
    gender_query = """
    SELECT 
        gender,
        COUNT(*) as count
    FROM patients
    GROUP BY gender
    """
    
    gender_data = []
    for row in conn.execute(gender_query):
        gender_data.append({
            'gender': row['gender'],
            'count': row['count']
        })
    
    # Get ethnicity distribution
    ethnicity_query = """
    SELECT 
        ethnicity,
        COUNT(*) as count
    FROM patients
    GROUP BY ethnicity
    """
    
    ethnicity_data = []
    for row in conn.execute(ethnicity_query):
        ethnicity_data.append({
            'ethnicity': row['ethnicity'],
            'count': row['count']
        })
    
    conn.close()
    
    return jsonify({
        'age': age_data,
        'gender': gender_data,
        'ethnicity': ethnicity_data
    })

@api_bp.route('/predictive_insights', methods=['GET'])
def get_predictive_insights():
    """Get insights from predictive models"""
    # This would normally load the trained models and make predictions
    # For this demo, we'll return simulated insights
    
    return jsonify({
        'dropout_risk': {
            'high_risk_count': 45,
            'medium_risk_count': 120,
            'low_risk_count': 335,
            'high_risk_sites': ['SITE03', 'SITE07', 'SITE09']
        },
        'adverse_event_risk': {
            'high_risk_count': 38,
            'medium_risk_count': 95,
            'low_risk_count': 367
        },
        'site_performance_prediction': {
            'top_performers': ['SITE01', 'SITE04', 'SITE08'],
            'underperformers': ['SITE03', 'SITE07', 'SITE10']
        },
        'timeline_prediction': {
            'estimated_completion_date': '2026-03-15',
            'delay_risk': 'Medium',
            'critical_phases': ['Enrollment Period', 'Database Lock']
        }
    })
