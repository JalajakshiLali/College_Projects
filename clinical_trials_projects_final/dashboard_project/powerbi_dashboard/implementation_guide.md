# Power BI Implementation Guide

This guide provides step-by-step instructions for implementing the Clinical Trials Power BI dashboard.

## Prerequisites

- Power BI Desktop (latest version)
- Access to the CSV data files in the `data` folder
- Basic understanding of Power BI functionality

## Step 1: Create a New Power BI Project

1. Open Power BI Desktop
2. Select "Get Data" from the Home ribbon
3. Choose "Text/CSV" as the data source
4. Navigate to the `data` folder and select all CSV files
5. Click "Load" to import the data

## Step 2: Data Model Setup

1. **Create Relationships**:
   - Go to "Model" view
   - Create the following relationships:
     - patients.site_id → site_performance.site_id
     - patients.patient_id → adverse_events.patient_id
     - patients.patient_id → lab_results.patient_id

2. **Create Date Table**:
   - Go to "Transform Data"
   - Create a new query using M formula:
     ```
     = List.Dates(#date(2023, 1, 1), 730, #duration(1, 0, 0, 0))
     ```
   - Expand to table and name columns appropriately
   - Mark as date table

3. **Create Calculated Columns**:
   - In patients table:
     - Age Group = SWITCH(TRUE(), [age] < 20, "< 20", [age] < 30, "20-29", [age] < 40, "30-39", [age] < 50, "40-49", [age] < 60, "50-59", [age] < 70, "60-69", [age] < 80, "70-79", "80+")
   - In adverse_events table:
     - Severity Order = SWITCH([severity], "Mild", 1, "Moderate", 2, "Severe", 3, "Life-threatening", 4, 5)

## Step 3: Create Key Measures

1. **Patient Measures**:
   ```
   Total Patients = COUNTROWS(patients)
   Completed Patients = CALCULATE(COUNTROWS(patients), patients[status] = "Completed")
   Ongoing Patients = CALCULATE(COUNTROWS(patients), patients[status] = "Ongoing")
   Withdrawn Patients = CALCULATE(COUNTROWS(patients), patients[status] = "Withdrawn")
   Lost Patients = CALCULATE(COUNTROWS(patients), patients[status] = "Lost to Follow-up")
   Completion Rate = DIVIDE([Completed Patients], [Total Patients], 0)
   ```

2. **Site Measures**:
   ```
   Total Sites = DISTINCTCOUNT(site_performance[site_id])
   Avg Enrollment Rate = AVERAGE(site_performance[enrollment_rate])
   Avg Retention Rate = AVERAGE(site_performance[retention_rate])
   ```

3. **Adverse Event Measures**:
   ```
   Total AEs = COUNTROWS(adverse_events)
   AE Rate = DIVIDE([Total AEs], [Total Patients], 0)
   Severe AEs = CALCULATE(COUNTROWS(adverse_events), adverse_events[severity] IN {"Severe", "Life-threatening"})
   ```

4. **Lab Result Measures**:
   ```
   Total Lab Tests = COUNTROWS(lab_results)
   Abnormal Results = CALCULATE(COUNTROWS(lab_results), lab_results[normal_flag] = "Abnormal")
   Abnormal Rate = DIVIDE([Abnormal Results], [Total Lab Tests], 0)
   ```

## Step 4: Create Dashboard Pages

### Study Overview Page

1. Add the following visuals:
   - Card visuals for Total Patients, Total Sites, Completion Rate, Total AEs
   - Donut chart for Patient Status (using status field)
   - Donut chart for Study Arm Distribution (using study_arm field)
   - Column chart for Patient Demographics (using age_group field)
   - Line chart for Enrollment Over Time (using enrollment_date field)

2. Add slicers for:
   - Date range
   - Site ID
   - Country

### Enrollment Dashboard Page

1. Add the following visuals:
   - Line chart for Cumulative Enrollment (enrollment_date on x-axis)
   - Bar chart for Enrollment by Site (site_id on y-axis)
   - Column chart for Enrollment by Country (country on x-axis)
   - Table with site enrollment details
   - Gauge for Enrollment Rate vs Target

2. Add slicers for:
   - Date range
   - Site Type
   - Country

### Safety Monitoring Page

1. Add the following visuals:
   - Bar chart for Top Adverse Events (adverse_event on y-axis)
   - Pie chart for AE Severity Distribution (severity field)
   - Pie chart for AE Relationship to Treatment (relationship field)
   - Line chart for AEs Over Time (report_date on x-axis)
   - Table with AE details

2. Add slicers for:
   - Severity
   - Relationship to Treatment
   - Date Range

### Site Performance Page

1. Add the following visuals:
   - Scatter plot of Enrollment Rate vs. Retention Rate
   - Bar chart for Protocol Deviations by Site
   - Column chart for Query Resolution Time by Site
   - Table with site performance metrics
   - Matrix visual for site comparison

2. Add slicers for:
   - Site Type
   - Country
   - Experience Level

### Timeline Tracking Page

1. Add the following visuals:
   - Gantt chart for study phases (using planned and actual dates)
   - Column chart for phase completion percentage
   - Table with timeline details
   - Card visuals for key milestone dates

2. Add slicers for:
   - Phase Status
   - Date Range

## Step 5: Add Interactivity

1. **Configure Cross-Filtering**:
   - Set appropriate cross-filtering behavior for all visuals
   - Use "Edit Interactions" to customize filtering behavior

2. **Add Drill-Through Pages**:
   - Create drill-through pages for:
     - Site Details
     - Patient Details
     - Adverse Event Details

3. **Add Bookmarks**:
   - Create bookmarks for different dashboard views:
     - Standard View
     - Site Comparison View
     - Safety Monitoring View
     - Executive Summary View

4. **Configure Tooltips**:
   - Create custom tooltips for key visuals
   - Add report page tooltips for detailed information

## Step 6: Format and Theme

1. Apply consistent formatting:
   - Use the color scheme defined in the design document
   - Apply consistent font sizes and styles
   - Add appropriate titles and labels to all visuals

2. Create a custom theme:
   - Go to View → Themes
   - Create a new theme with the color palette and fonts
   - Apply the theme to all pages

## Step 7: Optimize Performance

1. Review and optimize the data model:
   - Check for unnecessary columns
   - Ensure appropriate data types
   - Review relationships

2. Optimize visuals:
   - Limit the number of visuals per page
   - Use appropriate visual types
   - Configure slicers for efficiency

## Step 8: Publish and Share

1. Save the Power BI file (.pbix)
2. Publish to Power BI Service (if available)
3. Configure refresh settings
4. Share with stakeholders

## Troubleshooting

- **Data not loading**: Check file paths and data source settings
- **Relationships not working**: Verify key columns have unique values
- **Visuals not updating**: Check filter context and measure definitions
- **Performance issues**: Review data model and visual complexity
