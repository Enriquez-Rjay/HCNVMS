let usersCache = [];

document.addEventListener('DOMContentLoaded', () => {
	const tableBody = document.getElementById('usersTableBody');
	if (!tableBody) return;

	const addBtn = document.getElementById('btnAddUser');
	const cancelBtn = document.getElementById('cancelUserForm');
	const closeBtn = document.getElementById('closeUserForm');
	const form = document.getElementById('userForm');
	const searchInput = document.getElementById('userSearch');
	const detailsBtn = document.getElementById('toggleUserDetails');
	const detailsPanel = document.getElementById('userAdditionalDetails');

	addBtn?.addEventListener('click', () => toggleUserForm());
	cancelBtn?.addEventListener('click', () => toggleUserForm(false));
	closeBtn?.addEventListener('click', () => toggleUserForm(false));
	form?.addEventListener('submit', handleUserSubmit);
	searchInput?.addEventListener('input', () => renderUsers(filterUsers(searchInput.value)));

	detailsBtn?.addEventListener('click', () => {
		const isOpen = detailsPanel?.classList.contains('show');
		setCollapsibleState(detailsPanel, !isOpen);
		detailsBtn.textContent = isOpen ? 'Add More Details' : 'Hide Additional Details';
	});

	loadUsers();
});

async function loadUsers() {
	try {
		const data = await apiRequest('users.php');
		usersCache = Array.isArray(data) ? data : [];
		renderUsers(usersCache);
	} catch (error) {
		setUsersMessage('Unable to load users.');
	}
}

function renderUsers(users) {
	const tbody = document.getElementById('usersTableBody');
	if (!tbody) return;

	if (!users || users.length === 0) {
		setUsersMessage('No users found.');
		return;
}

	tbody.innerHTML = users
		.map(
			(user) => `
        <tr>
            <td>#${user.id}</td>
            <td>${escapeHtml(user.full_name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td>${formatDate(user.created_at)}</td>
        </tr>
    `
		)
		.join('');
}

function setUsersMessage(message) {
	const tbody = document.getElementById('usersTableBody');
	if (!tbody) return;
	tbody.innerHTML = `<tr><td colspan="5" class="text-center">${message}</td></tr>`;
}

function toggleUserForm(forceOpen) {
	const panel = document.getElementById('userFormPanel');
	const addBtn = document.getElementById('btnAddUser');
	const form = document.getElementById('userForm');
	const shouldOpen =
		typeof forceOpen === 'boolean' ? forceOpen : !panel?.classList.contains('show');

	setCollapsibleState(panel, shouldOpen);
	addBtn.textContent = shouldOpen ? 'Close Form' : 'Add New User';
	panel?.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

	if (!shouldOpen) {
		form?.reset();
		setUserFormStatus();
		const detailsPanel = document.getElementById('userAdditionalDetails');
		const detailsBtn = document.getElementById('toggleUserDetails');
		setCollapsibleState(detailsPanel, false);
		if (detailsBtn) detailsBtn.textContent = 'Add More Details';
	}
}

async function handleUserSubmit(event) {
	event.preventDefault();

	const payload = collectUserForm();
	if (!payload) return;

	try {
		await apiRequest('users.php', 'POST', payload);
		showNotification('Successfully added!');
		toggleUserForm(false);
		loadUsers();
	} catch (error) {
		setUserFormStatus('error', error.message || 'Unable to save user.');
	}
}

function collectUserForm() {
	const fullName = document.getElementById('userFullName').value.trim();
	const username = document.getElementById('userUsername').value.trim();
	const password = document.getElementById('userPassword').value;
	const role = document.getElementById('userRole').value;

	if (!fullName || !username || !password || !role) {
		setUserFormStatus('error', 'All fields are required.');
		return null;
	}

	if (password.length < 8) {
		setUserFormStatus('error', 'Password must be at least 8 characters.');
		return null;
	}

	return {
		full_name: fullName,
		username,
		password,
		role,
	};
}

function filterUsers(term) {
	const text = term.toLowerCase();
	return usersCache.filter((user) =>
		[user.full_name, user.username, user.role].join(' ').toLowerCase().includes(text)
	);
}

function setUserFormStatus(type = '', message = '') {
	const statusBox = document.getElementById('userFormStatus');
	if (!statusBox) return;
	statusBox.textContent = message;
	statusBox.className = type ? `form-status show ${type}` : 'form-status';
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
