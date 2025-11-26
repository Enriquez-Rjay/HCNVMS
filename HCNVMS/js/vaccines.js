/**
 * Vaccines Management JavaScript
 */

let currentVaccineId = null;
let allVaccines = [];

// Load vaccines on page load and wire up search for tables that use this script
document.addEventListener('DOMContentLoaded', function() {
    // Only load vaccines dynamically if the dynamic vaccines table is present
    if (document.getElementById('vaccinesTableBody')) {
        loadVaccines();
    }

    // Generic search for any table on this page using .data-table
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const term = this.value.toLowerCase();
            const rows = document.querySelectorAll('.data-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
});

/**
 * Load all vaccines
 */
async function loadVaccines() {
    try {
        allVaccines = await apiRequest('vaccines.php');
        displayVaccines(allVaccines);
    } catch (error) {
        // On error, just show a neutral empty state instead of an error message on screen
        const tbody = document.getElementById('vaccinesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No vaccines found</td></tr>';
        }
    }
}

/**
 * Display vaccines in table
 */
function displayVaccines(vaccines) {
    const tbody = document.getElementById('vaccinesTableBody');
    
    if (vaccines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No vaccines found</td></tr>';
        return;
    }
    
    tbody.innerHTML = vaccines.map(vaccine => `
        <tr>
            <td>${vaccine.id}</td>
            <td><strong>${vaccine.vaccine_name}</strong></td>
            <td>${vaccine.description || '-'}</td>
            <td>${vaccine.recommended_age_weeks} weeks</td>
            <td>${vaccine.dose_number}</td>
            <td>${vaccine.is_mandatory ? 'Yes' : 'No'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editVaccine(${vaccine.id})">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteVaccine(${vaccine.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open vaccine modal for adding
 */
function openVaccineModal() {
    currentVaccineId = null;
    document.getElementById('vaccineModalTitle').textContent = 'Add New Vaccine';
    document.getElementById('vaccineForm').reset();
    document.getElementById('vaccineModal').classList.add('show');
}

/**
 * Close vaccine modal
 */
function closeVaccineModal() {
    document.getElementById('vaccineModal').classList.remove('show');
    currentVaccineId = null;
    document.getElementById('vaccineForm').reset();
}

/**
 * Edit vaccine
 */
async function editVaccine(id) {
    try {
        const vaccine = await apiRequest(`vaccines.php?id=${id}`);
        currentVaccineId = id;
        
        document.getElementById('vaccineModalTitle').textContent = 'Edit Vaccine';
        document.getElementById('vaccineName').value = vaccine.vaccine_name;
        document.getElementById('vaccineDescription').value = vaccine.description || '';
        document.getElementById('recommendedAgeWeeks').value = vaccine.recommended_age_weeks;
        document.getElementById('doseNumber').value = vaccine.dose_number;
        document.getElementById('isMandatory').value = vaccine.is_mandatory ? '1' : '0';
        
        document.getElementById('vaccineModal').classList.add('show');
    } catch (error) {
        showNotification('Error loading vaccine data', 'error');
    }
}

/**
 * Save vaccine (create or update)
 */
async function saveVaccine(event) {
    event.preventDefault();
    
    const data = {
        vaccine_name: document.getElementById('vaccineName').value,
        description: document.getElementById('vaccineDescription').value || null,
        recommended_age_weeks: parseInt(document.getElementById('recommendedAgeWeeks').value),
        dose_number: parseInt(document.getElementById('doseNumber').value),
        is_mandatory: document.getElementById('isMandatory').value === '1'
    };
    
    try {
        if (currentVaccineId) {
            // Update
            await apiRequest(`vaccines.php?id=${currentVaccineId}`, 'PUT', data);
            showNotification('Vaccine updated successfully');
        } else {
            // Create
            await apiRequest('vaccines.php', 'POST', data);
            showNotification('Vaccine added successfully');
        }
        
        closeVaccineModal();
        loadVaccines();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

/**
 * Delete vaccine
 */
async function deleteVaccine(id) {
    if (!confirmAction('Are you sure you want to delete this vaccine? This will also delete all associated schedules.')) {
        return;
    }
    
    try {
        await apiRequest(`vaccines.php?id=${id}`, 'DELETE');
        showNotification('Vaccine deleted successfully');
        loadVaccines();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('vaccineModal');
    if (event.target === modal) {
        closeVaccineModal();
    }
};