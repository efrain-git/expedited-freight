// Supabase Configuration
const SUPABASE_URL = 'https://quvalmzdeziaxnqpmkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dmFsbXpkZXppYXhucXBta3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODUxODEsImV4cCI6MjA3MTQ2MTE4MX0.nsaaeBLXJ0LnHApKZV1CArL33U_0kVGg6XnD2geG9Sk';

// Initialize Supabase client
let supabase;
try {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
    } else {
        console.error('Supabase library not loaded');
    }
} catch (error) {
    console.error('Error initializing Supabase:', error);
}

// Application State
let currentUser = null;
let isLoading = false;

// Utility Functions
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function setLoading(loading) {
    isLoading = loading;
    if (loading) {
        showElement('loadingOverlay');
    } else {
        hideElement('loadingOverlay');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(element => {
        element.textContent = '';
        element.classList.add('hidden');
    });
}

function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const textSpan = button.querySelector('[id*="ButtonText"]');
    const spinner = button.querySelector('[id*="Spinner"]');
    
    if (textSpan && spinner) {
        button.disabled = loading;
        if (loading) {
            textSpan.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            textSpan.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }
}

// Authentication Functions
async function login(username, password) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
        
        setLoading(true);
        clearErrors();
        
        // Query the user_credentials table
        const { data, error } = await supabase
            .from('user_credentials')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - invalid credentials
                throw new Error('Invalid username or password');
            }
            throw error;
        }
        
        if (data) {
            // Valid credentials
            currentUser = data.username;
            document.getElementById('username-display').textContent = currentUser;
            
            // Store session in localStorage for persistence
            localStorage.setItem('currentUser', currentUser);
            
            showPage('searchPage');
            return { success: true };
        } else {
            throw new Error('Invalid username or password');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', error.message);
        return { success: false, error: error.message };
    } finally {
        setLoading(false);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showPage('loginPage');
    clearErrors();
    
    // Clear form fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('searchTerm').value = '';
    
    // Clear results
    clearSearchResults();
}

// Search Functions
async function searchRecords(searchTerm, searchType) {
    try {
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
        
        setLoading(true);
        clearSearchResults();
        clearErrors();
        
        // Validate input
        if (!searchTerm.trim()) {
            throw new Error('Please enter a search term');
        }
        
        // Build query based on search type
        let query = supabase.from('dot_records').select('*');
        
        if (searchType === 'DOT') {
            //query = query.eq('dot_number', searchTerm.trim());
            //query = query.ilike('dot_number','%1234%');
        } else if (searchType === 'DOCKET') {
            query = query.eq('docket_number', searchTerm.trim().toUpperCase());
        } else {
            throw new Error('Invalid search type');
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Log the search
        await logSearch(searchTerm, searchType, data ? data.length : 0);
        
        // Display results
        if (data && data.length > 0) {
            displayResults(data);
        } else {
            displayNoResults();
        }
        
        return { success: true, results: data };
        
    } catch (error) {
        console.error('Search error:', error);
        showError('searchError', error.message);
        return { success: false, error: error.message };
    } finally {
        setLoading(false);
    }
}

async function logSearch(searchTerm, searchType, resultsFound) {
    try {
        if (!supabase) {
            return;
        }
        
        const { error } = await supabase.from('usage_logs').insert({
            search_term: searchTerm,
            search_type: searchType,
            user_id: null, // We don't have user IDs in our simple system
            results_found: resultsFound,
            search_timestamp: new Date().toISOString()
        });
        
        if (error) {
            console.error('Logging error:', error);
        }
        
    } catch (error) {
        console.error('Failed to log search:', error);
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    const noResultsContainer = document.getElementById('noResultsContainer');
    const resultsContent = document.getElementById('resultsContent');
    
    if (noResultsContainer) noResultsContainer.classList.add('hidden');
    if (!resultsContainer || !resultsContent) return;
    
    // Create table
    const table = document.createElement('table');
    table.className = 'results-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = [
        'DOT Number',
        'Docket Number',
        'Legal Name',
        'DBA Name',
        'Business Address',
        'City',
        'State',
        'Zip Code',
        'Business Phone',
        'Cell Phone',
        'Created Date',
        'Source'
    ];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    results.forEach(record => {
        const row = document.createElement('tr');
        
        const cells = [
            record.dot_number || '-',
            record.docket_number || '-',
            record.legal_name || '-',
            record.dba_name || '-',
            record.business_street || '-',
            record.business_city || '-',
            record.business_state_code || '-',
            record.business_zip_code || '-',
            record.business_phone || '-',
            record.cell_phone || '-',
            record.created_date ? new Date(record.created_date).toLocaleDateString() : '-',
            record.source || '-'
        ];
        
        cells.forEach(cellData => {
            const td = document.createElement('td');
            td.textContent = cellData;
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Create table wrapper for responsive scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';
    tableWrapper.appendChild(table);
    
    resultsContent.innerHTML = '';
    resultsContent.appendChild(tableWrapper);
    
    resultsContainer.classList.remove('hidden');
}

function displayNoResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const noResultsContainer = document.getElementById('noResultsContainer');
    
    if (resultsContainer) resultsContainer.classList.add('hidden');
    if (noResultsContainer) noResultsContainer.classList.remove('hidden');
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const noResultsContainer = document.getElementById('noResultsContainer');
    
    if (resultsContainer) resultsContainer.classList.add('hidden');
    if (noResultsContainer) noResultsContainer.classList.add('hidden');
}

// Form Validation
function validateLogin(username, password) {
    const errors = {};
    
    if (!username || !username.trim()) {
        errors.username = 'Username is required';
    }
    
    if (!password || !password.trim()) {
        errors.password = 'Password is required';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

function displayValidationErrors(errors) {
    Object.keys(errors).forEach(field => {
        showError(`${field}Error`, errors[field]);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = storedUser;
        document.getElementById('username-display').textContent = currentUser;
        showPage('searchPage');
    } else {
        showPage('loginPage');
    }
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const validation = validateLogin(username, password);
            
            if (!validation.isValid) {
                displayValidationErrors(validation.errors);
                return;
            }
            
            setButtonLoading('loginButton', true);
            
            const result = await login(username, password);
            
            setButtonLoading('loginButton', false);
        });
    }
    
    // Search Form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const searchTerm = document.getElementById('searchTerm').value;
            const searchTypeInput = document.querySelector('input[name="searchType"]:checked');
            const searchType = searchTypeInput ? searchTypeInput.value : 'DOT';
            
            setButtonLoading('searchButton', true);
            
            const result = await searchRecords(searchTerm, searchType);
            
            setButtonLoading('searchButton', false);
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Global error handlers
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
