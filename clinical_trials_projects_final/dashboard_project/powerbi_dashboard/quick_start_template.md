# Power BI Dashboard Template

This document provides a step-by-step guide to quickly create your Power BI dashboard using the provided CSV files.

## Quick Start Guide

1. **Install Power BI Desktop**
   - Download from [Microsoft Power BI website](https://powerbi.microsoft.com/desktop/)
   - Install following the on-screen instructions

2. **Import Data**
   - Open Power BI Desktop
   - Click "Get Data" → "Text/CSV"
   - Navigate to the `data` folder and select all CSV files
   - Click "Load"

3. **Create Relationships**
   - Go to "Model" view (icon on the left sidebar)
   - Create these relationships by dragging fields between tables:
     - patients.site_id → site_performance.site_id
     - patients.patient_id → adverse_events.patient_id
     - patients.patient_id → lab_results.patient_id

4. **Create Dashboard Pages**
   - Create the following pages using the "+" tab at the bottom:
     - Overview
     - Enrollment
     - Retention
     - Timeline
     - Adverse Events
     - Lab Results
     - Site Performance
     - Predictive Insights

5. **Add Key Visualizations**
   - For each page, add the recommended visualizations below
   - Use the fields from the imported tables

## Page-by-Page Visualization Guide

### Overview Page
- **Card Visuals**:
  - Total Patients (Count of patients.patient_id)
  - Total Sites (Count distinct of site_performance.site_id)
  - Completion Rate (Count of patients where status="Completed" / Total patients)
  - Total Adverse Events (Count of adverse_events.ae_id)

- **Patient Status Chart**:
  - Visualization: Donut chart
  - Values: Count of patients
  - Legend: patients.status

- **Study Arm Chart**:
  - Visualization: Donut chart
  - Values: Count of patients
  - Legend: patients.study_arm

- **Timeline Progress**:
  - Visualization: Column chart
  - X-axis: study_timeline.phase
  - Y-axis: study_timeline.completion_percentage

### Enrollment Page
- **Enrollment Progress**:
  - Visualization: Line chart
  - X-axis: patients.enrollment_date
  - Y-axis: Count of patients (cumulative)

- **Enrollment by Site**:
  - Visualization: Bar chart
  - Y-axis: site_performance.site_id
  - X-axis: Count of patients

- **Enrollment by Country**:
  - Visualization: Column chart
  - X-axis: site_performance.country
  - Y-axis: Count of patients

- **Enrollment Table**:
  - Visualization: Table
  - Columns: site_id, country, site_type, enrollment_target, actual_enrollment, enrollment_rate

### Retention Page
- **Retention by Site**:
  - Visualization: Bar chart
  - X-axis: site_performance.site_id
  - Y-axis: site_performance.retention_rate

- **Dropout Reasons**:
  - Visualization: Pie chart
  - Values: Count of patients
  - Legend: patients.dropout_reason

- **Retention Table**:
  - Visualization: Table
  - Columns: site_id, total_patients, completed, ongoing, withdrawn, lost_to_followup, completion_rate, dropout_rate

### Timeline Page
- **Phase Status**:
  - Visualization: Pie chart
  - Values: Count of phases
  - Legend: study_timeline.status

- **Phase Delays**:
  - Visualization: Column chart
  - X-axis: study_timeline.phase
  - Y-axis: study_timeline.delay_days

- **Timeline Table**:
  - Visualization: Table
  - Columns: phase, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status, delay_days

### Adverse Events Page
- **Top Adverse Events**:
  - Visualization: Bar chart
  - Y-axis: adverse_events.adverse_event
  - X-axis: Count of adverse_events

- **AE Severity**:
  - Visualization: Pie chart
  - Values: Count of adverse_events
  - Legend: adverse_events.severity

- **AE by Site**:
  - Visualization: Column chart
  - X-axis: site_performance.site_id
  - Y-axis: Count of adverse_events

- **AE Relationship**:
  - Visualization: Pie chart
  - Values: Count of adverse_events
  - Legend: adverse_events.relationship

### Lab Results Page
- **Abnormal Lab Rates**:
  - Visualization: Column chart
  - X-axis: lab_results.test_name
  - Y-axis: Count of lab_results where normal_flag="Abnormal" / Count of lab_results

- **Lab Results Table**:
  - Visualization: Table
  - Columns: test_name, total_tests, normal_count, abnormal_count, abnormal_rate

### Site Performance Page
- **Site Enrollment Performance**:
  - Visualization: Bar chart
  - X-axis: site_performance.site_id
  - Y-axis: site_performance.enrollment_rate

- **Site Retention Performance**:
  - Visualization: Bar chart
  - X-axis: site_performance.site_id
  - Y-axis: site_performance.retention_rate

- **Protocol Deviations**:
  - Visualization: Column chart
  - X-axis: site_performance.site_id
  - Y-axis: site_performance.protocol_deviations

- **Site Performance Table**:
  - Visualization: Table
  - Columns: site_id, country, site_type, experience_level, enrollment_rate, retention_rate, protocol_deviations, query_resolution_time

### Predictive Insights Page
- **Dropout Risk**:
  - Visualization: Pie chart
  - Create calculated column in patients table: 
    - dropout_risk = IF(dropout_probability > 0.7, "High", IF(dropout_probability > 0.3, "Medium", "Low"))
  - Values: Count of patients
  - Legend: patients.dropout_risk

- **AE Risk**:
  - Visualization: Pie chart
  - Create calculated column in patients table:
    - ae_risk = IF(ae_probability > 0.7, "High", IF(ae_probability > 0.3, "Medium", "Low"))
  - Values: Count of patients
  - Legend: patients.ae_risk

- **Site Performance Prediction**:
  - Visualization: Scatter chart
  - X-axis: site_performance.enrollment_rate
  - Y-axis: site_performance.retention_rate
  - Size: site_performance.performance_score

## Filters and Slicers

Add these slicers to each page for interactive filtering:

1. **Date Range Slicer**:
   - Field: patients.enrollment_date
   - Type: Between

2. **Site Slicer**:
   - Field: site_performance.site_id
   - Type: Dropdown

3. **Country Slicer**:
   - Field: site_performance.country
   - Type: Dropdown

4. **Study Arm Slicer**:
   - Field: patients.study_arm
   - Type: Dropdown

## Save and Share

1. Save your Power BI file (.pbix)
2. Share with colleagues by:
   - Publishing to Power BI Service (requires account)
   - Exporting as PDF report
   - Sharing the .pbix file directly

## Need Help?

If you encounter any issues or need further customization, please refer to the detailed implementation guide or contact support.
