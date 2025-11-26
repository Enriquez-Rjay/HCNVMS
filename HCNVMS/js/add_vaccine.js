// Add Vaccine standalone page logic

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addVaccineForm');
    if (!form) return;

    form.addEventListener('submit', handleAddVaccineSubmit);
});

async function handleAddVaccineSubmit(event) {
    event.preventDefault();

    const data = {
        vaccine_name: document.getElementById('vaccineName').value,
        description: document.getElementById('vaccineDescription').value || null,
        recommended_age_weeks: parseInt(document.getElementById('recommendedAgeWeeks').value),
        dose_number: parseInt(document.getElementById('doseNumber').value),
        is_mandatory: document.getElementById('isMandatory').value === '1'
    };

    try {
        await apiRequest('vaccines.php', 'POST', data);
        alert('Vaccine added successfully');
        window.location.href = 'vaccines.html';
    } catch (error) {
        alert(error.message || 'Unable to add vaccine');
    }
}
