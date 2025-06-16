// Main JavaScript file for Engineering Calculator

// Initialize MathJax configuration
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    }
};

// Common utility functions

// Format numbers with proper precision
function formatNumber(value, precision = 4) {
    if (typeof value !== 'number') return value;

    // Check if the number is an integer
    if (Number.isInteger(value)) return value.toString();

    // Format floating point number
    return value.toPrecision(precision).replace(/\.?0+$/, '');
}

// Parse scientific notation
function parseScientificNotation(text) {
    // Match patterns like 1.23e-4 or 5.67E+8
    const regex = /^([-+]?\d*\.?\d+)[eE]([-+]?\d+)$/;
    const match = text.match(regex);

    if (match) {
        const base = parseFloat(match[1]);
        const exponent = parseInt(match[2], 10);
        return base * Math.pow(10, exponent);
    }

    return parseFloat(text);
}

// Check if a string is a valid number
function isNumeric(str) {
    if (typeof str === 'number') return true;
    if (typeof str !== 'string') return false;

    return !isNaN(str) && !isNaN(parseFloat(str));
}

// Convert a string to a number if possible
function toNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;

    // Try to convert to number
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
}

// Deep clone an object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Generate a unique ID
function generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

// Convert data object to CSV string
function objectToCSV(data) {
    if (!data || !data.length) return '';

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [];
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Quote strings that contain commas
            return typeof value === 'string' && value.includes(',') ?
                `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// Parse CSV string to array of objects
function csvToObjects(csv) {
    if (!csv) return [];

    const lines = csv.split('\n');
    const result = [];

    // Get headers
    const headers = lines[0].split(',').map(h => h.trim());

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const obj = {};
        const currentLine = lines[i].split(',');

        for (let j = 0; j < headers.length; j++) {
            let value = currentLine[j].trim();

            // Convert to number if possible
            if (isNumeric(value)) {
                value = parseFloat(value);
            }

            obj[headers[j]] = value;
        }

        result.push(obj);
    }

    return result;
}

// Show a notification
function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
    notificationDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(notificationDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        notificationDiv.classList.remove('show');
        setTimeout(() => {
            notificationDiv.remove();
        }, 300);
    }, 5000);
}

// Convert degrees to radians
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Handle AJAX errors
function handleAjaxError(error) {
    console.error('AJAX Error:', error);
    showNotification('An error occurred. Please try again.', 'danger');
}

// Document ready handler
$(document).ready(function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Initialize Bootstrap popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });
});