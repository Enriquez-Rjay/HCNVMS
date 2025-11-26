/**
 * Newborns Management JavaScript
 */

let currentNewbornId = null;
let allNewborns = [];

// Load newborns on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNewborns();

    var contactInput = document.getElementById('contactNumber');
    if (contactInput) {
        contactInput.addEventListener('input', function () {
            var digits = this.value.replace(/\D/g, '');
            if (digits.length > 11) {
                digits = digits.slice(0, 11);
            }
            this.value = digits;
        });
    }
});

/**
 * Load all newborns
 */
async function loadNewborns() {
    try {
        allNewborns = await apiRequest('newborns.php');
        displayNewborns(allNewborns);
    } catch (error) {
        document.getElementById('newbornsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading newborns</td></tr>';
    }
}

/**
 * Display newborns in table
 */
function displayNewborns(newborns) {
    const tbody = document.getElementById('newbornsTableBody');
    
    if (newborns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No newborns found</td></tr>';
        return;
    }
    
    tbody.innerHTML = newborns.map(newborn => `
        <tr>
            <td>${newborn.id}</td>
            <td>${newborn.first_name} ${newborn.last_name}</td>
            <td>${formatDate(newborn.date_of_birth)}</td>
            <td>${newborn.gender}</td>
            <td>${newborn.mother_name}</td>
            <td>${newborn.contact_number || '-'}</td>
            <td>${formatDate(newborn.registration_date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editNewborn(${newborn.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNewborn(${newborn.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Search newborns
 */
function searchNewborns() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayNewborns(allNewborns);
        return;
    }
    
    const filtered = allNewborns.filter(newborn => 
        newborn.first_name.toLowerCase().includes(searchTerm) ||
        newborn.last_name.toLowerCase().includes(searchTerm) ||
        newborn.mother_name.toLowerCase().includes(searchTerm) ||
        (newborn.contact_number && newborn.contact_number.includes(searchTerm))
    );
    
    displayNewborns(filtered);
}

/**
 * Open newborn modal for adding
 */
function openNewbornModal() {
    currentNewbornId = null;
    document.getElementById('modalTitle').textContent = 'Add New Newborn';
    document.getElementById('newbornForm').reset();
    document.getElementById('newbornModal').classList.add('show');
}

/**
 * Close newborn modal
 */
function closeNewbornModal() {
    document.getElementById('newbornModal').classList.remove('show');
    currentNewbornId = null;
    document.getElementById('newbornForm').reset();
}

/**
 * Edit newborn
 */
async function editNewborn(id) {
    try {
        const newborn = await apiRequest(`newborns.php?id=${id}`);
        currentNewbornId = id;
        
        document.getElementById('modalTitle').textContent = 'Edit Newborn';
        document.getElementById('firstName').value = newborn.first_name;
        document.getElementById('lastName').value = newborn.last_name;
        document.getElementById('dateOfBirth').value = newborn.date_of_birth;
        document.getElementById('gender').value = newborn.gender;
        document.getElementById('weightAtBirth').value = newborn.weight_at_birth || '';
        document.getElementById('motherName').value = newborn.mother_name;
        document.getElementById('fatherName').value = newborn.father_name || '';
        document.getElementById('contactNumber').value = newborn.contact_number || '';
        document.getElementById('address').value = newborn.address || '';
        
        document.getElementById('newbornModal').classList.add('show');
    } catch (error) {
        showNotification('Error loading newborn data', 'error');
    }
}

/**
 * Save newborn (create or update)
 */
async function saveNewborn(event) {
    event.preventDefault();
    
    const contactInput = document.getElementById('contactNumber');
    let contactValue = contactInput ? contactInput.value.trim().replace(/\D/g, '') : '';
    if (contactValue && contactValue.length !== 11) {
        alert('Contact number must be exactly 11 digits.');
        return;
    }
    
    const data = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        weight_at_birth: document.getElementById('weightAtBirth').value || null,
        mother_name: document.getElementById('motherName').value,
        father_name: document.getElementById('fatherName').value || null,
        contact_number: contactValue || null,
        address: document.getElementById('address').value || null
    };
    
    try {
        if (currentNewbornId) {
            // Update
            await apiRequest(`newborns.php?id=${currentNewbornId}`, 'PUT', data);
            showNotification('Newborn updated successfully');
        } else {
            // Create
            await apiRequest('newborns.php', 'POST', data);
            showNotification('Newborn registered successfully');
        }
        
        closeNewbornModal();
        loadNewborns();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

/**
 * Delete newborn
 */
async function deleteNewborn(id) {
    if (!confirmAction('Are you sure you want to delete this newborn? This will also delete all associated vaccination schedules and records.')) {
        return;
    }
    
    try {
        await apiRequest(`newborns.php?id=${id}`, 'DELETE');
        showNotification('Newborn deleted successfully');
        loadNewborns();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('newbornModal');
    if (event.target === modal) {
        closeNewbornModal();
    }
}