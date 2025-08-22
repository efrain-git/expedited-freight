// Sample data for demonstration
const sampleData = [
  {
    dotNumber: "1234567",
    docketNumber: "MC-123456",
    legalName: "ABC Transportation LLC",
    dbaName: "ABC Express",
    businessStreet: "123 Main Street",
    businessCity: "Dallas",
    businessStateCode: "TX",
    businessZipCode: "75201",
    businessPhone: "(214) 555-0123",
    cellPhone: "(214) 555-0124",
    createdDate: "2023-01-15",
    createdBy: "John Smith",
    createdByEmail: "john.smith@company.com",
    modifiedDate: "2023-06-20",
    modifiedBy: "Jane Doe",
    modifiedByEmail: "jane.doe@company.com",
    source: "FMCSA"
  },
  {
    dotNumber: "2345678",
    docketNumber: "MC-234567",
    legalName: "XYZ Logistics Inc",
    dbaName: "XYZ Freight",
    businessStreet: "456 Commerce Blvd",
    businessCity: "Houston",
    businessStateCode: "TX",
    businessZipCode: "77002",
    businessPhone: "(713) 555-0234",
    cellPhone: "(713) 555-0235",
    createdDate: "2023-02-20",
    createdBy: "Mike Johnson",
    createdByEmail: "mike.johnson@company.com",
    modifiedDate: "2023-07-15",
    modifiedBy: "Sarah Wilson",
    modifiedByEmail: "sarah.wilson@company.com",
    source: "Manual Entry"
  },
  {
    dotNumber: "3456789",
    docketNumber: "MC-345678",
    legalName: "Lone Star Trucking",
    dbaName: "Lone Star Express",
    businessStreet: "789 Industrial Way",
    businessCity: "Austin",
    businessStateCode: "TX",
    businessZipCode: "78701",
    businessPhone: "(512) 555-0345",
    cellPhone: "(512) 555-0346",
    createdDate: "2023-03-10",
    createdBy: "Bob Martinez",
    createdByEmail: "bob.martinez@company.com",
    modifiedDate: "2023-08-05",
    modifiedBy: "Lisa Brown",
    modifiedByEmail: "lisa.brown@company.com",
    source: "API Import"
  },
  {
    dotNumber: "4567890",
    docketNumber: "MC-456789",
    legalName: "Swift Transport Solutions",
    dbaName: "Swift Delivery",
    businessStreet: "321 Highway 35",
    businessCity: "San Antonio",
    businessStateCode: "TX",
    businessZipCode: "78202",
    businessPhone: "(210) 555-0456",
    cellPhone: "(210) 555-0457",
    createdDate: "2023-04-05",
    createdBy: "Amanda Davis",
    createdByEmail: "amanda.davis@company.com",
    modifiedDate: "2023-09-12",
    modifiedBy: "Chris Taylor",
    modifiedByEmail: "chris.taylor@company.com",
    source: "FMCSA"
  }
];

// Usage log simulation (in real app, this would be sent to a backend)
const usageLog = [];

// Application state
let currentUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Check if user is already logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const username = sessionStorage.getItem('username');
    
    console.log('Login check:', { isLoggedIn, username });
    
    if (isLoggedIn && username) {
        showSearchPage(username);
    } else {
        showLoginPage();
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            handleLogin(e);
        });
    }
    
    // Search form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Search form submitted');
            handleSearch(e);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout clicked');
            handleLogout();
        });
    }
    
    // Auto-detect search type based on input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', autoDetectSearchType);
    }
}

function handleLogin(e) {
    console.log('handleLogin called');
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (!usernameField || !passwordField) {
        console.error('Username or password field not found');
        return;
    }
    
    const username = usernameField.value.trim();
    const password = passwordField.value.trim();
    
    console.log('Login attempt:', { username: username, passwordLength: password.length });
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Validate inputs
    let isValid = true;
    
    if (!username) {
        showError('usernameError', 'Username is required');
        isValid = false;
    }
    
    if (!password) {
        showError('passwordError', 'Password is required');
        isValid = false;
    }
    
    if (!isValid) {
        console.log('Validation failed');
        return;
    }
    
    // Show loading state
    showLoginLoading(true);
    
    // Simulate login process with shorter timeout for better UX
    setTimeout(() => {
        console.log('Processing login...');
        
        // For demo purposes, accept any non-empty username/password
        if (username.length > 0 && password.length > 0) {
            console.log('Login successful, storing session');
            
            // Store session
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            currentUser = username;
            
            // Log the login
            logUsage('LOGIN', username, new Date().toISOString());
            
            // Clear form
            usernameField.value = '';
            passwordField.value = '';
            
            showLoginLoading(false);
            console.log('Redirecting to search page');
            showSearchPage(username);
        } else {
            console.log('Login failed - empty credentials');
            showLoginLoading(false);
            showError('passwordError', 'Invalid credentials');
        }
    }, 500); // Reduced timeout for better responsiveness
}

function handleSearch(e) {
    console.log('handleSearch called');
    
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('Search input field not found');
        return;
    }
    
    const searchValue = searchInput.value.trim();
    const searchTypeElement = document.querySelector('input[name="searchType"]:checked');
    
    if (!searchTypeElement) {
        alert('Please select a search type');
        return;
    }
    
    const searchType = searchTypeElement.value;
    const username = sessionStorage.getItem('username') || currentUser;
    
    console.log('Search params:', { searchValue, searchType, username });
    
    if (!searchValue) {
        alert('Please enter a search value');
        return;
    }
    
    // Show loading state
    showSearchLoading(true);
    
    // Hide previous results
    hideResults();
    
    // Simulate search process
    setTimeout(() => {
        const results = performSearch(searchValue, searchType);
        console.log('Search results:', results.length, 'records found');
        
        // Log the search
        logUsage('SEARCH', username, new Date().toISOString(), {
            searchTerm: searchValue,
            searchType: searchType,
            resultsFound: results.length
        });
        
        showSearchLoading(false);
        displayResults(results);
    }, 800);
}

function performSearch(searchTerm, searchType) {
    const term = searchTerm.toLowerCase().trim();
    
    const results = sampleData.filter(record => {
        if (searchType === 'dot') {
            return record.dotNumber.toLowerCase().includes(term);
        } else if (searchType === 'docket') {
            return record.docketNumber.toLowerCase().includes(term);
        }
        return false;
    });
    
    console.log(`Search for "${term}" (${searchType}) found ${results.length} results`);
    return results;
}

function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsSection = document.getElementById('resultsSection');
    
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    // Create table for desktop view
    const tableHTML = createResultsTable(results);
    
    // Create cards for mobile view
    const cardsHTML = createResultsCards(results);
    
    resultsContainer.innerHTML = tableHTML + cardsHTML;
    
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }
}

function createResultsTable(results) {
    let tableHTML = `
        <div class="table-container">
            <table class="results-table">
                <thead>
                    <tr>
                        <th>DOT Number</th>
                        <th>Docket Number</th>
                        <th>Legal Name</th>
                        <th>DBA Name</th>
                        <th>Business Address</th>
                        <th>Phone</th>
                        <th>Source</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(record => {
        const address = `${record.businessStreet}, ${record.businessCity}, ${record.businessStateCode} ${record.businessZipCode}`;
        tableHTML += `
            <tr>
                <td>${record.dotNumber}</td>
                <td>${record.docketNumber}</td>
                <td>${record.legalName}</td>
                <td>${record.dbaName}</td>
                <td>${address}</td>
                <td>${record.businessPhone}</td>
                <td><span class="status-badge">${record.source}</span></td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHTML;
}

function createResultsCards(results) {
    let cardsHTML = '<div class="mobile-results">';
    
    results.forEach(record => {
        cardsHTML += `
            <div class="record-card">
                <div class="record-header">
                    <div>
                        <h4 class="record-title">${record.legalName}</h4>
                        <p class="record-subtitle">${record.dbaName}</p>
                    </div>
                    <span class="status-badge">${record.source}</span>
                </div>
                <div class="record-fields">
                    <div class="record-field">
                        <span class="field-label">DOT Number</span>
                        <span class="field-value">${record.dotNumber}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Docket Number</span>
                        <span class="field-value">${record.docketNumber}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Business Address</span>
                        <span class="field-value">${record.businessStreet}<br>${record.businessCity}, ${record.businessStateCode} ${record.businessZipCode}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Business Phone</span>
                        <span class="field-value">${record.businessPhone}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Cell Phone</span>
                        <span class="field-value">${record.cellPhone}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Created By</span>
                        <span class="field-value">${record.createdBy}<br><small>${record.createdByEmail}</small></span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Modified By</span>
                        <span class="field-value">${record.modifiedBy}<br><small>${record.modifiedByEmail}</small></span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Created Date</span>
                        <span class="field-value">${formatDate(record.createdDate)}</span>
                    </div>
                    <div class="record-field">
                        <span class="field-label">Modified Date</span>
                        <span class="field-value">${formatDate(record.modifiedDate)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    cardsHTML += '</div>';
    return cardsHTML;
}

function autoDetectSearchType(e) {
    const value = e.target.value.trim().toLowerCase();
    const dotRadio = document.querySelector('input[name="searchType"][value="dot"]');
    const docketRadio = document.querySelector('input[name="searchType"][value="docket"]');
    
    if (!dotRadio || !docketRadio) return;
    
    // Auto-detect based on format
    if (value.startsWith('mc-')) {
        docketRadio.checked = true;
    } else if (/^\d+$/.test(value)) {
        dotRadio.checked = true;
    }
}

function handleLogout() {
    console.log('handleLogout called');
    
    const username = sessionStorage.getItem('username') || currentUser || 'Unknown';
    
    // Log the logout
    logUsage('LOGOUT', username, new Date().toISOString());
    
    // Clear session
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    currentUser = null;
    
    // Show login page
    showLoginPage();
    
    // Reset forms
    const loginForm = document.getElementById('loginForm');
    const searchForm = document.getElementById('searchForm');
    
    if (loginForm) {
        loginForm.reset();
    }
    if (searchForm) {
        searchForm.reset();
    }
    
    clearErrorMessages();
    hideResults();
    
    console.log('Logout completed');
}

function showLoginPage() {
    console.log('Showing login page');
    
    const loginPage = document.getElementById('loginPage');
    const searchPage = document.getElementById('searchPage');
    
    if (loginPage) {
        loginPage.classList.remove('hidden');
        console.log('Login page shown');
    }
    if (searchPage) {
        searchPage.classList.add('hidden');
        console.log('Search page hidden');
    }
    
    document.title = 'Login - DOT/Docket Search System';
}

function showSearchPage(username) {
    console.log('Showing search page for user:', username);
    
    const loginPage = document.getElementById('loginPage');
    const searchPage = document.getElementById('searchPage');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (loginPage) {
        loginPage.classList.add('hidden');
        console.log('Login page hidden');
    }
    if (searchPage) {
        searchPage.classList.remove('hidden');
        console.log('Search page shown');
    }
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${username}`;
        console.log('Welcome message set');
    }
    
    document.title = 'Search - DOT/Docket Search System';
}

function showLoginLoading(loading) {
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const buttonText = document.getElementById('loginButtonText');
    const spinner = document.getElementById('loginSpinner');
    
    if (!loginButton) return;
    
    if (loading) {
        loginButton.disabled = true;
        if (buttonText) buttonText.textContent = 'Logging in...';
        if (spinner) spinner.classList.remove('hidden');
    } else {
        loginButton.disabled = false;
        if (buttonText) buttonText.textContent = 'Login';
        if (spinner) spinner.classList.add('hidden');
    }
}

function showSearchLoading(loading) {
    const searchButton = document.querySelector('#searchForm button[type="submit"]');
    const buttonText = document.getElementById('searchButtonText');
    const spinner = document.getElementById('searchSpinner');
    
    if (!searchButton) return;
    
    if (loading) {
        searchButton.disabled = true;
        if (buttonText) buttonText.textContent = 'Searching...';
        if (spinner) spinner.classList.remove('hidden');
    } else {
        searchButton.disabled = false;
        if (buttonText) buttonText.textContent = 'Search';
        if (spinner) spinner.classList.add('hidden');
    }
}

function showNoResults() {
    const noResults = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    if (noResults) {
        noResults.classList.remove('hidden');
    }
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
}

function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    const noResults = document.getElementById('noResults');
    
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    if (noResults) {
        noResults.classList.add('hidden');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function logUsage(action, username, timestamp, additionalData = {}) {
    const logEntry = {
        action,
        username,
        timestamp,
        ...additionalData
    };
    
    usageLog.push(logEntry);
    
    // In a real application, this would be sent to a backend API
    console.log('Usage Log Entry:', logEntry);
}

// Export for debugging (in production, remove this)
window.debugApp = {
    sampleData,
    usageLog,
    currentUser,
    clearSession: () => {
        sessionStorage.clear();
        currentUser = null;
        location.reload();
    },
    forceLogin: (username = 'testuser') => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        currentUser = username;
        showSearchPage(username);
    }
};