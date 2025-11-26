// Login page logic

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const result = await apiRequest('login.php', 'POST', { username, password });
        if (result && result.user) {
            alert('Login successful');
            window.location.href = 'index.html';
        }
    } catch (error) {
        // apiRequest already shows an alert
    }
}
