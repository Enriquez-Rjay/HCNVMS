/**
 * Health Center New-born Vaccination Management System
 * Common JavaScript Functions
 */

// Base URL for API endpoints (relative to HTML pages)
// HTML files are in /html, PHP APIs are in /php, so use ../php
const API_BASE_URL = '../php';

/**
 * Make API request
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        const rawText = await response.text();

        let result = null;
        if (rawText) {
            try {
                result = JSON.parse(rawText);
            } catch (parseError) {
                console.error('Non-JSON response from API:', rawText);
                throw new Error('Invalid server response. Please contact the administrator.');
            }
        }
        
        if (!response.ok) {
            const message = (result && result.message) ? result.message : `Request failed with status ${response.status}`;
            throw new Error(message);
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        alert('Error: ' + error.message);
        throw error;
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const statusClass = `status-${status.toLowerCase()}`;
    return `<span class="status-badge ${statusClass}">${status}</span>`;
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    // Simple alert for now - can be enhanced with a toast notification system
    alert(message);
}

/**
 * Confirm action
 */
function confirmAction(message) {
    return confirm(message);
}