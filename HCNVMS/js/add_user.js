// Add User standalone page logic

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addUserForm');
    if (!form) return;

    form.addEventListener('submit', handleAddUserSubmit);
});

async function handleAddUserSubmit(event) {
    event.preventDefault();

    const fullName = document.getElementById('userFullName').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;

    if (!fullName || !username || !password || !role) {
        alert('All fields are required.');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
    }

    const payload = {
        full_name: fullName,
        username,
        password,
        role,
    };

    try {
        await apiRequest('users.php', 'POST', payload);
        alert('User added successfully');
        window.location.href = 'users.html';
    } catch (error) {
        alert(error.message || 'Unable to add user');
    }
}
