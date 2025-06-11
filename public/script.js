// public/script.js - Client-side logic for the Blog Application

// Declare global Firebase instances (will be populated after config fetch)
let auth;
let dbClient; // Firestore client instance
let socket;   // Socket.IO client instance

// --- DOM Elements ---
const authHeader = document.getElementById('authHeader');
const authForms = document.getElementById('authForms');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const showLoginLink = document.getElementById('showLoginLink');
const showRegisterLink = document.getElementById('showRegisterLink');
const loggedInSection = document.getElementById('loggedInSection');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const userUidDisplay = document.getElementById('userUidDisplay');
const logoutButton = document.getElementById('logoutButton');
const messageDisplay = document.getElementById('messageDisplay');
const blogPostsSection = document.getElementById('blogPostsSection'); // Placeholder for future use

// --- State Variables ---
let currentUser = null;       // Stores the authenticated Firebase User object
let firebaseIdToken = null;   // Stores the current Firebase ID Token for backend API calls

// --- Helper Functions ---

/**
 * Displays a temporary message on the UI.
 * @param {string} message - The message content.
 * @param {string} type - 'success' or 'error' to determine styling.
 */
function showMessage(message, type = 'success') {
    messageDisplay.textContent = message;
    messageDisplay.className = `message ${type}`; // Reset classes and add base + type
    messageDisplay.classList.remove('hidden');    // Show the message element
    setTimeout(() => {
        messageDisplay.classList.add('hidden'); // Hide after 5 seconds
    }, 5000);
}

/**
 * Updates the UI based on the current authentication state (logged in/out).
 * @param {firebase.User | null} user - The Firebase User object if logged in, or null if logged out.
 */
function updateAuthUI(user) {
    if (user) {
        // User is logged in
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        userUidDisplay.textContent = user.uid;
        authHeader.textContent = `Welcome, ${user.email}!`;

        // Hide authentication forms, show logged-in section and blog posts section
        authForms.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        blogPostsSection.classList.remove('hidden'); // Show blog posts section when logged in
        
        // Get the Firebase ID token for sending to your custom backend API
        user.getIdToken().then(token => {
            firebaseIdToken = token;
            localStorage.setItem('firebaseIdToken', token); // Store token for session persistence
            console.log('Firebase ID Token obtained and stored.');
            // This is where you would typically fetch user-specific data or posts from your backend
            // For now, we'll wait for blog post CRUD implementation.
        }).catch(error => {
            console.error('Error getting Firebase ID token:', error);
            showMessage('Failed to retrieve user session. Please log in again.', 'error');
            auth.signOut(); // Force sign out if token fetch fails
        });

    } else {
        // User is logged out
        currentUser = null;
        firebaseIdToken = null;
        localStorage.removeItem('firebaseIdToken'); // Clear stored token on logout

        authHeader.textContent = 'Welcome!';
        // Show authentication forms, hide logged-in section and blog posts section
        authForms.classList.remove('hidden');
        registerForm.classList.remove('hidden'); // Default to showing register form
        loginForm.classList.add('hidden');       // Hide login form
        loggedInSection.classList.add('hidden');
        blogPostsSection.classList.add('hidden'); // Hide blog posts section when logged out
        // No showMessage here, as logout actions trigger it directly
    }
}

// --- Event Listeners for UI Actions ---

// Toggle visibility between registration and login forms
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authHeader.textContent = 'Login to Your Account';
    messageDisplay.classList.add('hidden'); // Hide any previous messages
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authHeader.textContent = 'Register for an Account';
    messageDisplay.classList.add('hidden'); // Hide any previous messages
});

// Handle registration form submission (sends to your backend API)
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    const email = e.target.registerEmail.value;
    const password = e.target.registerPassword.value;

    try {
        const response = await fetch('/api/auth/register', { // POST request to your backend's auth route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json(); // Parse the JSON response from your backend

        if (response.ok) { // Check if the HTTP status code is 2xx
            showMessage(data.message || 'Registration successful!', 'success');
            // If backend returns a customToken, use it to sign in with Firebase Client SDK
            if (data.customToken) {
                await auth.signInWithCustomToken(data.customToken); // Signs in the user client-side
                // The auth.onAuthStateChanged listener will then update the UI
            } else {
                // If no custom token is returned, prompt user to log in manually
                showMessage('Registration successful, but no auto-login token. Please log in.', 'success');
                loginForm.classList.remove('hidden'); // Show login form
                registerForm.classList.add('hidden'); // Hide register form
            }
            e.target.reset(); // Clear the form fields
        } else {
            // Display error message from backend
            showMessage(data.error || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Network or server error during registration:', error);
        showMessage('Network error or server unavailable during registration. Please try again later.', 'error');
    }
});

// Handle login form submission (uses Firebase Client SDK directly)
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    const email = e.target.loginEmail.value;
    const password = e.target.loginPassword.value;

    try {
        // Firebase Client SDK handles email/password login directly
        await auth.signInWithEmailAndPassword(email, password);
        // The auth.onAuthStateChanged listener will then update the UI
        showMessage('Login successful!', 'success');
        e.target.reset(); // Clear the form fields
    } catch (error) {
        console.error('Firebase Login Error:', error.code, error.message);
        let errorMessage = 'Login failed. Invalid credentials or network error.';
        // Provide more specific error messages based on Firebase Auth error codes
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Your account has been disabled.';
        }
        showMessage(errorMessage, 'error');
    }
});

// Handle logout button click
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut(); // Signs out the user from Firebase client-side
        // The auth.onAuthStateChanged listener will then update the UI
        showMessage('Logged out successfully.', 'success');
    } catch (error) {
        console.error('Error during logout:', error);
        showMessage('An error occurred during logout. Please try again.', 'error');
    }
});

// --- Main Initialization Function (Fetches config, initializes Firebase & Socket.IO) ---

/**
 * Fetches Firebase client configuration from the backend and initializes SDKs.
 * This function runs only once when the DOM content is loaded.
 */
async function initializeFrontend() {
    try {
        // 1. Fetch Firebase client config from your backend API
        const response = await fetch('/api/firebase-client-config');
        if (!response.ok) {
            throw new Error(`Failed to fetch Firebase config: ${response.statusText}`);
        }
        const firebaseConfig = await response.json(); // Parse the fetched config

        // 2. Initialize Firebase Client SDK
        const firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebaseApp.auth();           // Assign to global 'auth' variable
        dbClient = firebaseApp.firestore(); // Assign to global 'dbClient' variable (for Firestore client-side)
        
        console.log('Firebase client SDK initialized with config from backend.');

        // 3. Set up Firebase Authentication state listener
        // This listener will be called immediately after setup with the current user state
        // and whenever the auth state changes (login, logout, token refresh).
        auth.onAuthStateChanged(user => {
            updateAuthUI(user);
        });

        // 4. Initialize Socket.IO client (now that Firebase is ready)
        // The 'socket' variable is already declared globally at the top
        socket = io('http://localhost:3000'); // Connect to your backend's Socket.IO server

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server! Socket ID:', socket.id);
            // Any initial data fetching that requires an active Socket.IO connection could go here.
            // For now, we rely on auth.onAuthStateChanged to trigger UI updates.
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server.');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            showMessage('Failed to connect to real-time server. Please check server status.', 'error');
        });

        // --- Socket.IO Real-time Events (Placeholders for Blog Posts) ---
        // These listeners will be uncommented and implemented when we build the blog post CRUD functionality.
        /*
        socket.on('post:created', (newPost) => {
            console.log('Real-time: New post created:', newPost);
            // Logic to add the new post to the UI
        });

        socket.on('post:updated', (updatedPost) => {
            console.log('Real-time: Post updated:', updatedPost);
            // Logic to find and update the existing post in the UI
        });

        socket.on('post:deleted', (deletedPostId) => {
            console.log('Real-time: Post deleted:', deletedPostId);
            // Logic to remove the post from the UI
        });
        */

    } catch (error) {
        console.error('Fatal: Could not initialize frontend application. Check backend config endpoint and network:', error);
        showMessage('Fatal error: Could not load application configuration. Please contact support.', 'error');
        // Prevent further script execution if essential initialization fails
        document.body.innerHTML = '<div style="text-align: center; margin-top: 50px; font-size: 1.2em; color: red;">Application failed to load. Please check your console for details.</div>';
    }
}

// Kick off the frontend initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeFrontend);
