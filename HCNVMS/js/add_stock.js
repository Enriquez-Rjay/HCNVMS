
 document.addEventListener('DOMContentLoaded', () => {
     const vaccineSelect = document.getElementById('stockVaccine');
     const form = document.getElementById('addStockForm');
     const expirationInput = document.getElementById('stockExpiration');

     if (!form || !vaccineSelect) {
         return;
     }

     if (expirationInput) {
         expirationInput.min = new Date().toISOString().split('T')[0];
     }

     loadVaccineOptions(vaccineSelect);

     form.addEventListener('submit', handleSubmit);
 });

 async function loadVaccineOptions(selectEl) {
     try {
         const vaccines = await apiRequest('vaccines.php');
         selectEl.innerHTML = '<option value="" disabled selected>Select vaccine</option>';
         (Array.isArray(vaccines) ? vaccines : []).forEach(v => {
             const opt = document.createElement('option');
             opt.value = v.id;
             opt.textContent = `${v.vaccine_name} (${v.category || 'General'})`;
             selectEl.appendChild(opt);
         });
     } catch (error) {
         alert('Unable to load vaccine list.');
     }
 }

 async function handleSubmit(event) {
     event.preventDefault();

     const vaccineId = document.getElementById('stockVaccine').value;
     const quantity = Number(document.getElementById('stockQuantity').value);
     const batch = document.getElementById('stockBatch').value.trim();
     const expiration = document.getElementById('stockExpiration').value;

     if (!vaccineId || !batch || !expiration || Number.isNaN(quantity)) {
         alert('Please complete all required fields.');
         return;
     }

     if (quantity < 1) {
         alert('Quantity must be at least 1.');
         return;
     }

     const expDate = new Date(expiration);
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     if (expDate <= today) {
         alert('Expiration date must be in the future.');
         return;
     }

     const payload = {
         vaccine_id: Number(vaccineId),
         quantity,
         batch_number: batch,
         expiration_date: expiration,
     };

     try {
         await apiRequest('inventory.php', 'POST', payload);
         if (typeof showNotification === 'function') {
             showNotification('Stock added successfully');
         } else {
             alert('Stock added successfully');
         }
         window.location.href = 'inventory.html';
     } catch (error) {
         // apiRequest already alerted the error if needed
     }
 }

