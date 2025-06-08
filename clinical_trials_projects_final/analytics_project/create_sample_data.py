"""
Clinical Trials Sample Data Generator

This script generates synthetic data for clinical trials analysis, including:
1. Patient/Subject data
2. Site performance data
3. Study timeline data

The data is saved to CSV files and also loaded into a SQLite database.
"""

import pandas as pd
import numpy as np
import sqlite3
import os
from datetime import datetime, timedelta

# Set random seed for reproducibility
np.random.seed(42)

# Create output directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Function to generate patient/subject data
def generate_patient_data(num_patients=500):
    """Generate synthetic patient/subject data for clinical trials"""
    
    # Patient IDs
    patient_ids = [f'PT{str(i).zfill(4)}' for i in range(1, num_patients + 1)]
    
    # Study arms (treatment vs placebo)
    study_arms = np.random.choice(['Treatment', 'Placebo'], size=num_patients, p=[0.7, 0.3])
    
    # Demographics
    ages = np.random.normal(45, 15, num_patients).astype(int)
    # Ensure ages are within reasonable range
    ages = np.clip(ages, 18, 85)
    
    genders = np.random.choice(['Male', 'Female'], size=num_patients)
    
    ethnicities = np.random.choice(
        ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other'],
        size=num_patients,
        p=[0.6, 0.15, 0.12, 0.1, 0.03]
    )
    
    # Medical history (1-5 conditions per patient)
    conditions = [
        'Hypertension', 'Diabetes', 'Asthma', 'COPD', 'Depression', 
        'Anxiety', 'Arthritis', 'Obesity', 'Hyperlipidemia', 'None'
    ]
    
    medical_history = []
    for _ in range(num_patients):
        num_conditions = np.random.choice(range(6))  # 0-5 conditions
        if num_conditions == 0:
            medical_history.append('None')
        else:
            patient_conditions = np.random.choice(conditions[:-1], size=num_conditions, replace=False)
            medical_history.append(', '.join(patient_conditions))
    
    # Site assignment
    site_ids = [f'SITE{str(i).zfill(2)}' for i in range(1, 11)]
    assigned_sites = np.random.choice(site_ids, size=num_patients)
    
    # Enrollment dates (within the last year)
    start_date = datetime.now() - timedelta(days=365)
    enrollment_dates = [
        (start_date + timedelta(days=np.random.randint(0, 300))).strftime('%Y-%m-%d')
        for _ in range(num_patients)
    ]
    
    # Completion status
    completion_status = np.random.choice(
        ['Completed', 'Ongoing', 'Withdrawn', 'Lost to Follow-up'],
        size=num_patients,
        p=[0.6, 0.2, 0.15, 0.05]
    )
    
    # Create DataFrame
    patient_df = pd.DataFrame({
        'patient_id': patient_ids,
        'site_id': assigned_sites,
        'study_arm': study_arms,
        'age': ages,
        'gender': genders,
        'ethnicity': ethnicities,
        'medical_history': medical_history,
        'enrollment_date': enrollment_dates,
        'status': completion_status
    })
    
    return patient_df

# Function to generate adverse events data
def generate_adverse_events(patient_df, event_probability=0.4):
    """Generate synthetic adverse events data"""
    
    # List of possible adverse events
    adverse_events = [
        'Headache', 'Nausea', 'Dizziness', 'Fatigue', 'Insomnia', 
        'Rash', 'Diarrhea', 'Vomiting', 'Abdominal Pain', 'Fever',
        'Cough', 'Muscle Pain', 'Joint Pain', 'Allergic Reaction', 'Hypertension'
    ]
    
    # Severity levels
    severity_levels = ['Mild', 'Moderate', 'Severe', 'Life-threatening']
    severity_probs = [0.6, 0.25, 0.1, 0.05]
    
    # Relationship to treatment
    relationships = ['Not Related', 'Unlikely Related', 'Possibly Related', 'Probably Related', 'Definitely Related']
    relationship_probs = [0.2, 0.2, 0.3, 0.2, 0.1]
    
    # Generate adverse events
    ae_data = []
    
    for _, patient in patient_df.iterrows():
        # Patients in treatment arm are more likely to have adverse events
        prob_modifier = 1.2 if patient['study_arm'] == 'Treatment' else 0.8
        
        # Determine if patient has any adverse events
        if np.random.random() < event_probability * prob_modifier:
            # Number of adverse events (1-3)
            num_events = np.random.choice([1, 2, 3], p=[0.7, 0.2, 0.1])
            
            # Generate each adverse event
            for _ in range(num_events):
                event = np.random.choice(adverse_events)
                severity = np.random.choice(severity_levels, p=severity_probs)
                relationship = np.random.choice(relationships, p=relationship_probs)
                
                # Event date (after enrollment date)
                enrollment_date = datetime.strptime(patient['enrollment_date'], '%Y-%m-%d')
                days_after_enrollment = np.random.randint(1, 180)
                event_date = (enrollment_date + timedelta(days=days_after_enrollment)).strftime('%Y-%m-%d')
                
                # Resolution status
                resolution_status = np.random.choice(['Resolved', 'Ongoing'], p=[0.8, 0.2])
                
                ae_data.append({
                    'patient_id': patient['patient_id'],
                    'site_id': patient['site_id'],
                    'adverse_event': event,
                    'severity': severity,
                    'relationship': relationship,
                    'event_date': event_date,
                    'resolution_status': resolution_status
                })
    
    ae_df = pd.DataFrame(ae_data)
    return ae_df

# Function to generate lab results data
def generate_lab_results(patient_df):
    """Generate synthetic laboratory results data"""
    
    # Lab tests
    lab_tests = [
        'Hemoglobin', 'White Blood Cell Count', 'Platelet Count', 
        'ALT', 'AST', 'Creatinine', 'Glucose', 'Potassium', 'Sodium'
    ]
    
    # Reference ranges
    reference_ranges = {
        'Hemoglobin': (12.0, 17.0),  # g/dL
        'White Blood Cell Count': (4.0, 11.0),  # 10^9/L
        'Platelet Count': (150, 450),  # 10^9/L
        'ALT': (7, 55),  # U/L
        'AST': (8, 48),  # U/L
        'Creatinine': (0.6, 1.2),  # mg/dL
        'Glucose': (70, 100),  # mg/dL
        'Potassium': (3.5, 5.0),  # mmol/L
        'Sodium': (135, 145)  # mmol/L
    }
    
    # Units
    units = {
        'Hemoglobin': 'g/dL',
        'White Blood Cell Count': '10^9/L',
        'Platelet Count': '10^9/L',
        'ALT': 'U/L',
        'AST': 'U/L',
        'Creatinine': 'mg/dL',
        'Glucose': 'mg/dL',
        'Potassium': 'mmol/L',
        'Sodium': 'mmol/L'
    }
    
    # Generate lab results
    lab_data = []
    
    for _, patient in patient_df.iterrows():
        # Each patient has 1-3 lab visits
        num_visits = np.random.randint(1, 4)
        
        enrollment_date = datetime.strptime(patient['enrollment_date'], '%Y-%m-%d')
        
        for visit in range(num_visits):
            # Visit date
            visit_date = (enrollment_date + timedelta(days=30 * visit)).strftime('%Y-%m-%d')
            
            # Generate results for each lab test
            for test in lab_tests:
                # Get reference range
                low_ref, high_ref = reference_ranges[test]
                
                # Generate value (mostly within range, sometimes out of range)
                if np.random.random() < 0.9:  # 90% within range
                    value = np.random.uniform(low_ref, high_ref)
                else:  # 10% out of range
                    if np.random.random() < 0.5:
                        value = np.random.uniform(low_ref - (high_ref - low_ref) * 0.5, low_ref)
                    else:
                        value = np.random.uniform(high_ref, high_ref + (high_ref - low_ref) * 0.5)
                
                # Round to appropriate decimal places
                if test in ['Hemoglobin', 'White Blood Cell Count', 'Creatinine', 'Potassium']:
                    value = round(value, 1)
                elif test in ['Glucose', 'Sodium', 'ALT', 'AST', 'Platelet Count']:
                    value = round(value)
                
                # Determine if result is normal
                normal_flag = 'Normal' if low_ref <= value <= high_ref else 'Abnormal'
                
                lab_data.append({
                    'patient_id': patient['patient_id'],
                    'site_id': patient['site_id'],
                    'visit_date': visit_date,
                    'test_name': test,
                    'result_value': value,
                    'unit': units[test],
                    'reference_low': low_ref,
                    'reference_high': high_ref,
                    'normal_flag': normal_flag
                })
    
    lab_df = pd.DataFrame(lab_data)
    return lab_df

# Function to generate site performance data
def generate_site_performance():
    """Generate synthetic site performance data"""
    
    # Site IDs
    site_ids = [f'SITE{str(i).zfill(2)}' for i in range(1, 11)]
    
    # Site locations
    countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'Brazil', 'India', 'China']
    
    # Site characteristics
    site_types = ['Academic', 'Hospital', 'Private Practice', 'Research Center']
    site_types_assigned = np.random.choice(site_types, size=10)
    
    # Experience levels
    experience_levels = ['High', 'Medium', 'Low']
    experience_assigned = np.random.choice(experience_levels, size=10, p=[0.3, 0.5, 0.2])
    
    # Enrollment targets
    enrollment_targets = np.random.randint(30, 100, size=10)
    
    # Actual enrollment
    actual_enrollment = []
    for target in enrollment_targets:
        # Actual enrollment is based on target with some variation
        actual = int(target * np.random.uniform(0.5, 1.2))
        actual_enrollment.append(actual)
    
    # Enrollment rates (patients per month)
    enrollment_rates = np.random.uniform(1, 5, size=10).round(1)
    
    # Retention rates (percentage)
    retention_rates = np.random.uniform(75, 98, size=10).round(1)
    
    # Protocol deviation counts
    protocol_deviations = np.random.randint(0, 20, size=10)
    
    # Data query counts
    data_queries = np.random.randint(5, 50, size=10)
    
    # Query resolution times (days)
    query_resolution_times = np.random.uniform(1, 10, size=10).round(1)
    
    # Create DataFrame
    site_df = pd.DataFrame({
        'site_id': site_ids,
        'country': countries,
        'site_type': site_types_assigned,
        'experience_level': experience_assigned,
        'enrollment_target': enrollment_targets,
        'actual_enrollment': actual_enrollment,
        'enrollment_rate': enrollment_rates,
        'retention_rate': retention_rates,
        'protocol_deviations': protocol_deviations,
        'data_queries': data_queries,
        'query_resolution_time': query_resolution_times
    })
    
    return site_df

# Function to generate study timeline data
def generate_study_timeline():
    """Generate synthetic study timeline data"""
    
    # Study phases
    phases = [
        'Protocol Development', 'Site Selection', 'Site Initiation',
        'First Patient In', 'Enrollment Period', 'Treatment Period',
        'Last Patient Last Visit', 'Database Lock', 'Final Report'
    ]
    
    # Start date (2 years ago)
    start_date = datetime.now() - timedelta(days=730)
    
    # Generate timeline data
    timeline_data = []
    current_date = start_date
    
    for i, phase in enumerate(phases):
        # Phase duration (days)
        if phase == 'Enrollment Period':
            duration = np.random.randint(180, 365)
        elif phase == 'Treatment Period':
            duration = np.random.randint(180, 365)
        else:
            duration = np.random.randint(14, 90)
        
        # Planned dates
        planned_start = current_date
        planned_end = planned_start + timedelta(days=duration)
        
        # Actual dates (with some variation)
        if np.random.random() < 0.7:  # 70% chance of delay
            delay = np.random.randint(0, 30)
            actual_start = planned_start + timedelta(days=delay)
            
            # Actual duration might be different from planned
            actual_duration = int(duration * np.random.uniform(0.9, 1.2))
            actual_end = actual_start + timedelta(days=actual_duration)
        else:
            actual_start = planned_start
            actual_end = planned_end
        
        # For future phases, set actual dates to None
        if actual_end > datetime.now():
            if actual_start > datetime.now():
                actual_start_str = None
                actual_end_str = None
                status = 'Planned'
            else:
                actual_start_str = actual_start.strftime('%Y-%m-%d')
                actual_end_str = None
                status = 'In Progress'
        else:
            actual_start_str = actual_start.strftime('%Y-%m-%d')
            actual_end_str = actual_end.strftime('%Y-%m-%d')
            status = 'Completed'
        
        timeline_data.append({
            'phase': phase,
            'planned_start_date': planned_start.strftime('%Y-%m-%d'),
            'planned_end_date': planned_end.strftime('%Y-%m-%d'),
            'actual_start_date': actual_start_str,
            'actual_end_date': actual_end_str,
            'status': status
        })
        
        # Update current date for next phase
        current_date = planned_end
    
    timeline_df = pd.DataFrame(timeline_data)
    return timeline_df

# Generate all datasets
print("Generating patient data...")
patient_df = generate_patient_data(500)

print("Generating adverse events data...")
adverse_events_df = generate_adverse_events(patient_df)

print("Generating lab results data...")
lab_results_df = generate_lab_results(patient_df)

print("Generating site performance data...")
site_performance_df = generate_site_performance()

print("Generating study timeline data...")
study_timeline_df = generate_study_timeline()

# Save to CSV files
print("Saving data to CSV files...")
patient_df.to_csv('data/patients.csv', index=False)
adverse_events_df.to_csv('data/adverse_events.csv', index=False)
lab_results_df.to_csv('data/lab_results.csv', index=False)
site_performance_df.to_csv('data/site_performance.csv', index=False)
study_timeline_df.to_csv('data/study_timeline.csv', index=False)

# Create SQLite database
print("Creating SQLite database...")
conn = sqlite3.connect('data/clinical_trials.db')

# Save to SQLite database
patient_df.to_sql('patients', conn, if_exists='replace', index=False)
adverse_events_df.to_sql('adverse_events', conn, if_exists='replace', index=False)
lab_results_df.to_sql('lab_results', conn, if_exists='replace', index=False)
site_performance_df.to_sql('site_performance', conn, if_exists='replace', index=False)
study_timeline_df.to_sql('study_timeline', conn, if_exists='replace', index=False)

# Close connection
conn.close()

print("Data generation complete!")
