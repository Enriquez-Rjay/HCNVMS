let inventoryCache = [];
let vaccinesOptions = [];

document.addEventListener('DOMContentLoaded', () => {
	const tableBody = document.getElementById('inventoryTableBody');
	if (!tableBody) return;

	const addBtn = document.getElementById('btnAddStock');
	const cancelBtn = document.getElementById('cancelStockForm');
	const closeBtn = document.getElementById('closeStockForm');
	const form = document.getElementById('stockForm');
	const searchInput = document.getElementById('inventorySearch');
	const expirationInput = document.getElementById('stockExpiration');
	const moreBtn = document.getElementById('toggleStockDetails');
	const morePanel = document.getElementById('stockAdditionalDetails');

	addBtn?.addEventListener('click', () => toggleStockForm());
	cancelBtn?.addEventListener('click', () => toggleStockForm(false));
	closeBtn?.addEventListener('click', () => toggleStockForm(false));
	form?.addEventListener('submit', handleStockSubmit);
	searchInput?.addEventListener('input', () => renderInventory(filterInventory(searchInput.value)));

	moreBtn?.addEventListener('click', () => {
		const isOpen = morePanel?.classList.contains('show');
		setCollapsibleState(morePanel, !isOpen);
		moreBtn.textContent = isOpen ? 'Add More Details' : 'Hide Additional Details';
	});

	if (expirationInput) {
		expirationInput.min = new Date().toISOString().split('T')[0];
	}

	loadVaccinesOptions();
	loadInventory();
});

async function loadVaccinesOptions() {
	try {
		const response = await apiRequest('vaccines.php');
		vaccinesOptions = Array.isArray(response) ? response : [];
		const select = document.getElementById('stockVaccine');
		if (!select) return;
		select.innerHTML = '<option value="">-- Select vaccine --</option>';
		vaccinesOptions.forEach((vaccine) => {
			const option = document.createElement('option');
			option.value = vaccine.id;
			option.textContent = `${vaccine.vaccine_name} (${vaccine.category || 'General'})`;
			select.appendChild(option);
		});
	} catch (error) {
		setStockFormStatus('error', 'Unable to load vaccine list.');
	}
}

async function loadInventory() {
	try {
		const response = await apiRequest('inventory.php');
		inventoryCache = Array.isArray(response) ? response : [];
		renderInventory(inventoryCache);
	} catch (error) {
		setInventoryMessage('Unable to load inventory.');
	}
}

function renderInventory(records) {
	const tbody = document.getElementById('inventoryTableBody');
	if (!tbody) return;

	if (!records || records.length === 0) {
		setInventoryMessage('No inventory records found.');
		return;
	}

	tbody.innerHTML = records
		.map(
			(record) => `
        <tr>
            <td>${escapeHtml(record.vaccine_name)}</td>
            <td>${escapeHtml(record.category || '-')}</td>
            <td>${record.quantity}</td>
            <td>${escapeHtml(record.batch_number)}</td>
            <td>${formatDate(record.expiration_date)}</td>
            <td>${formatDate(record.created_at)}</td>
        </tr>
    `
		)
		.join('');
}

function setInventoryMessage(message) {
	const tbody = document.getElementById('inventoryTableBody');
	if (!tbody) return;
	tbody.innerHTML = `<tr><td colspan="6" class="text-center">${message}</td></tr>`;
}

function filterInventory(term) {
	const text = term.toLowerCase();
	return inventoryCache.filter((record) =>
		[record.vaccine_name, record.category, record.batch_number]
			.join(' ')
			.toLowerCase()
			.includes(text)
	);
}

function toggleStockForm(forceOpen) {
	const panel = document.getElementById('stockFormPanel');
	const addBtn = document.getElementById('btnAddStock');
	const form = document.getElementById('stockForm');
	const shouldOpen =
		typeof forceOpen === 'boolean' ? forceOpen : !panel?.classList.contains('show');

	setCollapsibleState(panel, shouldOpen);
	addBtn.textContent = shouldOpen ? 'Close Form' : 'Add New Stock';
	panel?.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

	if (!shouldOpen) {
		form?.reset();
		setStockFormStatus();
		const morePanel = document.getElementById('stockAdditionalDetails');
		const moreBtn = document.getElementById('toggleStockDetails');
		setCollapsibleState(morePanel, false);
		if (moreBtn) moreBtn.textContent = 'Add More Details';
	}
}

async function handleStockSubmit(event) {
	event.preventDefault();
	const payload = collectStockForm();
	if (!payload) return;

	try {
		const result = await apiRequest('inventory.php', 'POST', payload);
		showNotification('Successfully added!');
		toggleStockForm(false);
		loadInventory();
		displayStockConfirmation(result.inventory);
	} catch (error) {
		setStockFormStatus('error', error.message || 'Unable to save stock record.');
	}
}

function collectStockForm() {
	const vaccineId = document.getElementById('stockVaccine').value;
	const quantity = Number(document.getElementById('stockQuantity').value);
	const batch = document.getElementById('stockBatch').value.trim();
	const expiration = document.getElementById('stockExpiration').value;

	if (!vaccineId || !batch || !expiration || Number.isNaN(quantity)) {
		setStockFormStatus('error', 'Please complete all required fields.');
		return null;
	}

	if (quantity < 1) {
		setStockFormStatus('error', 'Quantity must be at least 1.');
		return null;
	}

	const expDate = new Date(expiration);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (expDate <= today) {
		setStockFormStatus('error', 'Expiration date must be in the future.');
		return null;
	}

	return {
		vaccine_id: Number(vaccineId),
		quantity,
		batch_number: batch,
		expiration_date: expiration,
	};
}

function setStockFormStatus(type = '', message = '') {
	const statusBox = document.getElementById('stockFormStatus');
	if (!statusBox) return;
	statusBox.textContent = message;
	statusBox.className = type ? `form-status show ${type}` : 'form-status';
}

function displayStockConfirmation(record) {
	const card = document.getElementById('stockConfirmation');
	if (!card || !record) return;

	card.innerHTML = `
        <h4>New stock added</h4>
        <p><strong>${escapeHtml(record.vaccine_name)}</strong> (${escapeHtml(record.category || 'General')})</p>
        <ul>
            <li>Quantity: ${record.quantity}</li>
            <li>Batch #: ${escapeHtml(record.batch_number)}</li>
            <li>Expires: ${formatDate(record.expiration_date)}</li>
        </ul>
    `;
	card.hidden = false;
}

function setCollapsibleState(element, open) {
	if (!element) return;
	element.classList.toggle('show', open);
	element.style.maxHeight = open ? `${element.scrollHeight}px` : '';
}

function escapeHtml(value) {
	return (value ?? '').toString().replace(/[&<>"']/g, (match) => {
		const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
		return map[match];
	});
}

