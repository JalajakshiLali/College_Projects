# Power BI Dashboard Design for Clinical Trials

This document outlines the design specifications for the Power BI dashboard for clinical trial monitoring.

## Data Model

### Tables and Relationships

1. **Patients Table**
   - Primary Key: patient_id
   - Foreign Keys: site_id
   - Measures: Total patients, enrollment rate, completion rate

2. **Adverse Events Table**
   - Primary Key: ae_id
   - Foreign Keys: patient_id, site_id
   - Measures: Total AEs, AE rate, severity distribution

3. **Lab Results Table**
   - Primary Key: result_id
   - Foreign Keys: patient_id, site_id
   - Measures: Abnormal rate, test distribution

4. **Site Performance Table**
   - Primary Key: site_id
   - Measures: Enrollment efficiency, retention rate, protocol deviations

5. **Study Timeline Table**
   - Primary Key: phase_id
   - Measures: Completion percentage, delay days

### Relationships
- Patients ← → Sites (many-to-one)
- Patients ← → Adverse Events (one-to-many)
- Patients ← → Lab Results (one-to-many)
- Sites ← → Adverse Events (one-to-many)

## Dashboard Pages

### 1. Study Overview
**Purpose**: Provide high-level metrics of the entire study

**Key Visualizations**:
- Card visuals for total patients, active sites, completion rate, and total AEs
- Donut chart for patient status distribution
- Donut chart for study arm distribution
- Timeline progress bar chart
- KPI indicators for enrollment vs. target

### 2. Enrollment Dashboard
**Purpose**: Track patient enrollment progress and site performance

**Key Visualizations**:
- Line chart for cumulative enrollment over time
- Bar chart for enrollment by site
- Column chart for enrollment by country
- Table with site enrollment details
- Enrollment rate vs. target gauge

### 3. Patient Monitoring
**Purpose**: Monitor patient demographics and status

**Key Visualizations**:
- Age distribution histogram
- Gender distribution pie chart
- Ethnicity distribution bar chart
- Patient status by site matrix
- Patient dropout reasons pie chart

### 4. Safety Monitoring
**Purpose**: Track adverse events and lab abnormalities

**Key Visualizations**:
- Top adverse events bar chart
- AE severity distribution
- AE relationship to treatment pie chart
- Lab abnormality rate by test type
- AE trend over time line chart

### 5. Site Performance
**Purpose**: Compare and analyze site performance metrics

**Key Visualizations**:
- Scatter plot of enrollment rate vs. retention rate
- Protocol deviation count by site
- Data query resolution time by site
- Site performance scorecard
- Site ranking table

### 6. Timeline Tracking
**Purpose**: Monitor study progress against planned timeline

**Key Visualizations**:
- Gantt chart for study phases
- Milestone completion status
- Planned vs. actual timeline comparison
- Critical path analysis
- Delay risk assessment

### 7. Predictive Insights
**Purpose**: Provide forward-looking analytics

**Key Visualizations**:
- Patient dropout risk prediction
- Site performance forecast
- Study completion date prediction
- Risk factor identification matrix

## Interactivity Features

1. **Filters and Slicers**:
   - Date range selector
   - Site/country filter
   - Patient demographic filters
   - Study arm selector

2. **Drill-Through Actions**:
   - From site summary to site details
   - From patient groups to individual patient profiles
   - From AE summary to AE details

3. **Bookmarks**:
   - Standard view
   - Site comparison view
   - Safety monitoring view
   - Executive summary view

4. **Custom Tooltips**:
   - Enhanced tooltips for all charts
   - Contextual information on hover
   - Mini-visualizations within tooltips

## Visual Design

1. **Color Scheme**:
   - Primary: #0078D4 (blue)
   - Secondary: #107C10 (green)
   - Accent: #D83B01 (orange)
   - Warning: #A80000 (red)
   - Neutral: #505050 (gray)

2. **Typography**:
   - Headers: Segoe UI Light, 18pt
   - Body: Segoe UI, 10pt
   - Notes: Segoe UI Italic, 8pt

3. **Layout**:
   - Consistent grid layout
   - Left-to-right, top-to-bottom reading pattern
   - Most important metrics in top-left quadrant
   - Related visualizations grouped together

## Performance Optimization

1. **Data Model Optimization**:
   - Appropriate data types for all columns
   - Calculated columns minimized
   - Measures used instead of calculated columns where possible
   - Date tables properly configured

2. **Visual Optimization**:
   - Limited visuals per page (max 6-8)
   - Appropriate visual types for data cardinality
   - Slicers configured for efficiency
   - Drill-through instead of excessive detail on main pages

## Refresh Strategy

1. **Data Sources**:
   - CSV files (initial implementation)
   - Database connection (future implementation)

2. **Refresh Schedule**:
   - Manual refresh for CSV-based implementation
   - Daily scheduled refresh for database implementation

3. **Incremental Refresh**:
   - Configured for large tables (lab results, adverse events)
   - Full refresh for small tables (sites, timeline)

## Export and Sharing

1. **Export Options**:
   - PDF export of full dashboard
   - PowerPoint export of key slides
   - Excel export of underlying data

2. **Sharing**:
   - Power BI Service publishing
   - Embedded in SharePoint (future)
   - Mobile optimization for Power BI mobile app
