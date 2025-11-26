document.addEventListener('DOMContentLoaded', () => {
	const forms = document.querySelectorAll('.settings-form');
	forms.forEach((form) => form.addEventListener('submit', handleFormSubmit));

	const actionButtons = document.querySelectorAll('[data-action]');
	actionButtons.forEach((btn) => {
		if (btn.tagName === 'FORM') return;
		btn.addEventListener('click', handleQuickAction);
	});
});

function handleFormSubmit(event) {
	event.preventDefault();
	const form = event.currentTarget;
	if (!form.checkValidity()) {
		form.reportValidity();
		return;
	}

	const action = form.dataset.action;
	if (action === 'change-password' && !validatePasswordForm(form)) {
		return;
	}

	showNotification('Settings saved successfully!', 'success');

	if (action !== 'change-password') {
		return;
	}

	form.reset();
}

function validatePasswordForm(form) {
	const current = form.querySelector('#currentPassword').value.trim();
	const next = form.querySelector('#newPassword').value;
	const confirm = form.querySelector('#confirmPassword').value;

	if (!current || !next || !confirm) {
		showNotification('Please fill in all password fields.', 'error');
		return false;
	}

	if (next.length < 8) {
		showNotification('Password must be at least 8 characters.', 'error');
		return false;
	}

	if (next !== confirm) {
		showNotification('New passwords do not match.', 'error');
		return false;
	}

	return true;
}

function handleQuickAction(event) {
	const action = event.currentTarget.dataset.action;

	switch (action) {
		case 'run-backup':
			showNotification('Backup started. Please wait...', 'info');
			setTimeout(() => showNotification('Backup completed successfully!', 'success'), 2000);
			break;
		case 'restore-backup':
			showNotification('Restore wizard opened. Select a backup file to continue.', 'info');
			break;
		case 'refresh-logs':
			refreshActivityLogs();
			showNotification('Activity logs refreshed.', 'success');
			break;
		case 'download-logs':
			showNotification('Preparing log download...', 'info');
			break;
		case 'open-help':
			showNotification('For help, email support@hcnvms.local or call local IT.', 'info');
			break;
		default:
			break;
	}
}

function refreshActivityLogs() {
	const list = document.getElementById('activityList');
	if (!list) return;

	const item = document.createElement('li');
	const now = new Date();
	const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	item.innerHTML = `<span>${time}</span>Logs refreshed by user.`;
	list.prepend(item);
}

function showNotification(message, type) {
	const existingNotification = document.querySelector('.notification');
	if (existingNotification) {
		existingNotification.remove();
	}

	const notification = document.createElement('div');
	notification.className = `notification notification-${type}`;
	notification.textContent = message;
	notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: #fff;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

	if (type === 'success') {
		notification.style.background = '#00d4ff';
		notification.style.color = '#0f1624';
	} else if (type === 'error') {
		notification.style.background = '#ff4757';
	} else {
		notification.style.background = '#ffa502';
		notification.style.color = '#0f1624';
	}

	const style = document.createElement('style');
	style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
	document.head.appendChild(style);

	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.animation = 'slideIn 0.3s ease-out reverse';
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}
