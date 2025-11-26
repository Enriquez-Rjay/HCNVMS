document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('registrationForm');
	const dobInput = document.getElementById('dateOfBirth');
	const ageInput = document.getElementById('age');
	const phoneInput = document.getElementById('phone');
	const emergencyPhoneInput = document.getElementById('emergencyPhone');
	const statusBox = document.getElementById('formStatus');
	const toggleFormBtn = document.getElementById('toggleRegistrationForm');
	const closeFormBtn = document.getElementById('closeRegistrationForm');
	const cancelFormBtn = document.getElementById('cancelRegistrationForm');
	const patientPanel = document.getElementById('patientFormPanel');
	const parentDetailsBtn = document.getElementById('toggleParentDetails');
	const parentDetailsPanel = document.getElementById('parentDetailsPanel');

	const MAX_AGE_MONTHS = 12;
	const NAME_REGEX = /^[A-Za-z\s\-.]+$/;

	const nameInputs = ['firstName', 'middleName', 'lastName'].map(id => document.getElementById(id));

	setDobMax();
	wireNameGuards();
	wirePhoneSanitizer(phoneInput);
	wirePhoneSanitizer(emergencyPhoneInput);
	if (dobInput) {
		dobInput.addEventListener('input', updateAge);
		dobInput.addEventListener('change', updateAge);
	}

	if (form) {
		form.addEventListener('submit', handleSubmit);
	}

	toggleFormBtn?.addEventListener('click', () => togglePatientForm());
	closeFormBtn?.addEventListener('click', () => togglePatientForm(false));
	cancelFormBtn?.addEventListener('click', () => togglePatientForm(false));
	parentDetailsBtn?.addEventListener('click', () => {
		const nextState = !(parentDetailsPanel?.classList.contains('show'));
		setCollapsibleState(parentDetailsPanel, nextState);
		parentDetailsBtn.textContent = nextState ? 'Hide Family Details' : 'Add Family Details';
	});

	function setDobMax() {
		if (!dobInput) return;
		dobInput.max = new Date().toISOString().split('T')[0];
	}

	function wireNameGuards() {
		nameInputs.forEach(input => {
			if (!input) return;
			input.setAttribute('pattern', NAME_REGEX.source);
			input.addEventListener('input', () => {
				input.value = input.value.replace(/[^A-Za-z\s\-.]/g, '');
			});
		});
	}

	function wirePhoneSanitizer(input) {
		if (!input) return;
		input.addEventListener('input', () => {
			let digits = input.value.replace(/\D/g, '').slice(0, 11);
			input.value = digits;
		});
	}

	function updateAge() {
		if (!dobInput || !ageInput || !dobInput.value) {
			ageInput.value = '';
			return;
		}

		const today = new Date();
		const dob = new Date(dobInput.value);
		if (Number.isNaN(dob.getTime())) {
			ageInput.value = '';
			return;
		}

		let months = (today.getFullYear() - dob.getFullYear()) * 12;
		months += today.getMonth() - dob.getMonth();
		if (today.getDate() < dob.getDate()) {
			months -= 1;
		}
		const years = Math.floor(months / 12);
		ageInput.value = years >= 0 ? years : '';
	}

	async function handleSubmit(event) {
		event.preventDefault();

		clearStatus();
		if (!form.checkValidity()) {
			form.reportValidity();
			setStatus('error', 'Please complete all required fields.');
			return;
		}

		if (!isValidPhones()) {
			setStatus('error', 'Phone numbers must contain exactly 11 digits.');
			return;
		}

		if (!isValidNames()) {
			setStatus('error', 'Special characters are not allowed in First, Middle, or Last name.');
			return;
		}

		if (!isValidAge()) {
			setStatus('error', 'Patient must be a newborn (max 12 months old).');
			return;
		}

		const payload = buildPayload();

		try {
			await apiRequest('patients.php', 'POST', payload);
			setStatus('success', 'Successfully added!');
			showNotification('Successfully added!');
			form.reset();
			updateAge();
			togglePatientForm(false);
		} catch (error) {
			setStatus('error', error.message);
		}
	}

	function isValidPhones() {
		return [phoneInput, emergencyPhoneInput].every(input => input && /^\d{11}$/.test(input.value));
	}

	function isValidNames() {
		return nameInputs.every(input => {
			if (!input || !input.value) return true;
			return NAME_REGEX.test(input.value);
		});
	}

	function isValidAge() {
		if (!dobInput || !dobInput.value) return false;
		const dob = new Date(dobInput.value);
		const today = new Date();
		const months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
		if (today.getDate() < dob.getDate()) {
			return months - 1 <= MAX_AGE_MONTHS;
		}
		return months <= MAX_AGE_MONTHS;
	}

	function buildPayload() {
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		data.medicalConditions = Array.from(document.querySelectorAll('input[name="medicalConditions"]:checked')).map(cb => cb.value);
		return {
			firstName: data.firstName,
			middleName: data.middleName,
			lastName: data.lastName,
			suffixName: data.suffixName,
			dateOfBirth: data.dateOfBirth,
			gender: data.gender,
			nationality: data.nationality,
			email: data.email,
			phone: data.phone,
			address: data.address,
			city: data.city,
			state: data.state,
			zipCode: data.zipCode,
			username: data.username,
			password: data.password,
			confirmPassword: data.confirmPassword,
			emergencyName: data.emergencyName,
			emergencyRelationship: data.emergencyRelationship,
			emergencyPhone: data.emergencyPhone,
			bloodType: data.bloodType,
			allergies: data.allergies,
			medicalConditions: data.medicalConditions,
			otherConditions: data.otherConditions
		};
	}

	function setStatus(type, message) {
		if (!statusBox) return;
		statusBox.textContent = message;
		statusBox.className = `form-status show ${type}`;
	}

	function clearStatus() {
		if (!statusBox) return;
		statusBox.textContent = '';
		statusBox.className = 'form-status';
	}

	function togglePatientForm(forceOpen) {
		const shouldOpen =
			typeof forceOpen === 'boolean' ? forceOpen : !patientPanel?.classList.contains('show');
		setCollapsibleState(patientPanel, shouldOpen);
		patientPanel?.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

		const toggleBtn = document.getElementById('toggleRegistrationForm');
		if (toggleBtn) {
			toggleBtn.textContent = shouldOpen ? 'Close Form' : 'Add New Patient';
		}

		if (!shouldOpen) {
			form?.reset();
			updateAge();
			clearStatus();
			setCollapsibleState(parentDetailsPanel, false);
			if (parentDetailsBtn) {
				parentDetailsBtn.textContent = 'Add Family Details';
			}
		}
	}

	function setCollapsibleState(element, open) {
		if (!element) return;
		element.classList.toggle('show', open);
		element.style.maxHeight = open ? `${element.scrollHeight}px` : '';
	}
});

