"""
Clinical Trials Descriptive Analytics

This script performs descriptive analytics on the clinical trial data, including:
1. Patient demographics analysis
2. Adverse events analysis
3. Lab results analysis
4. Site performance analysis
5. Study timeline analysis

The results are saved as visualizations and summary tables.
"""

import pandas as pd
import numpy as np
import sqlite3
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os

# Set style for plots
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette('viridis')

# Create output directories
os.makedirs('outputs/figures', exist_ok=True)
os.makedirs('outputs/tables', exist_ok=True)

# Connect to the database
conn = sqlite3.connect('data/clinical_trials.db')

# Load data
patients_df = pd.read_sql("SELECT * FROM patients", conn)
adverse_events_df = pd.read_sql("SELECT * FROM adverse_events", conn)
lab_results_df = pd.read_sql("SELECT * FROM lab_results", conn)
site_performance_df = pd.read_sql("SELECT * FROM site_performance", conn)
study_timeline_df = pd.read_sql("SELECT * FROM study_timeline", conn)

# Close connection
conn.close()

# 1. Patient Demographics Analysis
print("Performing patient demographics analysis...")

# Age distribution
plt.figure(figsize=(10, 6))
sns.histplot(patients_df['age'], bins=20, kde=True)
plt.title('Age Distribution of Trial Participants', fontsize=16)
plt.xlabel('Age', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/age_distribution.png', dpi=300)
plt.close()

# Gender distribution
plt.figure(figsize=(8, 6))
gender_counts = patients_df['gender'].value_counts()
plt.pie(gender_counts, labels=gender_counts.index, autopct='%1.1f%%', startangle=90)
plt.title('Gender Distribution', fontsize=16)
plt.axis('equal')
plt.tight_layout()
plt.savefig('outputs/figures/gender_distribution.png', dpi=300)
plt.close()

# Ethnicity distribution
plt.figure(figsize=(12, 6))
ethnicity_counts = patients_df['ethnicity'].value_counts()
sns.barplot(x=ethnicity_counts.index, y=ethnicity_counts.values)
plt.title('Ethnicity Distribution', fontsize=16)
plt.xlabel('Ethnicity', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/ethnicity_distribution.png', dpi=300)
plt.close()

# Study arm distribution
plt.figure(figsize=(8, 6))
arm_counts = patients_df['study_arm'].value_counts()
plt.pie(arm_counts, labels=arm_counts.index, autopct='%1.1f%%', startangle=90)
plt.title('Study Arm Distribution', fontsize=16)
plt.axis('equal')
plt.tight_layout()
plt.savefig('outputs/figures/study_arm_distribution.png', dpi=300)
plt.close()

# Completion status
plt.figure(figsize=(10, 6))
status_counts = patients_df['status'].value_counts()
sns.barplot(x=status_counts.index, y=status_counts.values)
plt.title('Patient Completion Status', fontsize=16)
plt.xlabel('Status', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/completion_status.png', dpi=300)
plt.close()

# Medical history analysis
# Extract and count medical conditions
all_conditions = []
for history in patients_df['medical_history']:
    if history != 'None':
        conditions = [c.strip() for c in history.split(',')]
        all_conditions.extend(conditions)

condition_counts = pd.Series(all_conditions).value_counts()

plt.figure(figsize=(12, 6))
sns.barplot(x=condition_counts.index, y=condition_counts.values)
plt.title('Medical History Distribution', fontsize=16)
plt.xlabel('Condition', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/medical_history.png', dpi=300)
plt.close()

# Demographics summary table
demographics_summary = pd.DataFrame({
    'Metric': ['Total Patients', 'Average Age', 'Age Range', 'Male Count', 'Female Count', 
               'Treatment Arm', 'Placebo Arm', 'Completed', 'Ongoing', 'Withdrawn', 'Lost to Follow-up'],
    'Value': [
        len(patients_df),
        f"{patients_df['age'].mean():.1f} years",
        f"{patients_df['age'].min()} - {patients_df['age'].max()} years",
        len(patients_df[patients_df['gender'] == 'Male']),
        len(patients_df[patients_df['gender'] == 'Female']),
        len(patients_df[patients_df['study_arm'] == 'Treatment']),
        len(patients_df[patients_df['study_arm'] == 'Placebo']),
        len(patients_df[patients_df['status'] == 'Completed']),
        len(patients_df[patients_df['status'] == 'Ongoing']),
        len(patients_df[patients_df['status'] == 'Withdrawn']),
        len(patients_df[patients_df['status'] == 'Lost to Follow-up'])
    ]
})

demographics_summary.to_csv('outputs/tables/demographics_summary.csv', index=False)

# 2. Adverse Events Analysis
print("Performing adverse events analysis...")

# Count of adverse events by type
ae_counts = adverse_events_df['adverse_event'].value_counts().reset_index()
ae_counts.columns = ['Adverse Event', 'Count']

plt.figure(figsize=(12, 8))
sns.barplot(x='Count', y='Adverse Event', data=ae_counts.head(10))
plt.title('Top 10 Adverse Events', fontsize=16)
plt.xlabel('Count', fontsize=14)
plt.ylabel('Adverse Event', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/top_adverse_events.png', dpi=300)
plt.close()

# Adverse events by severity
severity_counts = adverse_events_df['severity'].value_counts().reset_index()
severity_counts.columns = ['Severity', 'Count']

plt.figure(figsize=(10, 6))
sns.barplot(x='Severity', y='Count', data=severity_counts)
plt.title('Adverse Events by Severity', fontsize=16)
plt.xlabel('Severity', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/adverse_events_severity.png', dpi=300)
plt.close()

# Adverse events by relationship to treatment
relationship_counts = adverse_events_df['relationship'].value_counts().reset_index()
relationship_counts.columns = ['Relationship', 'Count']

plt.figure(figsize=(12, 6))
sns.barplot(x='Relationship', y='Count', data=relationship_counts)
plt.title('Adverse Events by Relationship to Treatment', fontsize=16)
plt.xlabel('Relationship', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/adverse_events_relationship.png', dpi=300)
plt.close()

# Compare adverse events between treatment arms
# First, merge with patient data to get study arm
ae_with_arm = pd.merge(
    adverse_events_df,
    patients_df[['patient_id', 'study_arm']],
    on='patient_id'
)

# Count adverse events by study arm and event type
ae_by_arm = ae_with_arm.groupby(['study_arm', 'adverse_event']).size().reset_index()
ae_by_arm.columns = ['Study Arm', 'Adverse Event', 'Count']

# Get top 5 adverse events
top_events = ae_counts['Adverse Event'].head(5).tolist()
ae_by_arm_filtered = ae_by_arm[ae_by_arm['Adverse Event'].isin(top_events)]

plt.figure(figsize=(12, 8))
sns.barplot(x='Adverse Event', y='Count', hue='Study Arm', data=ae_by_arm_filtered)
plt.title('Top 5 Adverse Events by Study Arm', fontsize=16)
plt.xlabel('Adverse Event', fontsize=14)
plt.ylabel('Count', fontsize=14)
plt.xticks(rotation=45)
plt.legend(title='Study Arm')
plt.tight_layout()
plt.savefig('outputs/figures/adverse_events_by_arm.png', dpi=300)
plt.close()

# Adverse events summary table
ae_summary = pd.DataFrame({
    'Metric': ['Total Adverse Events', 'Patients with Adverse Events', 'Most Common Adverse Event',
               'Severe or Life-threatening Events', 'Definitely Related to Treatment'],
    'Value': [
        len(adverse_events_df),
        len(adverse_events_df['patient_id'].unique()),
        ae_counts.iloc[0]['Adverse Event'],
        len(adverse_events_df[adverse_events_df['severity'].isin(['Severe', 'Life-threatening'])]),
        len(adverse_events_df[adverse_events_df['relationship'] == 'Definitely Related'])
    ]
})

ae_summary.to_csv('outputs/tables/adverse_events_summary.csv', index=False)

# 3. Lab Results Analysis
print("Performing lab results analysis...")

# Abnormal lab results by test
abnormal_labs = lab_results_df[lab_results_df['normal_flag'] == 'Abnormal']
abnormal_counts = abnormal_labs['test_name'].value_counts().reset_index()
abnormal_counts.columns = ['Test Name', 'Abnormal Count']

# Total counts by test
total_counts = lab_results_df['test_name'].value_counts().reset_index()
total_counts.columns = ['Test Name', 'Total Count']

# Merge to calculate percentages
lab_abnormal_rates = pd.merge(abnormal_counts, total_counts, on='Test Name')
lab_abnormal_rates['Abnormal Rate'] = lab_abnormal_rates['Abnormal Count'] / lab_abnormal_rates['Total Count'] * 100

plt.figure(figsize=(12, 6))
sns.barplot(x='Test Name', y='Abnormal Rate', data=lab_abnormal_rates)
plt.title('Abnormal Lab Result Rates by Test', fontsize=16)
plt.xlabel('Test Name', fontsize=14)
plt.ylabel('Abnormal Rate (%)', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/abnormal_lab_rates.png', dpi=300)
plt.close()

# Lab results by study arm
# First, merge with patient data to get study arm
lab_with_arm = pd.merge(
    lab_results_df,
    patients_df[['patient_id', 'study_arm']],
    on='patient_id'
)

# Compare abnormal rates between treatment arms
abnormal_by_arm = lab_with_arm.groupby(['study_arm', 'test_name', 'normal_flag']).size().reset_index()
abnormal_by_arm.columns = ['Study Arm', 'Test Name', 'Normal Flag', 'Count']

# Calculate abnormal rates for each test by study arm
abnormal_rates = []
for arm in ['Treatment', 'Placebo']:
    for test in lab_results_df['test_name'].unique():
        arm_test_data = abnormal_by_arm[(abnormal_by_arm['Study Arm'] == arm) & 
                                        (abnormal_by_arm['Test Name'] == test)]
        
        if len(arm_test_data) > 0:
            total = arm_test_data['Count'].sum()
            abnormal = arm_test_data[arm_test_data['Normal Flag'] == 'Abnormal']['Count'].sum() if 'Abnormal' in arm_test_data['Normal Flag'].values else 0
            rate = (abnormal / total) * 100 if total > 0 else 0
            
            abnormal_rates.append({
                'Study Arm': arm,
                'Test Name': test,
                'Abnormal Rate': rate
            })

abnormal_rates_df = pd.DataFrame(abnormal_rates)

# Plot for a few selected tests
selected_tests = ['Hemoglobin', 'ALT', 'Glucose', 'Creatinine']
selected_rates = abnormal_rates_df[abnormal_rates_df['Test Name'].isin(selected_tests)]

plt.figure(figsize=(12, 6))
sns.barplot(x='Test Name', y='Abnormal Rate', hue='Study Arm', data=selected_rates)
plt.title('Abnormal Lab Result Rates by Study Arm', fontsize=16)
plt.xlabel('Test Name', fontsize=14)
plt.ylabel('Abnormal Rate (%)', fontsize=14)
plt.legend(title='Study Arm')
plt.tight_layout()
plt.savefig('outputs/figures/abnormal_labs_by_arm.png', dpi=300)
plt.close()

# Lab results summary table
lab_summary = pd.DataFrame({
    'Metric': ['Total Lab Tests', 'Abnormal Results', 'Abnormal Rate', 
               'Test with Highest Abnormal Rate', 'Test with Lowest Abnormal Rate'],
    'Value': [
        len(lab_results_df),
        len(lab_results_df[lab_results_df['normal_flag'] == 'Abnormal']),
        f"{len(lab_results_df[lab_results_df['normal_flag'] == 'Abnormal']) / len(lab_results_df) * 100:.1f}%",
        f"{lab_abnormal_rates.iloc[lab_abnormal_rates['Abnormal Rate'].argmax()]['Test Name']} ({lab_abnormal_rates['Abnormal Rate'].max():.1f}%)",
        f"{lab_abnormal_rates.iloc[lab_abnormal_rates['Abnormal Rate'].argmin()]['Test Name']} ({lab_abnormal_rates['Abnormal Rate'].min():.1f}%)"
    ]
})

lab_summary.to_csv('outputs/tables/lab_results_summary.csv', index=False)

# 4. Site Performance Analysis
print("Performing site performance analysis...")

# Enrollment performance by site
plt.figure(figsize=(12, 6))
site_performance_df['enrollment_percentage'] = (site_performance_df['actual_enrollment'] / site_performance_df['enrollment_target']) * 100
site_performance_df = site_performance_df.sort_values('enrollment_percentage', ascending=False)

sns.barplot(x='site_id', y='enrollment_percentage', data=site_performance_df)
plt.axhline(y=100, color='r', linestyle='--')
plt.title('Enrollment Performance by Site', fontsize=16)
plt.xlabel('Site ID', fontsize=14)
plt.ylabel('Enrollment Percentage (%)', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/enrollment_performance.png', dpi=300)
plt.close()

# Enrollment rate by site type
plt.figure(figsize=(10, 6))
sns.boxplot(x='site_type', y='enrollment_rate', data=site_performance_df)
plt.title('Enrollment Rate by Site Type', fontsize=16)
plt.xlabel('Site Type', fontsize=14)
plt.ylabel('Enrollment Rate (patients/month)', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/enrollment_rate_by_site_type.png', dpi=300)
plt.close()

# Retention rate by site
plt.figure(figsize=(12, 6))
site_performance_df = site_performance_df.sort_values('retention_rate', ascending=False)
sns.barplot(x='site_id', y='retention_rate', data=site_performance_df)
plt.title('Retention Rate by Site', fontsize=16)
plt.xlabel('Site ID', fontsize=14)
plt.ylabel('Retention Rate (%)', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/retention_rate.png', dpi=300)
plt.close()

# Protocol deviations by site
plt.figure(figsize=(12, 6))
site_performance_df['deviation_rate'] = site_performance_df['protocol_deviations'] / site_performance_df['actual_enrollment']
site_performance_df = site_performance_df.sort_values('deviation_rate', ascending=False)
sns.barplot(x='site_id', y='deviation_rate', data=site_performance_df)
plt.title('Protocol Deviation Rate by Site', fontsize=16)
plt.xlabel('Site ID', fontsize=14)
plt.ylabel('Deviations per Patient', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/protocol_deviations.png', dpi=300)
plt.close()

# Query resolution time by site
plt.figure(figsize=(12, 6))
site_performance_df = site_performance_df.sort_values('query_resolution_time')
sns.barplot(x='site_id', y='query_resolution_time', data=site_performance_df)
plt.title('Query Resolution Time by Site', fontsize=16)
plt.xlabel('Site ID', fontsize=14)
plt.ylabel('Average Resolution Time (days)', fontsize=14)
plt.tight_layout()
plt.savefig('outputs/figures/query_resolution_time.png', dpi=300)
plt.close()

# Site performance by experience level
metrics = ['enrollment_rate', 'retention_rate', 'deviation_rate', 'query_resolution_time']
fig, axes = plt.subplots(2, 2, figsize=(16, 12))
axes = axes.flatten()

for i, metric in enumerate(metrics):
    sns.boxplot(x='experience_level', y=metric, data=site_performance_df, ax=axes[i])
    axes[i].set_title(f'{metric.replace("_", " ").title()} by Experience Level', fontsize=14)
    axes[i].set_xlabel('Experience Level', fontsize=12)
    axes[i].set_ylabel(metric.replace('_', ' ').title(), fontsize=12)

plt.tight_layout()
plt.savefig('outputs/figures/performance_by_experience.png', dpi=300)
plt.close()

# Site performance summary table
site_summary = pd.DataFrame({
    'Metric': ['Total Sites', 'Average Enrollment Rate', 'Average Retention Rate',
               'Total Protocol Deviations', 'Average Query Resolution Time',
               'Best Performing Site (Enrollment)', 'Best Performing Site (Retention)'],
    'Value': [
        len(site_performance_df),
        f"{site_performance_df['enrollment_rate'].mean():.1f} patients/month",
        f"{site_performance_df['retention_rate'].mean():.1f}%",
        site_performance_df['protocol_deviations'].sum(),
        f"{site_performance_df['query_resolution_time'].mean():.1f} days",
        site_performance_df.iloc[site_performance_df['enrollment_percentage'].argmax()]['site_id'],
        site_performance_df.iloc[site_performance_df['retention_rate'].argmax()]['site_id']
    ]
})

site_summary.to_csv('outputs/tables/site_performance_summary.csv', index=False)

# 5. Study Timeline Analysis
print("Performing study timeline analysis...")

# Convert date strings to datetime objects
for col in ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date']:
    study_timeline_df[col] = pd.to_datetime(study_timeline_df[col], errors='coerce')

# Calculate delays
study_timeline_df['start_delay'] = (study_timeline_df['actual_start_date'] - 
                                   study_timeline_df['planned_start_date']).dt.days
study_timeline_df['end_delay'] = (study_timeline_df['actual_end_date'] - 
                                 study_timeline_df['planned_end_date']).dt.days

# Replace NaN with 0 for phases that haven't started or completed
study_timeline_df['start_delay'] = study_timeline_df['start_delay'].fillna(0)
study_timeline_df['end_delay'] = study_timeline_df['end_delay'].fillna(0)

# Gantt chart for study timeline
plt.figure(figsize=(14, 8))

# Sort phases by planned start date
study_timeline_df = study_timeline_df.sort_values('planned_start_date')

# Plot planned timeline
for i, phase in enumerate(study_timeline_df['phase']):
    start_date = study_timeline_df.iloc[i]['planned_start_date']
    end_date = study_timeline_df.iloc[i]['planned_end_date']
    
    if pd.notna(start_date) and pd.notna(end_date):
        duration = (end_date - start_date).days
        plt.barh(i, duration, left=start_date, height=0.3, color='blue', alpha=0.6, label='Planned' if i == 0 else "")

# Plot actual timeline
for i, phase in enumerate(study_timeline_df['phase']):
    start_date = study_timeline_df.iloc[i]['actual_start_date']
    end_date = study_timeline_df.iloc[i]['actual_end_date']
    
    if pd.notna(start_date):
        if pd.notna(end_date):
            duration = (end_date - start_date).days
            plt.barh(i+0.3, duration, left=start_date, height=0.3, color='red', alpha=0.6, label='Actual' if i == 0 else "")
        else:
            # For ongoing phases, use current date as the end
            duration = (datetime.now() - start_date).days
            plt.barh(i+0.3, duration, left=start_date, height=0.3, color='red', alpha=0.6, hatch='///')

plt.yticks(range(len(study_timeline_df)), study_timeline_df['phase'])
plt.xlabel('Date', fontsize=14)
plt.ylabel('Study Phase', fontsize=14)
plt.title('Study Timeline - Planned vs Actual', fontsize=16)
plt.legend()
plt.grid(axis='x')
plt.tight_layout()
plt.savefig('outputs/figures/study_timeline.png', dpi=300)
plt.close()

# Delay analysis
completed_phases = study_timeline_df[study_timeline_df['status'] == 'Completed']

plt.figure(figsize=(12, 6))
sns.barplot(x='phase', y='end_delay', data=completed_phases)
plt.title('Phase Completion Delays', fontsize=16)
plt.xlabel('Study Phase', fontsize=14)
plt.ylabel('Delay (days)', fontsize=14)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('outputs/figures/phase_delays.png', dpi=300)
plt.close()

# Timeline summary table
timeline_summary = pd.DataFrame({
    'Metric': ['Total Phases', 'Completed Phases', 'In Progress Phases', 'Planned Phases',
               'Average Start Delay', 'Average End Delay', 'Most Delayed Phase'],
    'Value': [
        len(study_timeline_df),
        len(study_timeline_df[study_timeline_df['status'] == 'Completed']),
        len(study_timeline_df[study_timeline_df['status'] == 'In Progress']),
        len(study_timeline_df[study_timeline_df['status'] == 'Planned']),
        f"{completed_phases['start_delay'].mean():.1f} days",
        f"{completed_phases['end_delay'].mean():.1f} days",
        completed_phases.iloc[completed_phases['end_delay'].argmax()]['phase'] if len(completed_phases) > 0 else 'N/A'
    ]
})

timeline_summary.to_csv('outputs/tables/timeline_summary.csv', index=False)

# Create overall summary report
print("Creating overall summary report...")

# Combine all summary tables
overall_summary = pd.concat([
    pd.DataFrame({'Section': ['Patient Demographics'], 'Metric': [''], 'Value': ['']}),
    demographics_summary.assign(Section='Patient Demographics'),
    pd.DataFrame({'Section': ['Adverse Events'], 'Metric': [''], 'Value': ['']}),
    ae_summary.assign(Section='Adverse Events'),
    pd.DataFrame({'Section': ['Lab Results'], 'Metric': [''], 'Value': ['']}),
    lab_summary.assign(Section='Lab Results'),
    pd.DataFrame({'Section': ['Site Performance'], 'Metric': [''], 'Value': ['']}),
    site_summary.assign(Section='Site Performance'),
    pd.DataFrame({'Section': ['Study Timeline'], 'Metric': [''], 'Value': ['']}),
    timeline_summary.assign(Section='Study Timeline')
])

overall_summary.to_csv('outputs/tables/overall_summary.csv', index=False)

print("Descriptive analytics completed successfully!")
