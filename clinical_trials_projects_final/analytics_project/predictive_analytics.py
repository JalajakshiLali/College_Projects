"""
Clinical Trials Predictive Analytics

This script performs predictive modeling on the clinical trial data, including:
1. Patient dropout prediction
2. Adverse event risk modeling
3. Site performance prediction
4. Trial duration estimation

The models are evaluated and results are saved.
"""

import pandas as pd
import numpy as np
import sqlite3
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os
import pickle

# Machine learning libraries
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report, mean_squared_error, r2_score

# Set style for plots
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette('viridis')

# Create output directories
os.makedirs('outputs/models', exist_ok=True)
os.makedirs('outputs/predictions', exist_ok=True)

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

# 1. Patient Dropout Prediction
print("Building patient dropout prediction model...")

# Prepare target variable
patients_df['dropout'] = patients_df['status'].apply(
    lambda x: 1 if x in ['Withdrawn', 'Lost to Follow-up'] else 0
)

# Filter out ongoing patients for this analysis
dropout_df = patients_df[patients_df['status'] != 'Ongoing'].copy()

# Feature engineering
# Convert enrollment date to days since study start
dropout_df['enrollment_date'] = pd.to_datetime(dropout_df['enrollment_date'])
min_date = dropout_df['enrollment_date'].min()
dropout_df['days_since_study_start'] = (dropout_df['enrollment_date'] - min_date).dt.days

# Extract medical history features
dropout_df['has_hypertension'] = dropout_df['medical_history'].str.contains('Hypertension').astype(int)
dropout_df['has_diabetes'] = dropout_df['medical_history'].str.contains('Diabetes').astype(int)
dropout_df['has_asthma'] = dropout_df['medical_history'].str.contains('Asthma').astype(int)
dropout_df['has_depression'] = dropout_df['medical_history'].str.contains('Depression').astype(int)
dropout_df['condition_count'] = dropout_df['medical_history'].apply(
    lambda x: 0 if x == 'None' else len(x.split(','))
)

# Add lab result features
# Get the first lab visit for each patient
first_labs = lab_results_df.sort_values('visit_date').groupby('patient_id').first().reset_index()
first_labs_pivot = first_labs.pivot_table(
    index='patient_id', 
    columns='test_name', 
    values='result_value',
    aggfunc='first'
).reset_index()

# Merge with patient data
dropout_df = pd.merge(dropout_df, first_labs_pivot, on='patient_id', how='left')

# Add adverse event features
# Count adverse events per patient
ae_counts = adverse_events_df.groupby('patient_id').size().reset_index()
ae_counts.columns = ['patient_id', 'adverse_event_count']

# Get severity of adverse events
severe_ae = adverse_events_df[adverse_events_df['severity'].isin(['Severe', 'Life-threatening'])]
severe_ae_counts = severe_ae.groupby('patient_id').size().reset_index()
severe_ae_counts.columns = ['patient_id', 'severe_ae_count']

# Merge with patient data
dropout_df = pd.merge(dropout_df, ae_counts, on='patient_id', how='left')
dropout_df = pd.merge(dropout_df, severe_ae_counts, on='patient_id', how='left')

# Fill missing values
dropout_df['adverse_event_count'] = dropout_df['adverse_event_count'].fillna(0)
dropout_df['severe_ae_count'] = dropout_df['severe_ae_count'].fillna(0)

# Select features for the model
features = [
    'age', 'days_since_study_start', 'condition_count',
    'has_hypertension', 'has_diabetes', 'has_asthma', 'has_depression',
    'adverse_event_count', 'severe_ae_count'
]

# Add categorical features
categorical_features = ['gender', 'ethnicity', 'study_arm', 'site_id']

# Prepare X and y
X = dropout_df[features + categorical_features].copy()
y = dropout_df['dropout']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create preprocessing pipeline
numeric_features = features
categorical_features = ['gender', 'ethnicity', 'study_arm', 'site_id']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Create and train the model
dropout_model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(random_state=42))
])

# Define hyperparameters for grid search
param_grid = {
    'classifier__n_estimators': [100],
    'classifier__max_depth': [None],
    'classifier__min_samples_split': [2]
}

# Perform grid search
grid_search = GridSearchCV(dropout_model, param_grid, cv=3, scoring='f1')
grid_search.fit(X_train, y_train)

# Get best model
best_dropout_model = grid_search.best_estimator_

# Make predictions
dropout_y_pred = best_dropout_model.predict(X_test)

# Evaluate the model
dropout_accuracy = accuracy_score(y_test, dropout_y_pred)
dropout_precision = precision_score(y_test, dropout_y_pred)
dropout_recall = recall_score(y_test, dropout_y_pred)
dropout_f1 = f1_score(y_test, dropout_y_pred)

print(f"Dropout Prediction Model Performance:")
print(f"Accuracy: {dropout_accuracy:.4f}")
print(f"Precision: {dropout_precision:.4f}")
print(f"Recall: {dropout_recall:.4f}")
print(f"F1 Score: {dropout_f1:.4f}")

# Generate confusion matrix
cm = confusion_matrix(y_test, dropout_y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix - Patient Dropout Prediction')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('outputs/figures/dropout_confusion_matrix.png', dpi=300)
plt.close()

# Save the model
with open('outputs/models/dropout_prediction_model.pkl', 'wb') as f:
    pickle.dump(best_dropout_model, f)

# Save model performance metrics
dropout_metrics = pd.DataFrame({
    'Metric': ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
    'Value': [dropout_accuracy, dropout_precision, dropout_recall, dropout_f1]
})
dropout_metrics.to_csv('outputs/predictions/dropout_model_metrics.csv', index=False)

# 2. Adverse Event Risk Modeling
print("Building adverse event risk model...")

# Prepare data for adverse event prediction
# We'll predict which patients are likely to experience severe adverse events

# Create target variable
patients_with_severe_ae = severe_ae['patient_id'].unique()
patients_df['severe_ae'] = patients_df['patient_id'].apply(
    lambda x: 1 if x in patients_with_severe_ae else 0
)

# Feature engineering
ae_risk_df = patients_df.copy()

# Convert enrollment date to days since study start
ae_risk_df['enrollment_date'] = pd.to_datetime(ae_risk_df['enrollment_date'])
min_date = ae_risk_df['enrollment_date'].min()
ae_risk_df['days_since_study_start'] = (ae_risk_df['enrollment_date'] - min_date).dt.days

# Extract medical history features
ae_risk_df['has_hypertension'] = ae_risk_df['medical_history'].str.contains('Hypertension').astype(int)
ae_risk_df['has_diabetes'] = ae_risk_df['medical_history'].str.contains('Diabetes').astype(int)
ae_risk_df['has_asthma'] = ae_risk_df['medical_history'].str.contains('Asthma').astype(int)
ae_risk_df['has_depression'] = ae_risk_df['medical_history'].str.contains('Depression').astype(int)
ae_risk_df['condition_count'] = ae_risk_df['medical_history'].apply(
    lambda x: 0 if x == 'None' else len(x.split(','))
)

# Merge with lab data
ae_risk_df = pd.merge(ae_risk_df, first_labs_pivot, on='patient_id', how='left')

# Select features for the model
features = [
    'age', 'days_since_study_start', 'condition_count',
    'has_hypertension', 'has_diabetes', 'has_asthma', 'has_depression'
]

# Add categorical features
categorical_features = ['gender', 'ethnicity', 'study_arm', 'site_id']

# Prepare X and y
X = ae_risk_df[features + categorical_features].copy()
y = ae_risk_df['severe_ae']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create preprocessing pipeline
numeric_features = features
categorical_features = ['gender', 'ethnicity', 'study_arm', 'site_id']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Create and train the model
ae_model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(random_state=42, max_iter=1000))
])

# Define hyperparameters for grid search
param_grid = {
    'classifier__C': [1.0],
    'classifier__penalty': ['l2'],
    'classifier__solver': ['liblinear']
}

# Perform grid search
grid_search = GridSearchCV(ae_model, param_grid, cv=3, scoring='f1')
grid_search.fit(X_train, y_train)

# Get best model
best_ae_model = grid_search.best_estimator_

# Make predictions
ae_y_pred = best_ae_model.predict(X_test)

# Evaluate the model
ae_accuracy = accuracy_score(y_test, ae_y_pred)
ae_precision = precision_score(y_test, ae_y_pred)
ae_recall = recall_score(y_test, ae_y_pred)
ae_f1 = f1_score(y_test, ae_y_pred)

print(f"Adverse Event Risk Model Performance:")
print(f"Accuracy: {ae_accuracy:.4f}")
print(f"Precision: {ae_precision:.4f}")
print(f"Recall: {ae_recall:.4f}")
print(f"F1 Score: {ae_f1:.4f}")

# Generate confusion matrix
cm = confusion_matrix(y_test, ae_y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix - Adverse Event Risk Prediction')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('outputs/figures/ae_risk_confusion_matrix.png', dpi=300)
plt.close()

# Save the model
with open('outputs/models/ae_risk_model.pkl', 'wb') as f:
    pickle.dump(best_ae_model, f)

# Save model performance metrics
ae_metrics = pd.DataFrame({
    'Metric': ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
    'Value': [ae_accuracy, ae_precision, ae_recall, ae_f1]
})
ae_metrics.to_csv('outputs/predictions/ae_risk_model_metrics.csv', index=False)

# 3. Site Performance Prediction
print("Building site performance prediction model...")

# We'll predict site retention rate based on site characteristics

# Prepare data
site_df = site_performance_df.copy()

# Select features
features = ['enrollment_target', 'enrollment_rate', 'protocol_deviations', 'data_queries', 'query_resolution_time']
categorical_features = ['site_type', 'experience_level', 'country']

# Prepare X and y
X = site_df[features + categorical_features].copy()
y = site_df['retention_rate']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create preprocessing pipeline
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Create and train the model
site_model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(random_state=42))
])

# Define hyperparameters for grid search
param_grid = {
    'regressor__n_estimators': [100],
    'regressor__max_depth': [None],
    'regressor__min_samples_split': [2]
}

# Perform grid search
grid_search = GridSearchCV(site_model, param_grid, cv=3, scoring='r2')
grid_search.fit(X_train, y_train)

# Get best model
best_site_model = grid_search.best_estimator_

# Make predictions
site_y_pred = best_site_model.predict(X_test)

# Evaluate the model
site_mse = mean_squared_error(y_test, site_y_pred)
site_rmse = np.sqrt(site_mse)
site_r2 = r2_score(y_test, site_y_pred)

print(f"Site Performance Model Performance:")
print(f"Mean Squared Error: {site_mse:.4f}")
print(f"Root Mean Squared Error: {site_rmse:.4f}")
print(f"R² Score: {site_r2:.4f}")

# Plot actual vs predicted
plt.figure(figsize=(10, 6))
plt.scatter(y_test, site_y_pred, alpha=0.7)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.xlabel('Actual Retention Rate')
plt.ylabel('Predicted Retention Rate')
plt.title('Actual vs Predicted Retention Rate')
plt.tight_layout()
plt.savefig('outputs/figures/site_performance_prediction.png', dpi=300)
plt.close()

# Save the model
with open('outputs/models/site_performance_model.pkl', 'wb') as f:
    pickle.dump(best_site_model, f)

# Save model performance metrics
site_metrics = pd.DataFrame({
    'Metric': ['Mean Squared Error', 'Root Mean Squared Error', 'R² Score'],
    'Value': [site_mse, site_rmse, site_r2]
})
site_metrics.to_csv('outputs/predictions/site_performance_model_metrics.csv', index=False)

# 4. Trial Duration Estimation
print("Building trial duration estimation model...")

# We'll predict the duration of each phase based on its characteristics

# Prepare data
timeline_df = study_timeline_df.copy()

# Convert date strings to datetime objects
for col in ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date']:
    timeline_df[col] = pd.to_datetime(timeline_df[col], errors='coerce')

# Calculate planned and actual durations
timeline_df['planned_duration'] = (timeline_df['planned_end_date'] - timeline_df['planned_start_date']).dt.days
timeline_df['actual_duration'] = (timeline_df['actual_end_date'] - timeline_df['actual_start_date']).dt.days

# Filter to only completed phases
completed_phases = timeline_df[timeline_df['status'] == 'Completed'].copy()

# Create features
completed_phases['phase_order'] = range(len(completed_phases))
completed_phases['is_enrollment'] = completed_phases['phase'].str.contains('Enrollment').astype(int)
completed_phases['is_treatment'] = completed_phases['phase'].str.contains('Treatment').astype(int)
completed_phases['is_reporting'] = completed_phases['phase'].str.contains('Report|Lock').astype(int)

# One-hot encode the phase
phase_dummies = pd.get_dummies(completed_phases['phase'], prefix='phase')
completed_phases = pd.concat([completed_phases, phase_dummies], axis=1)

# Select features
features = ['phase_order', 'planned_duration', 'is_enrollment', 'is_treatment', 'is_reporting']
features.extend([col for col in completed_phases.columns if col.startswith('phase_')])

# Prepare X and y
X = completed_phases[features].copy()
y = completed_phases['actual_duration']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and train the model
duration_model = LinearRegression()
duration_model.fit(X_train, y_train)

# Make predictions
duration_y_pred = duration_model.predict(X_test)

# Evaluate the model
duration_mse = mean_squared_error(y_test, duration_y_pred)
duration_rmse = np.sqrt(duration_mse)
duration_r2 = r2_score(y_test, duration_y_pred)

print(f"Trial Duration Model Performance:")
print(f"Mean Squared Error: {duration_mse:.4f}")
print(f"Root Mean Squared Error: {duration_rmse:.4f}")
print(f"R² Score: {duration_r2:.4f}")

# Plot actual vs predicted
plt.figure(figsize=(10, 6))
plt.scatter(y_test, duration_y_pred, alpha=0.7)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.xlabel('Actual Duration (days)')
plt.ylabel('Predicted Duration (days)')
plt.title('Actual vs Predicted Phase Duration')
plt.tight_layout()
plt.savefig('outputs/figures/duration_prediction.png', dpi=300)
plt.close()

# Save the model
with open('outputs/models/duration_model.pkl', 'wb') as f:
    pickle.dump(duration_model, f)

# Save model performance metrics
duration_metrics = pd.DataFrame({
    'Metric': ['Mean Squared Error', 'Root Mean Squared Error', 'R² Score'],
    'Value': [duration_mse, duration_rmse, duration_r2]
})
duration_metrics.to_csv('outputs/predictions/duration_model_metrics.csv', index=False)

# Create overall predictive modeling summary
print("Creating predictive modeling summary...")

# Combine all model metrics
predictive_summary = pd.DataFrame({
    'Model': [
        'Patient Dropout Prediction', 'Patient Dropout Prediction', 'Patient Dropout Prediction', 'Patient Dropout Prediction',
        'Adverse Event Risk', 'Adverse Event Risk', 'Adverse Event Risk', 'Adverse Event Risk',
        'Site Performance Prediction', 'Site Performance Prediction', 'Site Performance Prediction',
        'Trial Duration Estimation', 'Trial Duration Estimation', 'Trial Duration Estimation'
    ],
    'Metric': [
        'Accuracy', 'Precision', 'Recall', 'F1 Score',
        'Accuracy', 'Precision', 'Recall', 'F1 Score',
        'Mean Squared Error', 'Root Mean Squared Error', 'R² Score',
        'Mean Squared Error', 'Root Mean Squared Error', 'R² Score'
    ],
    'Value': [
        dropout_accuracy, dropout_precision, dropout_recall, dropout_f1,
        ae_accuracy, ae_precision, ae_recall, ae_f1,
        site_mse, site_rmse, site_r2,
        duration_mse, duration_rmse, duration_r2
    ]
})

predictive_summary.to_csv('outputs/predictions/predictive_modeling_summary.csv', index=False)

print("Predictive analytics completed successfully!")
