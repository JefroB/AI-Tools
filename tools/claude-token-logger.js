/**
 * Claude Token Logger
 * A simple utility to track token usage during Claude/Cline development sessions.
 */

// Initialize data storage
let tokenLogs = [];

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Load saved data
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update the reports view
    updateReports();
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding tab content
            const tabName = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Update reports if viewing that tab
            if (tabName === 'view') {
                updateReports();
            }
        });
    });
    
    // Form submission
    document.getElementById('token-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTokenUsage();
    });
    
    // Export data button
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Clear data button
    document.getElementById('clear-data').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all token usage data? This cannot be undone.')) {
            clearData();
        }
    });
}

/**
 * Save token usage data from the form
 */
function saveTokenUsage() {
    // Get form values
    const date = document.getElementById('date').value;
    const taskType = document.getElementById('task-type').value;
    const description = document.getElementById('description').value;
    const files = document.getElementById('files').value;
    const promptTokens = parseInt(document.getElementById('prompt-tokens').value);
    const completionTokens = parseInt(document.getElementById('completion-tokens').value);
    const interactions = parseInt(document.getElementById('interactions').value);
    const notes = document.getElementById('notes').value;
    
    // Create log entry
    const logEntry = {
        id: Date.now(), // Use timestamp as unique ID
        date,
        taskType,
        description,
        files: files ? files.split(',').map(file => file.trim()) : [],
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        interactions,
        notes,
        timestamp: new Date().toISOString()
    };
    
    // Add to logs array
    tokenLogs.push(logEntry);
    
    // Save to localStorage
    saveData();
    
    // Show success message
    alert('Token usage saved successfully!');
    
    // Reset form
    document.getElementById('token-form').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Update reports
    updateReports();
}

/**
 * Save data to localStorage
 */
function saveData() {
    localStorage.setItem('claudeTokenLogs', JSON.stringify(tokenLogs));
}

/**
 * Load data from localStorage
 */
function loadData() {
    const savedData = localStorage.getItem('claudeTokenLogs');
    if (savedData) {
        tokenLogs = JSON.parse(savedData);
    }
}

/**
 * Clear all data
 */
function clearData() {
    tokenLogs = [];
    saveData();
    updateReports();
}

/**
 * Export data as JSON file
 */
function exportData() {
    // Create export object with metadata
    const exportObj = {
        exportDate: new Date().toISOString(),
        tokenLogs
    };
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(exportObj, null, 2);
    
    // Create download link
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-token-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Update the reports view with current data
 */
function updateReports() {
    if (tokenLogs.length === 0) {
        // No data yet
        document.getElementById('total-prompt-tokens').textContent = '0';
        document.getElementById('total-completion-tokens').textContent = '0';
        document.getElementById('total-tokens').textContent = '0';
        document.getElementById('estimated-cost').textContent = '$0.00';
        document.getElementById('logs-table').querySelector('tbody').innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    
    // Calculate summary metrics
    const totalPromptTokens = tokenLogs.reduce((sum, log) => sum + log.promptTokens, 0);
    const totalCompletionTokens = tokenLogs.reduce((sum, log) => sum + log.completionTokens, 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    
    // Calculate estimated cost (using Claude 3 Opus pricing as of April 2025)
    const promptCost = (totalPromptTokens / 1000) * 0.03; // $0.03 per 1K tokens
    const completionCost = (totalCompletionTokens / 1000) * 0.15; // $0.15 per 1K tokens
    const totalCost = promptCost + completionCost;
    
    // Update summary cards
    document.getElementById('total-prompt-tokens').textContent = totalPromptTokens.toLocaleString();
    document.getElementById('total-completion-tokens').textContent = totalCompletionTokens.toLocaleString();
    document.getElementById('total-tokens').textContent = totalTokens.toLocaleString();
    document.getElementById('estimated-cost').textContent = `$${totalCost.toFixed(2)}`;
    
    // Update logs table
    updateLogsTable();
    
    // Update charts
    updateCharts();
}

/**
 * Update the logs table with current data
 */
function updateLogsTable() {
    const tbody = document.getElementById('logs-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    // Sort logs by date (newest first)
    const sortedLogs = [...tokenLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display the most recent 10 logs
    const recentLogs = sortedLogs.slice(0, 10);
    
    recentLogs.forEach(log => {
        const row = document.createElement('tr');
        
        // Format date
        const dateObj = new Date(log.date);
        const formattedDate = dateObj.toLocaleDateString();
        
        // Create row cells
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${log.taskType}</td>
            <td>${log.description}</td>
            <td>${log.promptTokens.toLocaleString()}</td>
            <td>${log.completionTokens.toLocaleString()}</td>
            <td>${log.totalTokens.toLocaleString()}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Update charts with current data
 */
function updateCharts() {
    updateTaskTypeChart();
    updateTimeChart();
}

/**
 * Update the task type chart
 */
function updateTaskTypeChart() {
    // Get task types and calculate token usage for each
    const taskTypes = {};
    
    tokenLogs.forEach(log => {
        if (!taskTypes[log.taskType]) {
            taskTypes[log.taskType] = {
                promptTokens: 0,
                completionTokens: 0
            };
        }
        
        taskTypes[log.taskType].promptTokens += log.promptTokens;
        taskTypes[log.taskType].completionTokens += log.completionTokens;
    });
    
    // Prepare chart data
    const labels = Object.keys(taskTypes);
    const promptData = labels.map(type => taskTypes[type].promptTokens);
    const completionData = labels.map(type => taskTypes[type].completionTokens);
    
    // Chart colors
    const colors = {
        prompt: 'rgba(54, 162, 235, 0.7)',
        completion: 'rgba(255, 99, 132, 0.7)'
    };
    
    // Get chart canvas
    const ctx = document.getElementById('task-type-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.taskTypeChart) {
        window.taskTypeChart.destroy();
    }
    
    // Create new chart
    window.taskTypeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Prompt Tokens',
                    data: promptData,
                    backgroundColor: colors.prompt,
                    borderColor: colors.prompt,
                    borderWidth: 1
                },
                {
                    label: 'Completion Tokens',
                    data: completionData,
                    backgroundColor: colors.completion,
                    borderColor: colors.completion,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Update the time chart
 */
function updateTimeChart() {
    // Group logs by date
    const dateGroups = {};
    
    tokenLogs.forEach(log => {
        if (!dateGroups[log.date]) {
            dateGroups[log.date] = {
                promptTokens: 0,
                completionTokens: 0
            };
        }
        
        dateGroups[log.date].promptTokens += log.promptTokens;
        dateGroups[log.date].completionTokens += log.completionTokens;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort();
    
    // Prepare chart data
    const labels = sortedDates.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString();
    });
    
    const promptData = sortedDates.map(date => dateGroups[date].promptTokens);
    const completionData = sortedDates.map(date => dateGroups[date].completionTokens);
    
    // Chart colors
    const colors = {
        prompt: 'rgba(54, 162, 235, 0.7)',
        completion: 'rgba(255, 99, 132, 0.7)'
    };
    
    // Get chart canvas
    const ctx = document.getElementById('time-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.timeChart) {
        window.timeChart.destroy();
    }
    
    // Create new chart
    window.timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Prompt Tokens',
                    data: promptData,
                    backgroundColor: colors.prompt,
                    borderColor: colors.prompt,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Completion Tokens',
                    data: completionData,
                    backgroundColor: colors.completion,
                    borderColor: colors.completion,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
