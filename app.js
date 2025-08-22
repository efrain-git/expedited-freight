// Supabase Configuration
const SUPABASE_URL = 'https://quvalmzdeziaxnqpmkqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dmFsbXpkZXppYXhucXBta3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODUxODEsImV4cCI6MjA3MTQ2MTE4MX0.nsaaeBLXJ0LnHApKZV1CArL33U_0kVGg6XnD2geG9Sk';

// Initialize Supabase client
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application State
class AppState {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
    }
    
    setUser(user) {
        this.currentUser = user;
        if (user) {
            document.getElementById('userEmail').textContent = user.email;
        }
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const overlay = document.getElementById('loadingOverlay');
        if (loading) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

const appState = new AppState();

// Page Navigation
class PageManager {
    static showPage(pageId) {
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
    
    static showLogin() {
        this.showPage('loginPage');
    }
    
    static showSignup() {
        this.showPage('signupPage');
    }
    
    static showSearch() {
        this.showPage('searchPage');
    }
}

// Authentication Manager
class AuthManager {
    static async login(email, password) {
        try {
            appState.setLoading(true);
            this.clearErrors('login');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            appState.setUser(data.user);
            PageManager.showSearch();
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', error.message);
            return { success: false, error: error.message };
        } finally {
            appState.setLoading(false);
        }
    }
    
    static async signup(email, password) {
        try {
            appState.setLoading(true);
            this.clearErrors('signup');
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            this.showSuccess('signupSuccess', 'Account created successfully! Please check your email to confirm your account.');
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('signupError', error.message);
            return { success: false, error: error.message };
        } finally {
            appState.setLoading(false);
        }
    }
    
    static async logout() {
        try {
            appState.setLoading(true);
            
            const { error } = await supabase.auth.signOut();
            
            if (error) throw error;
            
            appState.setUser(null);
            PageManager.showLogin();
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        } finally {
            appState.setLoading(false);
        }
    }
    
    static async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) throw error;
            
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }
    
    static showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    static showSuccess(elementId, message) {
        const successElement = document.getElementById(elementId);
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.remove('hidden');
        }
    }
    
    static clearErrors(prefix) {
        const errorElements = document.querySelectorAll(`[id*="${prefix}"][id*="Error"]`);
        errorElements.forEach(element => {
            element.textContent = '';
            element.classList.add('hidden');
        });
        
        const successElements = document.querySelectorAll(`[id*="${prefix}"][id*="Success"]`);
        successElements.forEach(element => {
            element.textContent = '';
            element.classList.add('hidden');
        });
    }
}

// Search Manager
class SearchManager {
    static async searchRecords(searchTerm, searchType) {
        try {
            appState.setLoading(true);
            this.clearSearchResults();
            this.clearErrors();
            
            // Validate input
            if (!searchTerm.trim()) {
                throw new Error('Please enter a search term');
            }
            
            // Build query based on search type
            let query = supabase.from('dot_records').select('*');
            
            if (searchType === 'DOT') {
                query = query.eq('dot_number', searchTerm.trim());
            } else if (searchType === 'DOCKET') {
                query = query.eq('docket_number', searchTerm.trim().toUpperCase());
            } else {
                throw new Error('Invalid search type');
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Log the search
            await this.logSearch(searchTerm, searchType, data ? data.length : 0);
            
            // Display results
            if (data && data.length > 0) {
                this.displayResults(data);
            } else {
                this.displayNoResults();
            }
            
            return { success: true, results: data };
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        } finally {
            appState.setLoading(false);
        }
    }
    
    static async logSearch(searchTerm, searchType, resultsFound) {
        try {
            const user = await AuthManager.getCurrentUser();
            
            const { error } = await supabase.from('usage_logs').insert({
                search_term: searchTerm,
                search_type: searchType,
                user_id: user ? user.id : null,
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
    
    static displayResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        const noResultsContainer = document.getElementById('noResultsContainer');
        const resultsContent = document.getElementById('resultsContent');
        
        noResultsContainer.classList.add('hidden');
        
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
    
    static displayNoResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        const noResultsContainer = document.getElementById('noResultsContainer');
        
        resultsContainer.classList.add('hidden');
        noResultsContainer.classList.remove('hidden');
    }
    
    static clearSearchResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        const noResultsContainer = document.getElementById('noResultsContainer');
        
        resultsContainer.classList.add('hidden');
        noResultsContainer.classList.add('hidden');
    }
    
    static showError(message) {
        const errorElement = document.getElementById('searchError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    static clearErrors() {
        const errorElement = document.getElementById('searchError');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
        }
    }
}

// Form Validators
class FormValidator {
    static validateLogin(email, password) {
        const errors = {};
        
        if (!email || !email.trim()) {
            errors.email = 'Email is required';
        } else if (!this.isValidEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!password || !password.trim()) {
            errors.password = 'Password is required';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
    
    static validateSignup(email, password, confirmPassword) {
        const errors = {};
        
        if (!email || !email.trim()) {
            errors.email = 'Email is required';
        } else if (!this.isValidEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!password || !password.trim()) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
        }
        
        if (!confirmPassword || !confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
    
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static displayErrors(errors, prefix) {
        // Clear previous errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
        });
        
        // Display new errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.classList.remove('hidden');
            }
        });
    }
}

// Button State Manager
class ButtonManager {
    static setLoading(buttonId, textId, spinnerId, loading) {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(textId);
        const spinner = document.getElementById(spinnerId);
        
        if (button && text && spinner) {
            button.disabled = loading;
            if (loading) {
                text.classList.add('hidden');
                spinner.classList.remove('hidden');
            } else {
                text.classList.remove('hidden');
                spinner.classList.add('hidden');
            }
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Check for existing session
    try {
        const user = await AuthManager.getCurrentUser();
        if (user) {
            appState.setUser(user);
            PageManager.showSearch();
        } else {
            PageManager.showLogin();
        }
    } catch (error) {
        console.error('Session check error:', error);
        PageManager.showLogin();
    }
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const validation = FormValidator.validateLogin(email, password);
            
            if (!validation.isValid) {
                FormValidator.displayErrors(validation.errors, '');
                return;
            }
            
            ButtonManager.setLoading('loginForm', 'loginButtonText', 'loginSpinner', true);
            
            const result = await AuthManager.login(email, password);
            
            ButtonManager.setLoading('loginForm', 'loginButtonText', 'loginSpinner', false);
        });
    }
    
    // Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            const validation = FormValidator.validateSignup(email, password, confirmPassword);
            
            if (!validation.isValid) {
                FormValidator.displayErrors(validation.errors, 'signup');
                return;
            }
            
            ButtonManager.setLoading('signupForm', 'signupButtonText', 'signupSpinner', true);
            
            const result = await AuthManager.signup(email, password);
            
            ButtonManager.setLoading('signupForm', 'signupButtonText', 'signupSpinner', false);
        });
    }
    
    // Search Form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const searchTerm = document.getElementById('searchTerm').value;
            const searchType = document.querySelector('input[name="searchType"]:checked').value;
            
            ButtonManager.setLoading('searchForm', 'searchButtonText', 'searchSpinner', true);
            
            const result = await SearchManager.searchRecords(searchTerm, searchType);
            
            ButtonManager.setLoading('searchForm', 'searchButtonText', 'searchSpinner', false);
        });
    }
    
    // Navigation Links
    const showSignupLink = document.getElementById('showSignup');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            PageManager.showSignup();
        });
    }
    
    const showLoginLink = document.getElementById('showLogin');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            PageManager.showLogin();
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await AuthManager.logout();
        });
    }
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            appState.setUser(session.user);
            PageManager.showSearch();
        } else if (event === 'SIGNED_OUT') {
            appState.setUser(null);
            PageManager.showLogin();
        }
    });
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
