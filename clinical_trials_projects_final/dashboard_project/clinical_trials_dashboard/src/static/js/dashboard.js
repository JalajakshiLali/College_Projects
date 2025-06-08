/**
 * Clinical Trials Dashboard JavaScript
 * This file contains all the JavaScript functionality for the clinical trials dashboard.
 */

// Global chart objects to allow updating
let patientStatusChart;
let studyArmChart;
let enrollmentProgressChart;
let enrollmentBySiteChart;
let enrollmentBySiteTypeChart;
let retentionBySiteChart;
let dropoutReasonsChart;
let phaseStatusChart;
let phaseDelaysChart;
let topAEChart;
let aeSeverityChart;
let aeBySiteChart;
let aeRelationshipChart;
let abnormalLabRatesChart;
let siteEnrollmentPerformanceChart;
let siteRetentionPerformanceChart;
let protocolDeviationsChart;
let queryResolutionChart;
let dropoutRiskChart;
let aeRiskChart;

// Document ready function
$(document).ready(function() {
    // Initialize sidebar toggle
    $('#sidebarCollapse').on('click', function() {
        $('#sidebar').toggleClass('active');
    });

    // Load data for the active tab
    loadTabData($('.tab-pane.active').attr('id'));

    // Tab change event
    $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
        const tabId = $(e.target).attr('href').substring(1);
        loadTabData(tabId);
    });
});

/**
 * Load data for the specified tab
 * @param {string} tabId - The ID of the tab to load data for
 */
function loadTabData(tabId) {
    switch(tabId) {
        case 'overview':
            loadSummaryData();
            break;
        case 'enrollment':
            loadEnrollmentData();
            break;
        case 'retention':
            loadRetentionData();
            break;
        case 'timeline':
            loadTimelineData();
            break;
        case 'adverse-events':
            loadAdverseEventsData();
            break;
        case 'lab-results':
            loadLabResultsData();
            break;
        case 'site-performance':
            loadSitePerformanceData();
            break;
        case 'predictive':
            loadPredictiveInsightsData();
            break;
    }
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
            $('#completion-rate').text((data.patients.completed / data.patients.total * 100).toFixed(1) + '%');
            $('#total-ae').text(data.adverse_events.total);

            // Create patient status chart
            createPatientStatusChart(data.patients);
            
            // Create study arm chart
            createStudyArmChart(data.patients);
        })
        .catch(error => {
            console.error('Error loading summary data:', error);
            // Display error message in cards
            $('#total-patients').text('Error');
            $('#total-sites').text('Error');
            $('#completion-rate').text('Error');
            $('#total-ae').text('Error');
        });

    // Load timeline data for the progress bar
    fetch('/api/timeline')
        .then(response => response.json())
        .then(data => {
            createTimelineProgress(data);
        })
        .catch(error => {
            console.error('Error loading timeline data:', error);
        });
}

/**
 * Create patient status distribution chart
 * @param {Object} patientData - Patient data from the API
 */
function createPatientStatusChart(patientData) {
    try {
        const ctx = document.getElementById('patient-status-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (patientStatusChart) {
            patientStatusChart.destroy();
        }
        
        patientStatusChart = new Chart(ctx, {
            type: 'doughnut',
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
                        '#28a745',
                        '#007bff',
                        '#ffc107',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating patient status chart:', error);
    }
}

/**
 * Create study arm distribution chart
 * @param {Object} patientData - Patient data from the API
 */
function createStudyArmChart(patientData) {
    try {
        const ctx = document.getElementById('study-arm-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (studyArmChart) {
            studyArmChart.destroy();
        }
        
        studyArmChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Treatment', 'Placebo'],
                datasets: [{
                    data: [
                        patientData.treatment_arm,
                        patientData.placebo_arm
                    ],
                    backgroundColor: [
                        '#007bff',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating study arm chart:', error);
    }
}

/**
 * Create timeline progress visualization
 * @param {Array} timelineData - Timeline data from the API
 */
function createTimelineProgress(timelineData) {
    const container = document.getElementById('timeline-progress');
    container.innerHTML = '';
    
    timelineData.forEach(phase => {
        let status = phase.status;
        let percentage = 0;
        
        if (status === 'Completed') {
            percentage = 100;
        } else if (status === 'In Progress') {
            // Calculate percentage based on planned and actual dates
            const plannedStart = new Date(phase.planned_start_date);
            const plannedEnd = new Date(phase.planned_end_date);
            const actualStart = new Date(phase.actual_start_date);
            const today = new Date();
            
            const totalDays = (plannedEnd - plannedStart) / (1000 * 60 * 60 * 24);
            const daysElapsed = (today - actualStart) / (1000 * 60 * 60 * 24);
            
            percentage = Math.min(Math.round((daysElapsed / totalDays) * 100), 100);
        }
        
        const row = document.createElement('div');
        row.className = 'phase-row';
        
        const phaseLabel = document.createElement('div');
        phaseLabel.className = 'phase-label';
        phaseLabel.textContent = phase.phase;
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        
        if (status === 'Completed') {
            progressBar.classList.add('bg-success');
        } else if (status === 'In Progress') {
            progressBar.classList.add('bg-primary');
        } else {
            progressBar.classList.add('bg-secondary');
        }
        
        const statusLabel = document.createElement('div');
        statusLabel.className = 'status-label';
        statusLabel.textContent = `${status} (${percentage}%)`;
        
        progressContainer.appendChild(progressBar);
        row.appendChild(phaseLabel);
        row.appendChild(progressContainer);
        row.appendChild(statusLabel);
        container.appendChild(row);
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
 * @param {Array} enrollmentData - Enrollment over time data from the API
 */
function createEnrollmentProgressChart(enrollmentData) {
    try {
        const ctx = document.getElementById('enrollment-progress-chart').getContext('2d');
        
        // Prepare data
        const labels = enrollmentData.map(item => item.date);
        const cumulativeData = enrollmentData.map(item => item.cumulative_enrolled);
        const dailyData = enrollmentData.map(item => item.patients_enrolled);
        
        // Destroy existing chart if it exists
        if (enrollmentProgressChart) {
            enrollmentProgressChart.destroy();
        }
        
        enrollmentProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cumulative Enrollment',
                        data: cumulativeData,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Daily Enrollment',
                        data: dailyData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.5)',
                        type: 'bar',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Cumulative Patients'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Daily Patients'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating enrollment progress chart:', error);
    }
}

/**
 * Create enrollment by site chart
 * @param {Array} siteData - Site enrollment data from the API
 */
function createEnrollmentBySiteChart(siteData) {
    try {
        const ctx = document.getElementById('enrollment-by-site-chart').getContext('2d');
        
        // Prepare data
        const sites = siteData.map(site => site.site_id);
        const actualEnrollment = siteData.map(site => site.actual_enrollment);
        const enrollmentTarget = siteData.map(site => site.enrollment_target);
        
        // Destroy existing chart if it exists
        if (enrollmentBySiteChart) {
            enrollmentBySiteChart.destroy();
        }
        
        enrollmentBySiteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sites,
                datasets: [
                    {
                        label: 'Actual Enrollment',
                        data: actualEnrollment,
                        backgroundColor: '#007bff'
                    },
                    {
                        label: 'Target Enrollment',
                        data: enrollmentTarget,
                        backgroundColor: 'rgba(0, 123, 255, 0.3)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating enrollment by site chart:', error);
    }
}

/**
 * Create enrollment by site type chart
 * @param {Array} siteData - Site enrollment data from the API
 */
function createEnrollmentBySiteTypeChart(siteData) {
    try {
        const ctx = document.getElementById('enrollment-by-site-type-chart').getContext('2d');
        
        // Prepare data - group by site type
        const siteTypes = [...new Set(siteData.map(site => site.site_type))];
        const enrollmentRateByType = siteTypes.map(type => {
            const sitesOfType = siteData.filter(site => site.site_type === type);
            const avgRate = sitesOfType.reduce((sum, site) => sum + site.enrollment_rate, 0) / sitesOfType.length;
            return avgRate;
        });
        
        // Destroy existing chart if it exists
        if (enrollmentBySiteTypeChart) {
            enrollmentBySiteTypeChart.destroy();
        }
        
        enrollmentBySiteTypeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: siteTypes,
                datasets: [
                    {
                        label: 'Avg. Enrollment Rate',
                        data: enrollmentRateByType,
                        backgroundColor: '#28a745'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Site Type'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Avg. Enrollment Rate (patients/month)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating enrollment by site type chart:', error);
    }
}

/**
 * Populate enrollment table with site data
 * @param {Array} siteData - Site enrollment data from the API
 */
function populateEnrollmentTable(siteData) {
    const tableBody = document.querySelector('#enrollment-table tbody');
    tableBody.innerHTML = '';
    
    siteData.forEach(site => {
        const row = document.createElement('tr');
        
        // Calculate progress percentage
        const progress = (site.actual_enrollment / site.enrollment_target) * 100;
        
        row.innerHTML = `
            <td>${site.site_id}</td>
            <td>${site.country}</td>
            <td>${site.site_type}</td>
            <td>${site.enrollment_target}</td>
            <td>${site.actual_enrollment}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}" 
                         role="progressbar" 
                         style="width: ${Math.min(progress, 100)}%"
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${progress.toFixed(1)}%
                    </div>
                </div>
            </td>
            <td>${site.enrollment_rate.toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
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
 * @param {Array} retentionData - Retention data from the API
 */
function createRetentionBySiteChart(retentionData) {
    try {
        const ctx = document.getElementById('retention-by-site-chart').getContext('2d');
        
        // Prepare data
        const sites = retentionData.map(site => site.site_id);
        const completionRates = retentionData.map(site => site.completion_rate * 100);
        const dropoutRates = retentionData.map(site => site.dropout_rate * 100);
        
        // Destroy existing chart if it exists
        if (retentionBySiteChart) {
            retentionBySiteChart.destroy();
        }
        
        retentionBySiteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sites,
                datasets: [
                    {
                        label: 'Completion Rate (%)',
                        data: completionRates,
                        backgroundColor: '#28a745'
                    },
                    {
                        label: 'Dropout Rate (%)',
                        data: dropoutRates,
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Site ID'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating retention by site chart:', error);
    }
}

/**
 * Create dropout reasons chart
 * @param {Array} retentionData - Retention data from the API
 */
function createDropoutReasonsChart(retentionData) {
    try {
        const ctx = document.getElementById('dropout-reasons-chart').getContext('2d');
        
        // Aggregate dropout reasons
        const withdrawn = retentionData.reduce((sum, site) => sum + site.withdrawn, 0);
        const lostToFollowup = retentionData.reduce((sum, site) => sum + site.lost_to_followup, 0);
        
        // Destroy existing chart if it exists
        if (dropoutReasonsChart) {
            dropoutReasonsChart.destroy();
        }
        
        dropoutReasonsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Withdrawn', 'Lost to Follow-up'],
                datasets: [{
                    data: [withdrawn, lostToFollowup],
                    backgroundColor: [
                        '#ffc107',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating dropout reasons chart:', error);
    }
}

/**
 * Populate retention table with site data
 * @param {Array} retentionData - Retention data from the API
 */
function populateRetentionTable(retentionData) {
    const tableBody = document.querySelector('#retention-table tbody');
    tableBody.innerHTML = '';
    
    retentionData.forEach(site => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${site.site_id}</td>
            <td>${site.total_patients}</td>
            <td>${site.completed}</td>
            <td>${site.ongoing}</td>
            <td>${site.withdrawn}</td>
            <td>${site.lost_to_followup}</td>
            <td>${(site.completion_rate * 100).toFixed(1)}%</td>
            <td>${(site.dropout_rate * 100).toFixed(1)}%</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Load timeline data for the timeline tab
 */
function loadTimelineData() {
    fetch('/api/timeline')
        .then(response => response.json())
        .then(data => {
            // Create timeline Gantt chart
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
 * Create timeline Gantt chart
 * @param {Array} timelineData - Timeline data from the API
 */
function createTimelineGantt(timelineData) {
    const container = document.getElementById('timeline-gantt');
    container.innerHTML = '';
    
    // Create a table for the Gantt chart
    const table = document.createElement('table');
    table.className = 'gantt-chart';
    
    // Add header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th class="phase-column">Phase</th>
        <th class="timeline-column">Timeline</th>
    `;
    table.appendChild(headerRow);
    
    // Find min and max dates for scaling
    let minDate = new Date();
    let maxDate = new Date();
    
    timelineData.forEach(phase => {
        const plannedStart = new Date(phase.planned_start_date);
        const plannedEnd = new Date(phase.planned_end_date);
        const actualStart = phase.actual_start_date ? new Date(phase.actual_start_date) : null;
        const actualEnd = phase.actual_end_date ? new Date(phase.actual_end_date) : null;
        
        if (plannedStart < minDate) minDate = plannedStart;
        if (plannedEnd > maxDate) maxDate = plannedEnd;
        if (actualStart && actualStart < minDate) minDate = actualStart;
        if (actualEnd && actualEnd > maxDate) maxDate = actualEnd;
    });
    
    // Add some padding
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    
    // Add phase rows
    timelineData.forEach(phase => {
        const row = document.createElement('tr');
        
        // Phase name cell
        const phaseCell = document.createElement('td');
        phaseCell.className = 'phase-name';
        phaseCell.textContent = phase.phase;
        row.appendChild(phaseCell);
        
        // Timeline cell
        const timelineCell = document.createElement('td');
        timelineCell.className = 'timeline';
        
        // Create the timeline bar container
        const timelineBar = document.createElement('div');
        timelineBar.className = 'timeline-bar';
        
        // Calculate positions for planned timeline
        const plannedStart = new Date(phase.planned_start_date);
        const plannedEnd = new Date(phase.planned_end_date);
        const plannedStartPos = ((plannedStart - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100;
        const plannedWidth = ((plannedEnd - plannedStart) / (1000 * 60 * 60 * 24)) / totalDays * 100;
        
        // Create planned timeline bar
        const plannedBar = document.createElement('div');
        plannedBar.className = 'planned-bar';
        plannedBar.style.left = `${plannedStartPos}%`;
        plannedBar.style.width = `${plannedWidth}%`;
        plannedBar.setAttribute('title', `Planned: ${plannedStart.toLocaleDateString()} - ${plannedEnd.toLocaleDateString()}`);
        timelineBar.appendChild(plannedBar);
        
        // If actual dates exist, create actual timeline bar
        if (phase.actual_start_date) {
            const actualStart = new Date(phase.actual_start_date);
            const actualEnd = phase.actual_end_date ? new Date(phase.actual_end_date) : new Date();
            const actualStartPos = ((actualStart - minDate) / (1000 * 60 * 60 * 24)) / totalDays * 100;
            const actualWidth = ((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) / totalDays * 100;
            
            const actualBar = document.createElement('div');
            actualBar.className = 'actual-bar';
            actualBar.style.left = `${actualStartPos}%`;
            actualBar.style.width = `${actualWidth}%`;
            
            if (phase.status === 'Completed') {
                actualBar.classList.add('completed');
            } else if (phase.status === 'In Progress') {
                actualBar.classList.add('in-progress');
            }
            
            actualBar.setAttribute('title', `Actual: ${actualStart.toLocaleDateString()} - ${phase.actual_end_date ? actualEnd.toLocaleDateString() : 'Ongoing'}`);
            timelineBar.appendChild(actualBar);
        }
        
        timelineCell.appendChild(timelineBar);
        row.appendChild(timelineCell);
        
        table.appendChild(row);
    });
    
    container.appendChild(table);
    
    // Add date markers
    const dateMarkers = document.createElement('div');
    dateMarkers.className = 'date-markers';
    
    // Add 5 evenly spaced date markers
    for (let i = 0; i <= 4; i++) {
        const markerDate = new Date(minDate.getTime() + (maxDate - minDate) * (i / 4));
        const marker = document.createElement('div');
        marker.className = 'date-marker';
        marker.style.left = `${i * 25}%`;
        marker.textContent = markerDate.toLocaleDateString();
        dateMarkers.appendChild(marker);
    }
    
    container.appendChild(dateMarkers);
}

/**
 * Create phase status chart
 * @param {Array} timelineData - Timeline data from the API
 */
function createPhaseStatusChart(timelineData) {
    try {
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
        if (phaseStatusChart) {
            phaseStatusChart.destroy();
        }
        
        phaseStatusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#28a745',  // Completed
                        '#007bff',  // In Progress
                        '#6c757d'   // Planned
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating phase status chart:', error);
    }
}

/**
 * Create phase delays chart
 * @param {Array} timelineData - Timeline data from the API
 */
function createPhaseDelaysChart(timelineData) {
    try {
        const ctx = document.getElementById('phase-delays-chart').getContext('2d');
        
        // Calculate delays for completed phases
        const completedPhases = timelineData.filter(phase => phase.status === 'Completed');
        const phases = completedPhases.map(phase => phase.phase);
        const delays = completedPhases.map(phase => {
            const plannedEnd = new Date(phase.planned_end_date);
            const actualEnd = new Date(phase.actual_end_date);
            return Math.round((actualEnd - plannedEnd) / (1000 * 60 * 60 * 24)); // Delay in days
        });
        
        // Destroy existing chart if it exists
        if (phaseDelaysChart) {
            phaseDelaysChart.destroy();
        }
        
        phaseDelaysChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: phases,
                datasets: [{
                    label: 'Delay (days)',
                    data: delays,
                    backgroundColor: delays.map(delay => delay > 0 ? '#dc3545' : '#28a745')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Phase'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Delay (days)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return value > 0 ? `Delayed by ${value} days` : `Ahead by ${Math.abs(value)} days`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating phase delays chart:', error);
    }
}

/**
 * Populate timeline table with phase data
 * @param {Array} timelineData - Timeline data from the API
 */
function populateTimelineTable(timelineData) {
    const tableBody = document.querySelector('#timeline-table tbody');
    tableBody.innerHTML = '';
    
    timelineData.forEach(phase => {
        const row = document.createElement('tr');
        
        // Calculate delay
        let delay = '';
        if (phase.status === 'Completed') {
            const plannedEnd = new Date(phase.planned_end_date);
            const actualEnd = new Date(phase.actual_end_date);
            const delayDays = Math.round((actualEnd - plannedEnd) / (1000 * 60 * 60 * 24));
            
            delay = delayDays > 0 ? `+${delayDays}` : delayDays;
        }
        
        row.innerHTML = `
            <td>${phase.phase}</td>
            <td>${new Date(phase.planned_start_date).toLocaleDateString()}</td>
            <td>${new Date(phase.planned_end_date).toLocaleDateString()}</td>
            <td>${phase.actual_start_date ? new Date(phase.actual_start_date).toLocaleDateString() : '-'}</td>
            <td>${phase.actual_end_date ? new Date(phase.actual_end_date).toLocaleDateString() : '-'}</td>
            <td>
                <span class="badge ${phase.status === 'Completed' ? 'bg-success' : phase.status === 'In Progress' ? 'bg-primary' : 'bg-secondary'}">
                    ${phase.status}
                </span>
            </td>
            <td>${delay}</td>
        `;
        
        tableBody.appendChild(row);
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
            createAESeverityChart(data.by_severity);
            
            // Create adverse events by site chart
            createAEBySiteChart(data.by_site);
            
            // Create relationship to treatment chart
            createAERelationshipChart(data.by_relationship);
        })
        .catch(error => {
            console.error('Error loading adverse events data:', error);
        });
}

/**
 * Create top adverse events chart
 * @param {Array} aeData - Adverse event type data from the API
 */
function createTopAdverseEventsChart(aeData) {
    try {
        const ctx = document.getElementById('top-ae-chart').getContext('2d');
        
        // Sort and limit to top 10
        const sortedData = [...aeData].sort((a, b) => b.count - a.count).slice(0, 10);
        const labels = sortedData.map(item => item.adverse_event);
        const counts = sortedData.map(item => item.count);
        
        // Destroy existing chart if it exists
        if (topAEChart) {
            topAEChart.destroy();
        }
        
        topAEChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Count',
                    data: counts,
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Adverse Event'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating top adverse events chart:', error);
    }
}

/**
 * Create adverse events by severity chart
 * @param {Array} severityData - Adverse event severity data from the API
 */
function createAESeverityChart(severityData) {
    try {
        const ctx = document.getElementById('ae-severity-chart').getContext('2d');
        
        const labels = severityData.map(item => item.severity);
        const counts = severityData.map(item => item.count);
        
        // Define colors based on severity
        const colors = labels.map(severity => {
            switch(severity) {
                case 'Mild': return '#28a745';
                case 'Moderate': return '#ffc107';
                case 'Severe': return '#fd7e14';
                case 'Life-threatening': return '#dc3545';
                default: return '#6c757d';
            }
        });
        
        // Destroy existing chart if it exists
        if (aeSeverityChart) {
            aeSeverityChart.destroy();
        }
        
        aeSeverityChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating AE severity chart:', error);
    }
}

/**
 * Create adverse events by site chart
 * @param {Array} siteData - Adverse event site data from the API
 */
function createAEBySiteChart(siteData) {
    try {
        const ctx = document.getElementById('ae-by-site-chart').getContext('2d');
        
        // Sort and limit to top 10
        const sortedData = [...siteData].sort((a, b) => b.count - a.count);
        const labels = sortedData.map(item => item.site_id);
        const counts = sortedData.map(item => item.count);
        
        // Destroy existing chart if it exists
        if (aeBySiteChart) {
            aeBySiteChart.destroy();
        }
        
        aeBySiteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Adverse Events',
                    data: counts,
                    backgroundColor: '#fd7e14'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            text: 'Number of Adverse Events'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating AE by site chart:', error);
    }
}

/**
 * Create relationship to treatment chart
 * @param {Array} relationshipData - Adverse event relationship data from the API
 */
function createAERelationshipChart(relationshipData) {
    try {
        const ctx = document.getElementById('ae-relationship-chart').getContext('2d');
        
        const labels = relationshipData.map(item => item.relationship);
        const counts = relationshipData.map(item => item.count);
        
        // Define colors based on relationship
        const colors = labels.map(relationship => {
            switch(relationship) {
                case 'Definitely Related': return '#dc3545';
                case 'Probably Related': return '#fd7e14';
                case 'Possibly Related': return '#ffc107';
                case 'Unlikely Related': return '#6c757d';
                case 'Not Related': return '#28a745';
                default: return '#6c757d';
            }
        });
        
        // Destroy existing chart if it exists
        if (aeRelationshipChart) {
            aeRelationshipChart.destroy();
        }
        
        aeRelationshipChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating AE relationship chart:', error);
    }
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
 * @param {Array} labData - Lab results data from the API
 */
function createAbnormalLabRatesChart(labData) {
    try {
        const ctx = document.getElementById('abnormal-lab-rates-chart').getContext('2d');
        
        // Sort by abnormal rate
        const sortedData = [...labData].sort((a, b) => b.abnormal_rate - a.abnormal_rate);
        const labels = sortedData.map(item => item.test_name);
        const abnormalRates = sortedData.map(item => item.abnormal_rate * 100);
        
        // Destroy existing chart if it exists
        if (abnormalLabRatesChart) {
            abnormalLabRatesChart.destroy();
        }
        
        abnormalLabRatesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Abnormal Rate (%)',
                    data: abnormalRates,
                    backgroundColor: abnormalRates.map(rate => 
                        rate > 30 ? '#dc3545' : 
                        rate > 20 ? '#fd7e14' : 
                        rate > 10 ? '#ffc107' : '#28a745'
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Test Name'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Abnormal Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating abnormal lab rates chart:', error);
    }
}

/**
 * Populate lab results table with data
 * @param {Array} labData - Lab results data from the API
 */
function populateLabResultsTable(labData) {
    const tableBody = document.querySelector('#lab-results-table tbody');
    tableBody.innerHTML = '';
    
    // Sort by abnormal rate
    const sortedData = [...labData].sort((a, b) => b.abnormal_rate - a.abnormal_rate);
    
    sortedData.forEach(test => {
        const row = document.createElement('tr');
        
        const abnormalRate = test.abnormal_rate * 100;
        const abnormalRateClass = 
            abnormalRate > 30 ? 'text-danger' : 
            abnormalRate > 20 ? 'text-warning' : 
            abnormalRate > 10 ? 'text-info' : 'text-success';
        
        row.innerHTML = `
            <td>${test.test_name}</td>
            <td>${test.total}</td>
            <td>${test.total - test.abnormal_count}</td>
            <td>${test.abnormal_count}</td>
            <td class="${abnormalRateClass}">${abnormalRate.toFixed(1)}%</td>
        `;
        
        tableBody.appendChild(row);
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
 * @param {Array} siteData - Site performance data from the API
 */
function createSiteEnrollmentPerformanceChart(siteData) {
    try {
        const ctx = document.getElementById('site-enrollment-performance-chart').getContext('2d');
        
        // Sort by enrollment rate
        const sortedData = [...siteData].sort((a, b) => b.enrollment_rate - a.enrollment_rate);
        const labels = sortedData.map(site => site.site_id);
        const enrollmentRates = sortedData.map(site => site.enrollment_rate);
        
        // Destroy existing chart if it exists
        if (siteEnrollmentPerformanceChart) {
            siteEnrollmentPerformanceChart.destroy();
        }
        
        siteEnrollmentPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Enrollment Rate (patients/month)',
                    data: enrollmentRates,
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            text: 'Enrollment Rate (patients/month)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating site enrollment performance chart:', error);
    }
}

/**
 * Create site retention performance chart
 * @param {Array} siteData - Site performance data from the API
 */
function createSiteRetentionPerformanceChart(siteData) {
    try {
        const ctx = document.getElementById('site-retention-performance-chart').getContext('2d');
        
        // Sort by retention rate
        const sortedData = [...siteData].sort((a, b) => b.retention_rate - a.retention_rate);
        const labels = sortedData.map(site => site.site_id);
        const retentionRates = sortedData.map(site => site.retention_rate * 100);
        
        // Destroy existing chart if it exists
        if (siteRetentionPerformanceChart) {
            siteRetentionPerformanceChart.destroy();
        }
        
        siteRetentionPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Retention Rate (%)',
                    data: retentionRates,
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Site ID'
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Retention Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating site retention performance chart:', error);
    }
}

/**
 * Create protocol deviations chart
 * @param {Array} siteData - Site performance data from the API
 */
function createProtocolDeviationsChart(siteData) {
    try {
        const ctx = document.getElementById('protocol-deviations-chart').getContext('2d');
        
        // Sort by protocol deviations
        const sortedData = [...siteData].sort((a, b) => b.protocol_deviations - a.protocol_deviations);
        const labels = sortedData.map(site => site.site_id);
        const deviations = sortedData.map(site => site.protocol_deviations);
        
        // Destroy existing chart if it exists
        if (protocolDeviationsChart) {
            protocolDeviationsChart.destroy();
        }
        
        protocolDeviationsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Protocol Deviations',
                    data: deviations,
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            text: 'Number of Protocol Deviations'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating protocol deviations chart:', error);
    }
}

/**
 * Create query resolution time chart
 * @param {Array} siteData - Site performance data from the API
 */
function createQueryResolutionChart(siteData) {
    try {
        const ctx = document.getElementById('query-resolution-chart').getContext('2d');
        
        // Sort by query resolution time
        const sortedData = [...siteData].sort((a, b) => b.query_resolution_time - a.query_resolution_time);
        const labels = sortedData.map(site => site.site_id);
        const resolutionTimes = sortedData.map(site => site.query_resolution_time);
        
        // Destroy existing chart if it exists
        if (queryResolutionChart) {
            queryResolutionChart.destroy();
        }
        
        queryResolutionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Query Resolution Time (days)',
                    data: resolutionTimes,
                    backgroundColor: '#6f42c1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            text: 'Query Resolution Time (days)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating query resolution chart:', error);
    }
}

/**
 * Populate site performance table with data
 * @param {Array} siteData - Site performance data from the API
 */
function populateSitePerformanceTable(siteData) {
    const tableBody = document.querySelector('#site-performance-table tbody');
    tableBody.innerHTML = '';
    
    siteData.forEach(site => {
        const row = document.createElement('tr');
        
        // Calculate performance score (simple weighted average)
        const enrollmentScore = site.enrollment_rate / 5 * 40; // 40% weight, normalized to 5 patients/month
        const retentionScore = site.retention_rate * 100 * 0.4; // 40% weight
        const deviationScore = Math.max(0, 10 - site.protocol_deviations) * 1.5; // 15% weight, lower is better
        const queryScore = Math.max(0, 10 - site.query_resolution_time) * 0.5; // 5% weight, lower is better
        
        const performanceScore = Math.min(100, enrollmentScore + retentionScore + deviationScore + queryScore);
        
        let performanceClass;
        if (performanceScore >= 80) {
            performanceClass = 'text-success';
        } else if (performanceScore >= 60) {
            performanceClass = 'text-info';
        } else if (performanceScore >= 40) {
            performanceClass = 'text-warning';
        } else {
            performanceClass = 'text-danger';
        }
        
        row.innerHTML = `
            <td>${site.site_id}</td>
            <td>${site.country}</td>
            <td>${site.site_type}</td>
            <td>${site.experience_level}</td>
            <td>${site.enrollment_rate.toFixed(2)}</td>
            <td>${(site.retention_rate * 100).toFixed(1)}%</td>
            <td>${site.protocol_deviations}</td>
            <td>${site.query_resolution_time.toFixed(1)}</td>
            <td class="${performanceClass}">${performanceScore.toFixed(1)}</td>
        `;
        
        tableBody.appendChild(row);
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
            createAERiskChart(data.adverse_event_risk);
            
            // Populate site performance prediction
            populateSitePerformancePrediction(data.site_performance_prediction);
            
            // Populate timeline prediction
            populateTimelinePrediction(data.timeline_prediction);
        })
        .catch(error => {
            console.error('Error loading predictive insights data:', error);
        });
}

/**
 * Create dropout risk chart
 * @param {Object} riskData - Dropout risk data from the API
 */
function createDropoutRiskChart(riskData) {
    try {
        const ctx = document.getElementById('dropout-risk-chart').getContext('2d');
        
        // Prepare data
        const labels = ['High Risk', 'Medium Risk', 'Low Risk'];
        const counts = [riskData.high_risk_count, riskData.medium_risk_count, riskData.low_risk_count];
        
        // Destroy existing chart if it exists
        if (dropoutRiskChart) {
            dropoutRiskChart.destroy();
        }
        
        dropoutRiskChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#dc3545',  // High Risk
                        '#ffc107',  // Medium Risk
                        '#28a745'   // Low Risk
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} patients (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Populate high risk sites
        const highRiskSitesContainer = document.getElementById('high-risk-sites');
        highRiskSitesContainer.innerHTML = '';
        
        riskData.high_risk_sites.forEach(site => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-danger me-2 mb-2';
            badge.textContent = site;
            highRiskSitesContainer.appendChild(badge);
        });
    } catch (error) {
        console.error('Error creating dropout risk chart:', error);
    }
}

/**
 * Create adverse event risk chart
 * @param {Object} riskData - Adverse event risk data from the API
 */
function createAERiskChart(riskData) {
    try {
        const ctx = document.getElementById('ae-risk-chart').getContext('2d');
        
        // Prepare data
        const labels = ['High Risk', 'Medium Risk', 'Low Risk'];
        const counts = [riskData.high_risk_count, riskData.medium_risk_count, riskData.low_risk_count];
        
        // Destroy existing chart if it exists
        if (aeRiskChart) {
            aeRiskChart.destroy();
        }
        
        aeRiskChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#dc3545',  // High Risk
                        '#ffc107',  // Medium Risk
                        '#28a745'   // Low Risk
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} patients (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating AE risk chart:', error);
    }
}

/**
 * Populate site performance prediction
 * @param {Object} performanceData - Site performance prediction data from the API
 */
function populateSitePerformancePrediction(performanceData) {
    // Populate top performers
    const topPerformersContainer = document.getElementById('top-performers');
    topPerformersContainer.innerHTML = '';
    
    performanceData.top_performers.forEach(site => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success me-2 mb-2';
        badge.textContent = site;
        topPerformersContainer.appendChild(badge);
    });
    
    // Populate underperformers
    const underperformersContainer = document.getElementById('underperformers');
    underperformersContainer.innerHTML = '';
    
    performanceData.underperformers.forEach(site => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-danger me-2 mb-2';
        badge.textContent = site;
        underperformersContainer.appendChild(badge);
    });
}

/**
 * Populate timeline prediction
 * @param {Object} timelineData - Timeline prediction data from the API
 */
function populateTimelinePrediction(timelineData) {
    // Populate estimated completion date
    document.getElementById('estimated-completion-date').textContent = new Date(timelineData.estimated_completion_date).toLocaleDateString();
    
    // Populate delay risk
    const delayRiskElement = document.getElementById('delay-risk');
    delayRiskElement.textContent = timelineData.delay_risk;
    
    // Add color based on risk level
    if (timelineData.delay_risk === 'High') {
        delayRiskElement.className = 'text-danger';
    } else if (timelineData.delay_risk === 'Medium') {
        delayRiskElement.className = 'text-warning';
    } else {
        delayRiskElement.className = 'text-success';
    }
    
    // Populate critical phases
    const criticalPhasesContainer = document.getElementById('critical-phases');
    criticalPhasesContainer.innerHTML = '';
    
    timelineData.critical_phases.forEach(phase => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-warning me-2 mb-2';
        badge.textContent = phase;
        criticalPhasesContainer.appendChild(badge);
    });
}
