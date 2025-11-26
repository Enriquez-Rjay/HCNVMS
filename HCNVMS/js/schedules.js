/**
 * Vaccination Schedules JavaScript
 */

let allSchedules = [];
let currentScheduleId = null;

// Load schedules on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSchedules();
});

/**
 * Load schedules
 */
async function loadSchedules() {
    try {
        const status = document.getElementById('statusFilter').value;
        const endpoint = status ? `schedules.php?status=${status}` : 'schedules.php';
        allSchedules = await apiRequest(endpoint);
        displaySchedules(allSchedules);
    } catch (error) {
        document.getElementById('schedulesTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading schedules</td></tr>';
    }
}

/**
 * Display schedules in table
 */
function displaySchedules(schedules) {
    const tbody = document.getElementById('schedulesTableBody');
    
    if (schedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No schedules found</td></tr>';
        return;
    }
    
    tbody.innerHTML = schedules.map(schedule => `
        <tr>
            <td>${schedule.id}</td>
            <td>${schedule.first_name} ${schedule.last_name}</td>
            <td>${schedule.vaccine_name}</td>
            <td>${formatDate(schedule.scheduled_date)}</td>
            <td>${getStatusBadge(schedule.status)}</td>
            <td>${formatDate(schedule.administered_date)}</td>
            <td>${schedule.administered_by || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editSchedule(${schedule.id})">Update</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Edit schedule
 */
async function editSchedule(id) {
    try {
        const schedule = allSchedules.find(s => s.id === id);
        if (!schedule) {
            showNotification('Schedule not found', 'error');
            return;
        }
        
        currentScheduleId = id;
        document.getElementById('scheduleId').value = id;
        document.getElementById('scheduledDate').value = schedule.scheduled_date;
        document.getElementById('scheduleStatus').value = schedule.status;
        document.getElementById('administeredDate').value = schedule.administered_date || '';
        document.getElementById('administeredBy').value = schedule.administered_by || '';
        document.getElementById('batchNumber').value = schedule.batch_number || '';
        document.getElementById('scheduleNotes').value = schedule.notes || '';
        
        toggleAdministeredFields();
        document.getElementById('scheduleModal').classList.add('show');
    } catch (error) {
        showNotification('Error loading schedule data', 'error');
    }
}

/**
 * Toggle administered fields based on status
 */
function toggleAdministeredFields() {
    const status = document.getElementById('scheduleStatus').value;
    const showFields = status === 'Completed';
    
    document.getElementById('administeredDateGroup').style.display = showFields ? 'flex' : 'none';
    document.getElementById('administeredByGroup').style.display = showFields ? 'flex' : 'none';
    document.getElementById('batchNumberGroup').style.display = showFields ? 'flex' : 'none';
    
    if (showFields) {
        document.getElementById('administeredBy').required = true;
        if (!document.getElementById('administeredDate').value) {
            document.getElementById('administeredDate').value = new Date().toISOString().split('T')[0];
        }
    } else {
        document.getElementById('administeredBy').required = false;
    }
}

/**
 * Close schedule modal
 */
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('show');
    currentScheduleId = null;
    document.getElementById('scheduleForm').reset();
}

/**
 * Update schedule
 */
async function updateSchedule(event) {
    event.preventDefault();
    
    const data = {
        scheduled_date: document.getElementById('scheduledDate').value,
        status: document.getElementById('scheduleStatus').value,
        administered_date: document.getElementById('administeredDate').value || null,
        administered_by: document.getElementById('administeredBy').value || null,
        batch_number: document.getElementById('batchNumber').value || null,
        notes: document.getElementById('scheduleNotes').value || null
    };
    
    try {
        await apiRequest(`schedules.php?id=${currentScheduleId}`, 'PUT', data);
        showNotification('Schedule updated successfully');
        closeScheduleModal();
        loadSchedules();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('scheduleModal');
    if (event.target === modal) {
        closeScheduleModal();
    }
}