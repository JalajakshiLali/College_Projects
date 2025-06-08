/**
 * Clinical Trials Dashboard - Main JavaScript
 * 
 * This file contains the JavaScript code for the Clinical Trials Dashboard,
 * including data fetching, chart creation, and dynamic content rendering.
 */

// Global chart objects for later reference
const charts = {};

// Document ready function
$(document).ready(function() {
    // Initialize sidebar toggle
    $('#sidebarCollapse').on('click', function() {
        $('#sidebar').toggleClass('active');
    });

    // Initialize tabs
    $('.nav-link').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Load initial data
    loadDashboardData();
});

/**
 * Main function to load all dashboard data
 */
function loadDashboardData() {
    // Show loading indicators
    showLoading();
    
    // Load data for each section
    loadSummaryData();
    loadEnrollmentData();
    loadRetentionData();
    loadTimelineData();
    loadAdverseEventsData();
    loadLabResultsData();
    loadSitePerformanceData();
    loadPredictiveInsightsData();
}

/**
 * Show loading indicators in all sections
 */
function showLoading() {
    // Add loading spinners or messages to key elements
    $('#total-patients').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#total-sites').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#completion-rate').html('<i class="fas fa-spinner fa-spin"></i>');
    $('#total-ae').html('<i class="fas fa-spinner fa-spin"></i>');
}

/**
 * Load summary data for the overview tab
 */
function loadSummaryData() {
    fetch('/api/summary')
        .then(response => response.json())
        .then(data => {
            // Update summary cards
            $('#total-patients').text(data.patients.total);
            $('#total-sites').text(data.sites.total);
            
            const completionRate = (data.patients.completed / data.patients.total * 100).toFixed(1);
            $('#completion-rate').text(`${completionRate}%`);
            
            $('#total-ae').text(data.adverse_events.total);
            
            // Create patient status chart
            createPatientStatusChart(data.patients);
            
            // Create study arm chart
            createStudyArmChart(data.patients);
        })
        .catch(error => {
            console.error('Error loading summary data:', error);
            $('#total-patients').text('Error');
            $('#total-sites').text('Error');
            $('#completion-rate').text('Error');
            $('#total-ae').text('Error');
        });
}

/**
 * Create patient status distribution chart
 */
function createPatientStatusChart(patientData) {
    const ctx = document.getElementById('patient-status-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.patientStatus) {
        charts.patientStatus.destroy();
    }
    
    charts.patientStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Ongoing', 'Withdrawn', 'Lost to Follow-up'],
            datasets: [{
                data: [
                    patientData.completed,
                    patientData.ongoing,
                    patientData.withdrawn,
                    patientData.lost_to_followup
                ],
                backgroundColor: [
                    '#28a745',  // Green for completed
                    '#007bff',  // Blue for ongoing
                    '#ffc107',  // Yellow for withdrawn
                    '#dc3545'   // Red for lost to follow-up
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Patient Status Distribution'
                }
            }
        }
    });
}

/**
 * Create study arm distribution chart
 */
function createStudyArmChart(patientData) {
    const ctx = document.getElementById('study-arm-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.studyArm) {
        charts.studyArm.destroy();
    }
    
    charts.studyArm = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Treatment', 'Placebo'],
            datasets: [{
                data: [
                    patientData.treatment_arm,
                    patientData.placebo_arm
                ],
                backgroundColor: [
                    '#17a2b8',  // Teal for treatment
                    '#6c757d'   // Gray for placebo
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Study Arm Distribution'
                }
            }
        }
    });
}

/**
 * Load enrollment data for the enrollment tab
 */
function loadEnrollmentData() {
    fetch('/api/enrollment')
        .then(response => response.json())
        .then(data => {
            // Create enrollment progress chart
            createEnrollmentProgressChart(data.over_time);
            
            // Create enrollment by site chart
            createEnrollmentBySiteChart(data.by_site);
            
            // Create enrollment by site type chart
            createEnrollmentBySiteTypeChart(data.by_site);
            
            // Populate enrollment table
            populateEnrollmentTable(data.by_site);
        })
        .catch(error => {
            console.error('Error loading enrollment data:', error);
        });
}

/**
 * Create enrollment progress chart
 */
function createEnrollmentProgressChart(enrollmentTimeData) {
    const ctx = document.getElementById('enrollment-progress-chart').getContext('2d');
    
    // Prepare data
    const dates = enrollmentTimeData.map(item => item.date);
    const dailyEnrollment = enrollmentTimeData.map(item => item.patients_enrolled);
    const cumulativeEnrollment = enrollmentTimeData.map(item => item.cumulative_enrolled);
    
    // Destroy existing chart if it exists
    if (charts.enrollmentProgress) {
        charts.enrollmentProgress.destroy();
    }
    
    charts.enrollmentProgress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Daily Enrollment',
                    data: dailyEnrollment,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y-axis-1'
                },
                {
                    label: 'Cumulative Enrollment',
                    data: cumulativeEnrollment,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    type: 'line',
                    fill: true,
                    yAxisID: 'y-axis-2'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                'y-axis-1': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Daily Enrollment'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                'y-axis-2': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cumulative Enrollment'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Patient Enrollment Over Time'
                }
            }
        }
    });
}

/**
 * Create enrollment by site chart
 */
function createEnrollmentBySiteChart(siteData) {
    const ctx = document.getElementById('enrollment-by-site-chart').getContext('2d');
    
    // Prepare data
    const siteIds = siteData.map(site => site.site_id);
    const actualEnrollment = siteData.map(site => site.actual_enrollment);
    const targetEnrollment = siteData.map(site => site.enrollment_target);
    
    // Destroy existing chart if it exists
    if (charts.enrollmentBySite) {
        charts.enrollmentBySite.destroy();
    }
    
    charts.enrollmentBySite = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [
                {
                    label: 'Actual Enrollment',
                    data: actualEnrollment,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)'
                },
                {
                    label: 'Target Enrollment',
                    data: targetEnrollment,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Patients'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Actual vs Target Enrollment by Site'
                }
            }
        }
    });
}

/**
 * Create enrollment by site type chart
 */
function createEnrollmentBySiteTypeChart(siteData) {
    const ctx = document.getElementById('enrollment-by-site-type-chart').getContext('2d');
    
    // Group data by site type
    const siteTypes = {};
    siteData.forEach(site => {
        if (!siteTypes[site.site_type]) {
            siteTypes[site.site_type] = {
                count: 0,
                totalRate: 0
            };
        }
        siteTypes[site.site_type].count++;
        siteTypes[site.site_type].totalRate += site.enrollment_rate;
    });
    
    // Calculate average enrollment rate by site type
    const siteTypeLabels = Object.keys(siteTypes);
    const avgEnrollmentRates = siteTypeLabels.map(type => 
        siteTypes[type].totalRate / siteTypes[type].count
    );
    
    // Destroy existing chart if it exists
    if (charts.enrollmentBySiteType) {
        charts.enrollmentBySiteType.destroy();
    }
    
    charts.enrollmentBySiteType = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteTypeLabels,
            datasets: [{
                label: 'Average Enrollment Rate',
                data: avgEnrollmentRates,
                backgroundColor: 'rgba(23, 162, 184, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Patients per Month'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site Type'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Average Enrollment Rate by Site Type'
                }
            }
        }
    });
}

/**
 * Populate enrollment table with site data
 */
function populateEnrollmentTable(siteData) {
    const tableBody = $('#enrollment-table tbody');
    tableBody.empty();
    
    siteData.forEach(site => {
        const progressPercentage = (site.actual_enrollment / site.enrollment_target * 100).toFixed(1);
        const progressClass = progressPercentage >= 100 ? 'bg-success' : 
                             progressPercentage >= 75 ? 'bg-info' : 
                             progressPercentage >= 50 ? 'bg-warning' : 'bg-danger';
        
        tableBody.append(`
            <tr>
                <td>${site.site_id}</td>
                <td>${site.country}</td>
                <td>${site.site_type}</td>
                <td>${site.enrollment_target}</td>
                <td>${site.actual_enrollment}</td>
                <td>
                    <div class="progress">
                        <div class="progress-bar ${progressClass}" role="progressbar" 
                             style="width: ${Math.min(progressPercentage, 100)}%" 
                             aria-valuenow="${progressPercentage}" aria-valuemin="0" aria-valuemax="100">
                            ${progressPercentage}%
                        </div>
                    </div>
                </td>
                <td>${site.enrollment_rate.toFixed(1)}</td>
            </tr>
        `);
    });
}

/**
 * Load retention data for the retention tab
 */
function loadRetentionData() {
    fetch('/api/retention')
        .then(response => response.json())
        .then(data => {
            // Create retention by site chart
            createRetentionBySiteChart(data);
            
            // Create dropout reasons chart
            createDropoutReasonsChart(data);
            
            // Populate retention table
            populateRetentionTable(data);
        })
        .catch(error => {
            console.error('Error loading retention data:', error);
        });
}

/**
 * Create retention by site chart
 */
function createRetentionBySiteChart(retentionData) {
    const ctx = document.getElementById('retention-by-site-chart').getContext('2d');
    
    // Prepare data
    const siteIds = retentionData.map(site => site.site_id);
    const retentionRates = retentionData.map(site => (1 - site.dropout_rate) * 100);
    
    // Destroy existing chart if it exists
    if (charts.retentionBySite) {
        charts.retentionBySite.destroy();
    }
    
    charts.retentionBySite = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Retention Rate (%)',
                data: retentionRates,
                backgroundColor: 'rgba(40, 167, 69, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Retention Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Patient Retention Rate by Site'
                }
            }
        }
    });
}

/**
 * Create dropout reasons chart
 */
function createDropoutReasonsChart(retentionData) {
    const ctx = document.getElementById('dropout-reasons-chart').getContext('2d');
    
    // Calculate totals
    let totalWithdrawn = 0;
    let totalLostToFollowup = 0;
    
    retentionData.forEach(site => {
        totalWithdrawn += site.withdrawn;
        totalLostToFollowup += site.lost_to_followup;
    });
    
    // Destroy existing chart if it exists
    if (charts.dropoutReasons) {
        charts.dropoutReasons.destroy();
    }
    
    charts.dropoutReasons = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Withdrawn', 'Lost to Follow-up'],
            datasets: [{
                data: [totalWithdrawn, totalLostToFollowup],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.7)',  // Yellow for withdrawn
                    'rgba(220, 53, 69, 0.7)'   // Red for lost to follow-up
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Dropout Reasons'
                }
            }
        }
    });
}

/**
 * Populate retention table with site data
 */
function populateRetentionTable(retentionData) {
    const tableBody = $('#retention-table tbody');
    tableBody.empty();
    
    retentionData.forEach(site => {
        const completionRate = (site.completion_rate * 100).toFixed(1);
        const dropoutRate = (site.dropout_rate * 100).toFixed(1);
        
        tableBody.append(`
            <tr>
                <td>${site.site_id}</td>
                <td>${site.total_patients}</td>
                <td>${site.completed}</td>
                <td>${site.ongoing}</td>
                <td>${site.withdrawn}</td>
                <td>${site.lost_to_followup}</td>
                <td>${completionRate}%</td>
                <td>${dropoutRate}%</td>
            </tr>
        `);
    });
}

/**
 * Load timeline data for the timeline tab
 */
function loadTimelineData() {
    fetch('/api/timeline')
        .then(response => response.json())
        .then(data => {
            // Create timeline progress tracker
            createTimelineProgressTracker(data);
            
            // Create Gantt chart
            createTimelineGantt(data);
            
            // Create phase status chart
            createPhaseStatusChart(data);
            
            // Create phase delays chart
            createPhaseDelaysChart(data);
            
            // Populate timeline table
            populateTimelineTable(data);
        })
        .catch(error => {
            console.error('Error loading timeline data:', error);
        });
}

/**
 * Create timeline progress tracker
 */
function createTimelineProgressTracker(timelineData) {
    const container = $('#timeline-progress');
    container.empty();
    
    timelineData.forEach(phase => {
        let statusClass = '';
        let progress = 0;
        
        switch(phase.status) {
            case 'Completed':
                statusClass = 'completed';
                progress = 100;
                break;
            case 'In Progress':
                statusClass = 'in-progress';
                // Estimate progress for in-progress phases
                if (phase.actual_start_date && phase.planned_end_date) {
                    const start = new Date(phase.actual_start_date);
                    const end = new Date(phase.planned_end_date);
                    const now = new Date();
                    const total = end - start;
                    const elapsed = now - start;
                    progress = Math.min(Math.round((elapsed / total) * 100), 100);
                }
                break;
            case 'Planned':
                statusClass = 'planned';
                progress = 0;
                break;
        }
        
        container.append(`
            <div class="progress-step">
                <div class="progress-step-label">${phase.phase}</div>
                <div class="progress-step-bar">
                    <div class="progress-step-bar-fill ${statusClass}" style="width: ${progress}%"></div>
                </div>
                <div class="progress-step-status ms-2">${phase.status} (${progress}%)</div>
            </div>
        `);
    });
}

/**
 * Create timeline Gantt chart
 */
function createTimelineGantt(timelineData) {
    const container = $('#timeline-gantt');
    container.empty();
    
    // Find min and max dates for scaling
    let minDate = new Date();
    let maxDate = new Date();
    
    timelineData.forEach(phase => {
        const plannedStart = phase.planned_start_date ? new Date(phase.planned_start_date) : null;
        const plannedEnd = phase.planned_end_date ? new Date(phase.planned_end_date) : null;
        const actualStart = phase.actual_start_date ? new Date(phase.actual_start_date) : null;
        const actualEnd = phase.actual_end_date ? new Date(phase.actual_end_date) : null;
        
        if (plannedStart && plannedStart < minDate) minDate = plannedStart;
        if (plannedEnd && plannedEnd > maxDate) maxDate = plannedEnd;
        if (actualStart && actualStart < minDate) minDate = actualStart;
        if (actualEnd && actualEnd > maxDate) maxDate = actualEnd;
    });
    
    // Add some padding
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const pixelsPerDay = container.width() / totalDays;
    
    // Add timeline header
    const header = $('<div class="gantt-header"></div>');
    container.append(header);
    
    // Add phase bars
    timelineData.forEach((phase, index) => {
        const plannedStart = phase.planned_start_date ? new Date(phase.planned_start_date) : null;
        const plannedEnd = phase.planned_end_date ? new Date(phase.planned_end_date) : null;
        const actualStart = phase.actual_start_date ? new Date(phase.actual_start_date) : null;
        const actualEnd = phase.actual_end_date ? new Date(phase.actual_end_date) : null;
        
        if (plannedStart && plannedEnd) {
            const plannedLeft = (plannedStart - minDate) / (1000 * 60 * 60 * 24) * pixelsPerDay;
            const plannedWidth = (plannedEnd - plannedStart) / (1000 * 60 * 60 * 24) * pixelsPerDay;
            
            container.append(`
                <div class="gantt-bar planned" style="top: ${index * 30 + 30}px; left: ${plannedLeft}px; width: ${plannedWidth}px;">
                    <span class="gantt-label">${phase.phase} (Planned)</span>
                </div>
            `);
        }
        
        if (actualStart) {
            const actualLeft = (actualStart - minDate) / (1000 * 60 * 60 * 24) * pixelsPerDay;
            let actualWidth;
            
            if (actualEnd) {
                actualWidth = (actualEnd - actualStart) / (1000 * 60 * 60 * 24) * pixelsPerDay;
            } else {
                // For in-progress phases, extend to current date
                const now = new Date();
                actualWidth = (now - actualStart) / (1000 * 60 * 60 * 24) * pixelsPerDay;
            }
            
            container.append(`
                <div class="gantt-bar actual" style="top: ${index * 30 + 40}px; left: ${actualLeft}px; width: ${actualWidth}px;">
                    <span class="gantt-label">${phase.phase} (${actualEnd ? 'Actual' : 'In Progress'})</span>
                </div>
            `);
        }
    });
}

/**
 * Create phase status chart
 */
function createPhaseStatusChart(timelineData) {
    const ctx = document.getElementById('phase-status-chart').getContext('2d');
    
    // Count phases by status
    const statusCounts = {
        'Completed': 0,
        'In Progress': 0,
        'Planned': 0
    };
    
    timelineData.forEach(phase => {
        statusCounts[phase.status]++;
    });
    
    // Destroy existing chart if it exists
    if (charts.phaseStatus) {
        charts.phaseStatus.destroy();
    }
    
    charts.phaseStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',   // Green for completed
                    'rgba(0, 123, 255, 0.7)',   // Blue for in progress
                    'rgba(108, 117, 125, 0.7)'  // Gray for planned
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Phase Completion Status'
                }
            }
        }
    });
}

/**
 * Create phase delays chart
 */
function createPhaseDelaysChart(timelineData) {
    const ctx = document.getElementById('phase-delays-chart').getContext('2d');
    
    // Calculate delays for completed phases
    const completedPhases = timelineData.filter(phase => phase.status === 'Completed');
    const phaseNames = completedPhases.map(phase => phase.phase);
    const delays = completedPhases.map(phase => {
        const plannedEnd = new Date(phase.planned_end_date);
        const actualEnd = new Date(phase.actual_end_date);
        return Math.round((actualEnd - plannedEnd) / (1000 * 60 * 60 * 24)); // Delay in days
    });
    
    // Destroy existing chart if it exists
    if (charts.phaseDelays) {
        charts.phaseDelays.destroy();
    }
    
    charts.phaseDelays = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: phaseNames,
            datasets: [{
                label: 'Delay (days)',
                data: delays,
                backgroundColor: delays.map(delay => 
                    delay <= 0 ? 'rgba(40, 167, 69, 0.7)' :  // Green for on time or early
                    delay <= 7 ? 'rgba(255, 193, 7, 0.7)' :  // Yellow for slight delay
                    'rgba(220, 53, 69, 0.7)'                 // Red for significant delay
                )
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Delay (days)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Study Phase'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Phase Completion Delays'
                }
            }
        }
    });
}

/**
 * Populate timeline table with phase data
 */
function populateTimelineTable(timelineData) {
    const tableBody = $('#timeline-table tbody');
    tableBody.empty();
    
    timelineData.forEach(phase => {
        let delay = '';
        let statusClass = '';
        
        switch(phase.status) {
            case 'Completed':
                statusClass = 'status-completed';
                if (phase.actual_end_date && phase.planned_end_date) {
                    const plannedEnd = new Date(phase.planned_end_date);
                    const actualEnd = new Date(phase.actual_end_date);
                    const delayDays = Math.round((actualEnd - plannedEnd) / (1000 * 60 * 60 * 24));
                    delay = delayDays > 0 ? `+${delayDays}` : delayDays;
                }
                break;
            case 'In Progress':
                statusClass = 'status-in-progress';
                break;
            case 'Planned':
                statusClass = 'status-planned';
                break;
        }
        
        tableBody.append(`
            <tr>
                <td>${phase.phase}</td>
                <td>${phase.planned_start_date || 'N/A'}</td>
                <td>${phase.planned_end_date || 'N/A'}</td>
                <td>${phase.actual_start_date || 'N/A'}</td>
                <td>${phase.actual_end_date || 'N/A'}</td>
                <td class="${statusClass}">${phase.status}</td>
                <td>${delay}</td>
            </tr>
        `);
    });
}

/**
 * Load adverse events data for the adverse events tab
 */
function loadAdverseEventsData() {
    fetch('/api/adverse_events')
        .then(response => response.json())
        .then(data => {
            // Create top adverse events chart
            createTopAdverseEventsChart(data.by_type);
            
            // Create adverse events by severity chart
            createAdverseEventsBySeverityChart(data.by_severity);
            
            // Create adverse events by site chart
            createAdverseEventsBySiteChart(data.by_site);
            
            // Create adverse events by relationship chart
            createAdverseEventsByRelationshipChart(data.by_relationship);
        })
        .catch(error => {
            console.error('Error loading adverse events data:', error);
        });
}

/**
 * Create top adverse events chart
 */
function createTopAdverseEventsChart(aeTypeData) {
    const ctx = document.getElementById('top-ae-chart').getContext('2d');
    
    // Get top 10 adverse events
    const topAEs = aeTypeData.slice(0, 10);
    const aeNames = topAEs.map(ae => ae.adverse_event);
    const aeCounts = topAEs.map(ae => ae.count);
    
    // Destroy existing chart if it exists
    if (charts.topAE) {
        charts.topAE.destroy();
    }
    
    charts.topAE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aeNames,
            datasets: [{
                label: 'Count',
                data: aeCounts,
                backgroundColor: 'rgba(220, 53, 69, 0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Adverse Events'
                }
            }
        }
    });
}

/**
 * Create adverse events by severity chart
 */
function createAdverseEventsBySeverityChart(aeSeverityData) {
    const ctx = document.getElementById('ae-severity-chart').getContext('2d');
    
    const severities = aeSeverityData.map(item => item.severity);
    const counts = aeSeverityData.map(item => item.count);
    
    // Define colors based on severity
    const colors = severities.map(severity => {
        switch(severity) {
            case 'Mild': return 'rgba(40, 167, 69, 0.7)';      // Green
            case 'Moderate': return 'rgba(255, 193, 7, 0.7)';  // Yellow
            case 'Severe': return 'rgba(255, 87, 34, 0.7)';    // Orange
            case 'Life-threatening': return 'rgba(220, 53, 69, 0.7)'; // Red
            default: return 'rgba(108, 117, 125, 0.7)';        // Gray
        }
    });
    
    // Destroy existing chart if it exists
    if (charts.aeSeverity) {
        charts.aeSeverity.destroy();
    }
    
    charts.aeSeverity = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: severities,
            datasets: [{
                data: counts,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Adverse Events by Severity'
                }
            }
        }
    });
}

/**
 * Create adverse events by site chart
 */
function createAdverseEventsBySiteChart(aeSiteData) {
    const ctx = document.getElementById('ae-by-site-chart').getContext('2d');
    
    const siteIds = aeSiteData.map(item => item.site_id);
    const counts = aeSiteData.map(item => item.count);
    
    // Destroy existing chart if it exists
    if (charts.aeBySite) {
        charts.aeBySite.destroy();
    }
    
    charts.aeBySite = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Adverse Events',
                data: counts,
                backgroundColor: 'rgba(23, 162, 184, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Adverse Events by Site'
                }
            }
        }
    });
}

/**
 * Create adverse events by relationship chart
 */
function createAdverseEventsByRelationshipChart(aeRelationshipData) {
    const ctx = document.getElementById('ae-relationship-chart').getContext('2d');
    
    const relationships = aeRelationshipData.map(item => item.relationship);
    const counts = aeRelationshipData.map(item => item.count);
    
    // Define colors based on relationship
    const colors = relationships.map(relationship => {
        if (relationship.includes('Definitely')) return 'rgba(220, 53, 69, 0.7)';
        if (relationship.includes('Probably')) return 'rgba(255, 87, 34, 0.7)';
        if (relationship.includes('Possibly')) return 'rgba(255, 193, 7, 0.7)';
        if (relationship.includes('Unlikely')) return 'rgba(108, 117, 125, 0.7)';
        return 'rgba(40, 167, 69, 0.7)'; // Not Related
    });
    
    // Destroy existing chart if it exists
    if (charts.aeRelationship) {
        charts.aeRelationship.destroy();
    }
    
    charts.aeRelationship = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: relationships,
            datasets: [{
                data: counts,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Relationship to Treatment'
                }
            }
        }
    });
}

/**
 * Load lab results data for the lab results tab
 */
function loadLabResultsData() {
    fetch('/api/lab_results')
        .then(response => response.json())
        .then(data => {
            // Create abnormal lab rates chart
            createAbnormalLabRatesChart(data);
            
            // Populate lab results table
            populateLabResultsTable(data);
        })
        .catch(error => {
            console.error('Error loading lab results data:', error);
        });
}

/**
 * Create abnormal lab rates chart
 */
function createAbnormalLabRatesChart(labData) {
    const ctx = document.getElementById('abnormal-lab-rates-chart').getContext('2d');
    
    const testNames = labData.map(item => item.test_name);
    const abnormalRates = labData.map(item => item.abnormal_rate * 100);
    
    // Destroy existing chart if it exists
    if (charts.abnormalLabRates) {
        charts.abnormalLabRates.destroy();
    }
    
    charts.abnormalLabRates = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: testNames,
            datasets: [{
                label: 'Abnormal Rate (%)',
                data: abnormalRates,
                backgroundColor: abnormalRates.map(rate => 
                    rate < 5 ? 'rgba(40, 167, 69, 0.7)' :  // Green for low rates
                    rate < 15 ? 'rgba(255, 193, 7, 0.7)' : // Yellow for medium rates
                    'rgba(220, 53, 69, 0.7)'               // Red for high rates
                )
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Abnormal Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Test Name'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Abnormal Lab Result Rates by Test'
                }
            }
        }
    });
}

/**
 * Populate lab results table
 */
function populateLabResultsTable(labData) {
    const tableBody = $('#lab-results-table tbody');
    tableBody.empty();
    
    labData.forEach(test => {
        const abnormalRate = (test.abnormal_rate * 100).toFixed(1);
        const normalCount = test.total - test.abnormal_count;
        
        tableBody.append(`
            <tr>
                <td>${test.test_name}</td>
                <td>${test.total}</td>
                <td>${normalCount}</td>
                <td>${test.abnormal_count}</td>
                <td>${abnormalRate}%</td>
            </tr>
        `);
    });
}

/**
 * Load site performance data for the site performance tab
 */
function loadSitePerformanceData() {
    fetch('/api/site_performance')
        .then(response => response.json())
        .then(data => {
            // Create site enrollment performance chart
            createSiteEnrollmentPerformanceChart(data);
            
            // Create site retention performance chart
            createSiteRetentionPerformanceChart(data);
            
            // Create protocol deviations chart
            createProtocolDeviationsChart(data);
            
            // Create query resolution time chart
            createQueryResolutionChart(data);
            
            // Populate site performance table
            populateSitePerformanceTable(data);
        })
        .catch(error => {
            console.error('Error loading site performance data:', error);
        });
}

/**
 * Create site enrollment performance chart
 */
function createSiteEnrollmentPerformanceChart(siteData) {
    const ctx = document.getElementById('site-enrollment-performance-chart').getContext('2d');
    
    const siteIds = siteData.map(site => site.site_id);
    const enrollmentPercentages = siteData.map(site => 
        (site.actual_enrollment / site.enrollment_target * 100).toFixed(1)
    );
    
    // Destroy existing chart if it exists
    if (charts.siteEnrollmentPerformance) {
        charts.siteEnrollmentPerformance.destroy();
    }
    
    charts.siteEnrollmentPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Enrollment Performance (%)',
                data: enrollmentPercentages,
                backgroundColor: enrollmentPercentages.map(percentage => 
                    percentage >= 100 ? 'rgba(40, 167, 69, 0.7)' :  // Green for >= 100%
                    percentage >= 75 ? 'rgba(23, 162, 184, 0.7)' :  // Blue for >= 75%
                    percentage >= 50 ? 'rgba(255, 193, 7, 0.7)' :   // Yellow for >= 50%
                    'rgba(220, 53, 69, 0.7)'                        // Red for < 50%
                )
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Enrollment Performance (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Site Enrollment Performance'
                }
            }
        }
    });
}

/**
 * Create site retention performance chart
 */
function createSiteRetentionPerformanceChart(siteData) {
    const ctx = document.getElementById('site-retention-performance-chart').getContext('2d');
    
    const siteIds = siteData.map(site => site.site_id);
    const retentionRates = siteData.map(site => site.retention_rate);
    
    // Destroy existing chart if it exists
    if (charts.siteRetentionPerformance) {
        charts.siteRetentionPerformance.destroy();
    }
    
    charts.siteRetentionPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Retention Rate (%)',
                data: retentionRates,
                backgroundColor: retentionRates.map(rate => 
                    rate >= 90 ? 'rgba(40, 167, 69, 0.7)' :  // Green for >= 90%
                    rate >= 80 ? 'rgba(23, 162, 184, 0.7)' :  // Blue for >= 80%
                    rate >= 70 ? 'rgba(255, 193, 7, 0.7)' :   // Yellow for >= 70%
                    'rgba(220, 53, 69, 0.7)'                  // Red for < 70%
                )
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Retention Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Site Retention Performance'
                }
            }
        }
    });
}

/**
 * Create protocol deviations chart
 */
function createProtocolDeviationsChart(siteData) {
    const ctx = document.getElementById('protocol-deviations-chart').getContext('2d');
    
    const siteIds = siteData.map(site => site.site_id);
    const deviationRates = siteData.map(site => 
        (site.protocol_deviations / site.actual_enrollment).toFixed(2)
    );
    
    // Destroy existing chart if it exists
    if (charts.protocolDeviations) {
        charts.protocolDeviations.destroy();
    }
    
    charts.protocolDeviations = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Deviations per Patient',
                data: deviationRates,
                backgroundColor: 'rgba(255, 193, 7, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Deviations per Patient'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Protocol Deviations by Site'
                }
            }
        }
    });
}

/**
 * Create query resolution time chart
 */
function createQueryResolutionChart(siteData) {
    const ctx = document.getElementById('query-resolution-chart').getContext('2d');
    
    const siteIds = siteData.map(site => site.site_id);
    const resolutionTimes = siteData.map(site => site.query_resolution_time);
    
    // Destroy existing chart if it exists
    if (charts.queryResolution) {
        charts.queryResolution.destroy();
    }
    
    charts.queryResolution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: siteIds,
            datasets: [{
                label: 'Resolution Time (days)',
                data: resolutionTimes,
                backgroundColor: resolutionTimes.map(time => 
                    time <= 3 ? 'rgba(40, 167, 69, 0.7)' :  // Green for <= 3 days
                    time <= 7 ? 'rgba(255, 193, 7, 0.7)' :  // Yellow for <= 7 days
                    'rgba(220, 53, 69, 0.7)'                // Red for > 7 days
                )
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Resolution Time (days)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Site ID'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Query Resolution Time by Site'
                }
            }
        }
    });
}

/**
 * Populate site performance table
 */
function populateSitePerformanceTable(siteData) {
    const tableBody = $('#site-performance-table tbody');
    tableBody.empty();
    
    siteData.forEach(site => {
        // Calculate performance score (simple weighted average)
        const enrollmentScore = site.actual_enrollment / site.enrollment_target * 100;
        const retentionScore = site.retention_rate;
        const deviationScore = Math.max(0, 100 - (site.protocol_deviations / site.actual_enrollment * 20));
        const queryScore = Math.max(0, 100 - (site.query_resolution_time * 10));
        
        const performanceScore = (
            enrollmentScore * 0.3 + 
            retentionScore * 0.3 + 
            deviationScore * 0.2 + 
            queryScore * 0.2
        ).toFixed(1);
        
        let scoreClass = '';
        let scoreLabel = '';
        
        if (performanceScore >= 90) {
            scoreClass = 'score-excellent';
            scoreLabel = 'Excellent';
        } else if (performanceScore >= 75) {
            scoreClass = 'score-good';
            scoreLabel = 'Good';
        } else if (performanceScore >= 60) {
            scoreClass = 'score-average';
            scoreLabel = 'Average';
        } else {
            scoreClass = 'score-poor';
            scoreLabel = 'Poor';
        }
        
        tableBody.append(`
            <tr>
                <td>${site.site_id}</td>
                <td>${site.country}</td>
                <td>${site.site_type}</td>
                <td>${site.experience_level}</td>
                <td>${site.enrollment_rate.toFixed(1)}</td>
                <td>${site.retention_rate.toFixed(1)}%</td>
                <td>${site.protocol_deviations}</td>
                <td>${site.query_resolution_time.toFixed(1)}</td>
                <td class="${scoreClass}">${performanceScore} (${scoreLabel})</td>
            </tr>
        `);
    });
}

/**
 * Load predictive insights data for the predictive insights tab
 */
function loadPredictiveInsightsData() {
    fetch('/api/predictive_insights')
        .then(response => response.json())
        .then(data => {
            // Create dropout risk chart
            createDropoutRiskChart(data.dropout_risk);
            
            // Create adverse event risk chart
            createAeRiskChart(data.adverse_event_risk);
            
            // Display high risk sites
            displayHighRiskSites(data.dropout_risk.high_risk_sites);
            
            // Display site performance prediction
            displaySitePerformancePrediction(
                data.site_performance_prediction.top_performers,
                data.site_performance_prediction.underperformers
            );
            
            // Display timeline prediction
            displayTimelinePrediction(
                data.timeline_prediction.estimated_completion_date,
                data.timeline_prediction.delay_risk,
                data.timeline_prediction.critical_phases
            );
        })
        .catch(error => {
            console.error('Error loading predictive insights data:', error);
        });
}

/**
 * Create dropout risk chart
 */
function createDropoutRiskChart(dropoutRiskData) {
    const ctx = document.getElementById('dropout-risk-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.dropoutRisk) {
        charts.dropoutRisk.destroy();
    }
    
    charts.dropoutRisk = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [
                    dropoutRiskData.high_risk_count,
                    dropoutRiskData.medium_risk_count,
                    dropoutRiskData.low_risk_count
                ],
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',   // Red for high risk
                    'rgba(255, 193, 7, 0.7)',   // Yellow for medium risk
                    'rgba(40, 167, 69, 0.7)'    // Green for low risk
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Patient Dropout Risk Distribution'
                }
            }
        }
    });
}

/**
 * Create adverse event risk chart
 */
function createAeRiskChart(aeRiskData) {
    const ctx = document.getElementById('ae-risk-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.aeRisk) {
        charts.aeRisk.destroy();
    }
    
    charts.aeRisk = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [
                    aeRiskData.high_risk_count,
                    aeRiskData.medium_risk_count,
                    aeRiskData.low_risk_count
                ],
                backgroundColor: [
                    'rgba(220, 53, 69, 0.7)',   // Red for high risk
                    'rgba(255, 193, 7, 0.7)',   // Yellow for medium risk
                    'rgba(40, 167, 69, 0.7)'    // Green for low risk
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Adverse Event Risk Distribution'
                }
            }
        }
    });
}

/**
 * Display high risk sites
 */
function displayHighRiskSites(highRiskSites) {
    const container = $('#high-risk-sites');
    container.empty();
    
    if (highRiskSites.length === 0) {
        container.append('<p>No high risk sites identified.</p>');
        return;
    }
    
    const badges = highRiskSites.map(site => 
        `<span class="badge badge-risk-high me-2 mb-2">${site}</span>`
    ).join('');
    
    container.append(badges);
}

/**
 * Display site performance prediction
 */
function displaySitePerformancePrediction(topPerformers, underperformers) {
    const topContainer = $('#top-performers');
    const underContainer = $('#underperformers');
    
    topContainer.empty();
    underContainer.empty();
    
    const topBadges = topPerformers.map(site => 
        `<span class="badge bg-success me-2 mb-2">${site}</span>`
    ).join('');
    
    const underBadges = underperformers.map(site => 
        `<span class="badge bg-danger me-2 mb-2">${site}</span>`
    ).join('');
    
    topContainer.append(topBadges);
    underContainer.append(underBadges);
}

/**
 * Display timeline prediction
 */
function displayTimelinePrediction(estimatedCompletion, delayRisk, criticalPhases) {
    $('#estimated-completion-date').text(estimatedCompletion);
    
    // Set delay risk with appropriate color
    let delayRiskClass = '';
    switch(delayRisk) {
        case 'High':
            delayRiskClass = 'text-danger';
            break;
        case 'Medium':
            delayRiskClass = 'text-warning';
            break;
        case 'Low':
            delayRiskClass = 'text-success';
            break;
    }
    
    $('#delay-risk').html(`<span class="${delayRiskClass}">${delayRisk}</span>`);
    
    // Display critical phases
    const criticalContainer = $('#critical-phases');
    criticalContainer.empty();
    
    const criticalBadges = criticalPhases.map(phase => 
        `<span class="badge bg-warning text-dark me-2 mb-2">${phase}</span>`
    ).join('');
    
    criticalContainer.append(criticalBadges);
}
