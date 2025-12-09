const API_BASE_URL = 'http://localhost:8000/api/v1/users';

// Toggle between pages
function togglePage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    clearMessages();
}

// Show message
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
}

// Clear all messages
function clearMessages() {
    document.getElementById('loginMessage').className = 'message';
    document.getElementById('registerMessage').className = 'message';
}

// Get stored token
function getAccessToken() {
    return localStorage.getItem('accessToken');
}

// Set tokens
function setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

// Clear tokens
function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getAccessToken();
}

// Handle Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const avatar = document.getElementById('avatar').files[0];
    const coverImage = document.getElementById('coverImage').files[0];

    if (!avatar) {
        showMessage('registerMessage', 'Avatar is required!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('avatar', avatar);
    if (coverImage) {
        formData.append('coverImage', coverImage);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('registerMessage', 'Registration successful! Please login.', 'success');
            document.getElementById('registerForm').reset();
            setTimeout(() => togglePage('loginPage'), 2000);
        } else {
            showMessage('registerMessage', data.message || 'Registration failed!', 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Error: ' + error.message, 'error');
    }
});

// Handle Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrUsername = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const loginData = {
        password: password
    };
    
    // Check if input is email or username
    if (emailOrUsername.includes('@')) {
        loginData.email = emailOrUsername;
    } else {
        loginData.username = emailOrUsername;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            setTokens(data.data.accessToken, data.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Update dashboard and show it
            const user = data.data.user;
            document.getElementById('userName').textContent = user.fullName;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userUsername').textContent = user.username;
            
            showMessage('loginMessage', 'Login successful!', 'success');
            document.getElementById('loginForm').reset();
            
            setTimeout(() => togglePage('dashboardPage'), 1500);
        } else {
            showMessage('loginMessage', data.message || 'Login failed!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Error: ' + error.message + '. Make sure backend server is running on http://localhost:8000', 'error');
    }
});

// Handle Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`
            },
            credentials: 'include'
        });

        if (response.ok) {
            clearTokens();
            document.getElementById('loginForm').reset();
            togglePage('loginPage');
            showMessage('loginMessage', 'Logged out successfully!', 'success');
        } else {
            alert('Logout failed!');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Check if user is already logged in on page load
window.addEventListener('load', () => {
    if (isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userName').textContent = user.fullName;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userUsername').textContent = user.username;
            togglePage('dashboardPage');
        }
    }
});
