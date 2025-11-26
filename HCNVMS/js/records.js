/**
 * Vaccination Records JavaScript
 */

let allRecords = [];

// Load records on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
});

/**
 * Load all records
 */
async function loadRecords() {
    try {
        allRecords = await apiRequest('records.php');
        displayRecords(allRecords);
    } catch (error) {
        document.getElementById('recordsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading records</td></tr>';
    }
}

/**
 * Display records in table
 */
function displayRecords(records) {
    const tbody = document.getElementById('recordsTableBody');
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${record.id}</td>
            <td>${record.first_name} ${record.last_name}</td>
            <td>${record.vaccine_name}</td>
            <td>${formatDate(record.administered_date)}</td>
            <td>${record.administered_by}</td>
            <td>${record.batch_number || '-'}</td>
            <td>${record.side_effects || '-'}</td>
            <td>${record.notes || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editRecord(${record.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Search records
 */
function searchRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayRecords(allRecords);
        return;
    }
    
    const filtered = allRecords.filter(record => 
        `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchTerm) ||
        record.vaccine_name.toLowerCase().includes(searchTerm)
    );
    
    displayRecords(filtered);
}

/**
 * Edit record (simple prompt-based editor)
 */
async function editRecord(id) {
    try {
        const record = await apiRequest(`records.php?id=${id}`);

        const administeredDate = prompt('Administered Date (YYYY-MM-DD):', record.administered_date || '');
        if (administeredDate === null) return;

        const administeredBy = prompt('Administered By:', record.administered_by || '');
        if (administeredBy === null) return;

        const batchNumber = prompt('Batch Number:', record.batch_number || '');
        if (batchNumber === null) return;

        const sideEffects = prompt('Side Effects:', record.side_effects || '');
        if (sideEffects === null) return;

        const notes = prompt('Notes:', record.notes || '');
        if (notes === null) return;

        await apiRequest(`records.php?id=${id}`, 'PUT', {
            administered_date: administeredDate,
            administered_by: administeredBy,
            batch_number: batchNumber || null,
            side_effects: sideEffects || null,
            notes: notes || null
        });

        showNotification('Vaccination record updated successfully');
        loadRecords();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

/**
 * Delete record
 */
async function deleteRecord(id) {
    if (!confirmAction('Are you sure you want to delete this vaccination record?')) {
        return;
    }

    try {
        await apiRequest(`records.php?id=${id}`, 'DELETE');
        showNotification('Vaccination record deleted successfully');
        loadRecords();
    } catch (error) {
        // Error already handled in apiRequest
    }
}