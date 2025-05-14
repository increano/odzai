// Add missing updateBatchDeleteButton function
function updateBatchDeleteButton() {
    const selectedCount = document.querySelectorAll('.transaction-checkbox:checked').length;
    const batchDeleteBtn = document.getElementById('batch-delete');
    
    batchDeleteBtn.disabled = selectedCount === 0;
    batchDeleteBtn.textContent = selectedCount > 0 
        ? `Delete Selected (${selectedCount})` 
        : 'Delete Selected';
}

// Global state
let isBudgetLoaded = false;
let currentTransactions = []; // Store transactions for filtering/sorting
let currentSort = { field: 'date', direction: 'desc' }; // Default sort

// Helper to show errors
function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.add('active');
    setTimeout(() => {
        errorEl.classList.remove('active');
    }, 5000);
}

// Helper to handle API responses
async function handleApiResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.message || data.error || 'Unknown error occurred';
        showError(errorMessage);
        throw new Error(errorMessage);
    }
    return data;
}

// Get and display the data directory
async function getDataDirectory() {
    try {
        const response = await fetch('/api/data-directory');
        const data = await handleApiResponse(response);
        document.getElementById('current-data-dir').textContent = data.dataDir;
    } catch (error) {
        console.error('Failed to get data directory:', error);
        document.getElementById('current-data-dir').textContent = 'Unknown';
    }
}

// Check budget status on page load
async function checkBudgetStatus() {
    try {
        const response = await fetch('/api/budget-status');
        const data = await handleApiResponse(response);
        updateBudgetStatus(data.budgetLoaded);
    } catch (error) {
        console.error('Failed to check budget status:', error);
        updateBudgetStatus(false);
    }
}

// Update UI based on budget status
function updateBudgetStatus(isLoaded) {
    isBudgetLoaded = isLoaded;
    const statusBar = document.getElementById('status-bar');
    const accountsBtn = document.getElementById('accounts-btn');
    const transactionsBtn = document.getElementById('transactions-btn');
    const budgetBtn = document.getElementById('budget-btn');
    const categoriesBtn = document.getElementById('categories-btn');
    const reportsBtn = document.getElementById('reports-btn');
    
    if (isLoaded) {
        statusBar.textContent = 'Budget loaded successfully';
        statusBar.classList.add('success', 'active');
        accountsBtn.disabled = false;
        transactionsBtn.disabled = false;
        budgetBtn.disabled = false;
        categoriesBtn.disabled = false;
        reportsBtn.disabled = false;
    } else {
        statusBar.textContent = 'No budget loaded. Please select a budget file.';
        statusBar.classList.remove('success');
        statusBar.classList.add('active');
        accountsBtn.disabled = true;
        transactionsBtn.disabled = true;
        budgetBtn.disabled = true;
        categoriesBtn.disabled = true;
        reportsBtn.disabled = true;
    }
}

// Navigation
document.getElementById('budgets-btn').addEventListener('click', () => showSection('budgets'));
document.getElementById('accounts-btn').addEventListener('click', () => {
    if (isBudgetLoaded) showSection('accounts');
});
document.getElementById('transactions-btn').addEventListener('click', () => {
    if (isBudgetLoaded) showSection('transactions');
});
document.getElementById('budget-btn').addEventListener('click', () => {
    if (isBudgetLoaded) showSection('budget');
});

document.getElementById('categories-btn').addEventListener('click', () => {
    if (isBudgetLoaded) showSection('categories');
});

function showSection(section) {
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${section}-section`).classList.remove('hidden');
    document.getElementById(`${section}-btn`).classList.add('active');
    
    if (section === 'budgets') loadBudgets();
    if (section === 'accounts' && isBudgetLoaded) loadAccounts();
    if (section === 'transactions' && isBudgetLoaded) {
        loadAccounts().then(() => {
            const accountSelect = document.getElementById('account-select');
            if (accountSelect.value) loadTransactions(accountSelect.value);
        });
        loadCategories();
    }
    if (section === 'budget' && isBudgetLoaded) {
        loadBudgetMonths().then(() => {
            const monthSelect = document.getElementById('month-select');
            if (monthSelect.value) loadBudgetMonth(monthSelect.value);
        });
    }
    if (section === 'categories' && isBudgetLoaded) {
        loadCategoryGroups();
    }
    if (section === 'reports' && isBudgetLoaded) {
        // Initialize the reports section
        loadSpendingByCategory();
        loadSavedReports();
        
        // Set up default date range (last 3 months)
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        document.getElementById('report-end-date').value = formatDateForInput(today);
        document.getElementById('report-start-date').value = formatDateForInput(threeMonthsAgo);
    }
}

// Load Budgets
async function loadBudgets() {
    try {
        // Show loading
        document.getElementById('budgets-loading').classList.remove('hidden');
        document.getElementById('budgets-table').classList.add('hidden');
        document.getElementById('no-budgets-message').classList.add('hidden');
        
        const response = await fetch('/api/budgets');
        const budgets = await handleApiResponse(response);
        
        // Hide loading
        document.getElementById('budgets-loading').classList.add('hidden');
        
        const tbody = document.getElementById('budgets-body');
        tbody.innerHTML = '';
        
        if (budgets.length === 0) {
            document.getElementById('no-budgets-message').classList.remove('hidden');
            document.getElementById('budgets-table').classList.add('hidden');
            return;
        }
        
        document.getElementById('budgets-table').classList.remove('hidden');
        
        budgets.forEach(budget => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${budget.id}</td>
                <td>${budget.name || budget.id}</td>
                <td><button onclick="loadBudget('${budget.id}')">Load</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load budgets:', error);
        document.getElementById('budgets-loading').classList.add('hidden');
        document.getElementById('no-budgets-message').classList.remove('hidden');
    }
}

// Load Budget
async function loadBudget(budgetId) {
    try {
        const response = await fetch('/api/budgets/load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ budgetId })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            updateBudgetStatus(true);
            showSection('accounts');
        }
    } catch (error) {
        console.error('Failed to load budget:', error);
        updateBudgetStatus(false);
    }
}

// Load Accounts
async function loadAccounts() {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return [];
    }
    
    try {
        const response = await fetch('/api/accounts');
        const accounts = await handleApiResponse(response);
        
        // Debug log to see account structure
        console.log("Account data:", accounts);
        
        const tbody = document.getElementById('accounts-body');
        tbody.innerHTML = '';
        
        if (accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No accounts found. Add one to get started.</td></tr>';
        } else {
            accounts.forEach(account => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${account.name}</td>
                    <td>${formatCurrency(account.calculated_balance)}</td>
                    <td>${account.budget_category}</td>
                    <td><button onclick="viewTransactions('${account.id}')">View Transactions</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        // Also update the account select dropdown
        const accountSelect = document.getElementById('account-select');
        accountSelect.innerHTML = '<option value="">Select Account</option>';
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            accountSelect.appendChild(option);
        });
        
        // Add change event to load transactions
        accountSelect.onchange = () => {
            if (accountSelect.value) loadTransactions(accountSelect.value);
        };
        
        return accounts;
    } catch (error) {
        console.error('Failed to load accounts:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
        return [];
    }
}

// Add Account
document.getElementById('add-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    const name = document.getElementById('account-name').value;
    const offBudget = document.getElementById('offbudget').checked;
    const initialBalance = parseFloat(document.getElementById('initial-balance').value) || 0;
    
    try {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                account: { name, offBudget },
                initialBalance: Math.round(initialBalance * 100) // Convert to cents
            })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            document.getElementById('add-account-form').reset();
            // Wait a moment for the initial balance transaction to be processed
            setTimeout(() => {
                loadAccounts();
            }, 500);
        }
    } catch (error) {
        console.error('Failed to add account:', error);
    }
});

// View Transactions for Account
function viewTransactions(accountId) {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    document.getElementById('account-select').value = accountId;
    loadTransactions(accountId);
    showSection('transactions');
}

// Load transactions for an account
async function loadTransactions(accountId) {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    try {
        // First, ensure categories are loaded
        if (!window.allCategories || window.allCategories.length === 0) {
            console.log("Loading categories before transactions...");
            await loadCategories();
        }
        
        const loadingEl = document.getElementById('transaction-loading');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
        
        // Force a fresh fetch from the server to get the latest transactions
        const response = await fetch(`/api/transactions/${accountId}?_t=${Date.now()}`);
        const transactions = await handleApiResponse(response);
        
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
        
        console.log(`Loaded ${transactions.length} transactions for account ${accountId}`, transactions);
        
        // Store the transactions for filtering/sorting
        currentTransactions = transactions;
        
        // Process transactions to resolve category names
        processTransactions(currentTransactions);
        
        // Sort using current sort settings
        sortTransactions(currentSort.field, currentSort.direction);
        
        // Update transaction count if element exists
        const countEl = document.getElementById('transaction-count');
        if (countEl) {
            countEl.textContent = transactions.length;
        }
        
        // Display all transactions
        displayTransactions(currentTransactions);
        
        return transactions;
    } catch (error) {
        const loadingEl = document.getElementById('transaction-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
        
        console.error('Failed to load transactions:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
        return [];
    }
}

// Process transactions to add category names and handle split structure
function processTransactions(transactions) {
    transactions.forEach(transaction => {
        // Add category names
        if (transaction.category && !transaction.category_name) {
            const category = window.allCategories?.find(c => c.id === transaction.category);
            if (category) {
                transaction.category_name = category.name;
            }
        }
        
        // Mark split transactions properly - only if they actually have subtransactions
        if (transaction.subtransactions && transaction.subtransactions.length > 0) {
            transaction.is_parent = true;
            
            // Process category names for subtransactions
            transaction.subtransactions.forEach(subTrans => {
                if (subTrans.category && !subTrans.category_name) {
                    const category = window.allCategories?.find(c => c.id === subTrans.category);
                    if (category) {
                        subTrans.category_name = category.name;
                    }
                }
                subTrans.is_child = true;
                subTrans.parent_id = transaction.id;
            });
        } else {
            // If a transaction is marked as parent but has no subtransactions, fix that
            if (transaction.is_parent && (!transaction.subtransactions || transaction.subtransactions.length === 0)) {
                transaction.is_parent = false;
                console.log(`Fixing incorrectly marked parent transaction: ${transaction.id}`);
            }
        }
    });
}

// Sort transactions
function sortTransactions(field, direction) {
    // Update sort state
    currentSort = { field, direction };
    
    // Update header sort indicators
    document.querySelectorAll('th.sortable').forEach(th => {
        th.querySelector('.sort-icon').textContent = th.dataset.field === field 
            ? (direction === 'asc' ? '▲' : '▼') 
            : '';
    });
    
    // Sort the transactions
    currentTransactions.sort((a, b) => {
        let comparison = 0;
        
        // Compare values based on field type
        if (field === 'amount') {
            comparison = a.amount - b.amount;
        } else if (field === 'date') {
            comparison = a.date.localeCompare(b.date);
        } else if (field === 'payee') {
            comparison = (a.payee || '').localeCompare(b.payee || '');
        } else if (field === 'category') {
            comparison = (a.category || '').localeCompare(b.category || '');
        }
        
        // Apply sort direction
        return direction === 'asc' ? comparison : -comparison;
    });
    
    // Update display
    displayTransactions(currentTransactions);
}

// Apply transaction filters
function applyTransactionFilters() {
    const searchInput = document.getElementById('transaction-search');
    const searchText = searchInput.value.toLowerCase();
    
    const dateFilterSelect = document.getElementById('date-filter');
    const dateFilter = dateFilterSelect.value;
    
    let filteredTransactions = [...currentTransactions]; // Start with all transactions
    
    // Apply search text filter if any
    if (searchText) {
        filteredTransactions = filteredTransactions.filter(transaction => {
            return (
                (transaction.payee && transaction.payee.toLowerCase().includes(searchText)) ||
                (transaction.category && transaction.category.toLowerCase().includes(searchText)) ||
                (transaction.notes && transaction.notes.toLowerCase().includes(searchText))
            );
        });
    }
    
    // Apply date filter if any
    if (dateFilter) {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transDate = new Date(transaction.date);
            
            if (dateFilter === 'thisMonth') {
                return transDate.getMonth() === thisMonth && transDate.getFullYear() === thisYear;
            } else if (dateFilter === 'lastMonth') {
                const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                return transDate.getMonth() === lastMonth && transDate.getFullYear() === lastMonthYear;
            } else if (dateFilter === 'thisYear') {
                return transDate.getFullYear() === thisYear;
            }
            
            return true;
        });
    }
    
    // Update display with filtered transactions
    currentTransactions = filteredTransactions;
    displayTransactions(currentTransactions);
}

// Filter transactions based on search term
function filterTransactions(searchTerm, filterType) {
    if (!searchTerm) return currentTransactions;
    
    searchTerm = searchTerm.toLowerCase();
    
    return currentTransactions.filter(transaction => {
        // Default to searching all fields
        if (filterType === 'all') {
            return (
                (transaction.payee || '').toLowerCase().includes(searchTerm) ||
                (transaction.category || '').toLowerCase().includes(searchTerm) ||
                String(transaction.amount).includes(searchTerm) ||
                (transaction.notes || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Search specific field
        if (filterType === 'amount') {
            return String(transaction.amount).includes(searchTerm);
        }
        
        // For text fields
        return (transaction[filterType] || '').toLowerCase().includes(searchTerm);
    });
}

// Display transactions based on current filters and sort
function displayTransactions(transactions) {
    // Store transactions globally for operations
    currentTransactions = transactions;
    
    // Show transaction count
    const countEl = document.getElementById('transaction-count');
    if (countEl) {
        countEl.textContent = transactions.length;
    }
    
    // Organize transactions for display
    const organizedTransactions = organizeTransactionsByParent(transactions);
    
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    
    if (organizedTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No transactions found.</td></tr>';
        return;
    }
    
    organizedTransactions.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.dataset.id = transaction.id;
        
        // Only apply parent class if it has actual children
        const hasChildren = (transaction.children && transaction.children.length > 0) || 
                          (transaction.subtransactions && transaction.subtransactions.length > 0);
        
        if (hasChildren) {
            tr.classList.add('parent-transaction');
            transaction.is_parent = true; // Ensure consistency
        } else {
            transaction.is_parent = false; // Fix incorrect parent marking
        }
        
        if (transaction.is_child) {
            tr.classList.add('child-transaction');
        }
        
        // Format the category name for display
        let categoryDisplay = '';
        if (transaction.category_name) {
            categoryDisplay = transaction.category_name;
        } else if (transaction.category) {
            // Try to resolve from our global category list
            if (window.allCategories) {
                const category = window.allCategories.find(c => c.id === transaction.category);
                if (category) categoryDisplay = category.name;
            }
        }
        
        // For parent transactions with splits, indicate it's a split
        let splitIndicator = '';
        if (hasChildren) {
            const childCount = transaction.children?.length || transaction.subtransactions?.length || 0;
            // Only show split indicator if there are actual children
            if (childCount > 0) {
                splitIndicator = ` <span class="split-indicator">[Split:${childCount}]</span>`;
                categoryDisplay = 'Split Transaction';
            }
        }
        
        tr.innerHTML = `
            <td><input type="checkbox" class="transaction-checkbox" data-id="${transaction.id}"></td>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.payee || ''}${splitIndicator}</td>
            <td>${categoryDisplay || 'Uncategorized'}</td>
            <td class="${transaction.amount >= 0 ? 'positive-amount' : 'negative-amount'}">${formatCurrency(transaction.amount)}</td>
            <td>
                <div class="table-actions">
                    <button onclick="editTransaction('${transaction.id}')">Edit</button>
                    <button onclick="deleteTransaction('${transaction.id}')">Delete</button>
                    ${!transaction.is_child && !hasChildren ? `<button onclick="showSplitModal('${transaction.id}')">Split</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Only display children if there are actual children to display
        const childrenToDisplay = transaction.children && transaction.children.length > 0 
            ? transaction.children 
            : (transaction.subtransactions && transaction.subtransactions.length > 0 ? transaction.subtransactions : []);
            
        if (childrenToDisplay.length > 0) {
            // Add a split summary header
            const summaryRow = document.createElement('tr');
            summaryRow.classList.add('split-summary-row');
            summaryRow.innerHTML = `
                <td colspan="6">
                    <div class="split-summary-header">
                        <span class="split-summary-text">Split into ${childrenToDisplay.length} categories:</span>
                    </div>
                </td>
            `;
            tbody.appendChild(summaryRow);
            
            // Then add each child transaction
            childrenToDisplay.forEach((childTransaction, index) => {
                const childTr = document.createElement('tr');
                childTr.dataset.id = childTransaction.id || `${transaction.id}-child-${index}`;
                childTr.classList.add('child-transaction');
                
                // Add first/last child classes for styling
                if (index === 0) childTr.classList.add('first-child');
                if (index === childrenToDisplay.length - 1) childTr.classList.add('last-child');
                
                // Format the category name for child
                let childCategoryDisplay = '';
                if (childTransaction.category_name) {
                    childCategoryDisplay = childTransaction.category_name;
                } else if (childTransaction.category) {
                    // Try to resolve from our global category list
                    if (window.allCategories) {
                        const category = window.allCategories.find(c => c.id === childTransaction.category);
                        if (category) childCategoryDisplay = category.name;
                    }
                }
                
                // Calculate percentage of total for this split
                const percentage = Math.abs(childTransaction.amount) / Math.abs(transaction.amount) * 100;
                const percentageDisplay = percentage.toFixed(0) + '%';
                
                childTr.innerHTML = `
                    <td><input type="checkbox" class="transaction-checkbox" data-id="${childTransaction.id || `${transaction.id}-child-${index}`}"></td>
                    <td>⤷ ${formatDate(childTransaction.date || transaction.date)}</td>
                    <td>${childTransaction.payee || transaction.payee || ''}</td>
                    <td>
                        <div class="split-category-container">
                            <span class="split-category">${childCategoryDisplay || 'Uncategorized'}</span>
                            <span class="split-percentage">${percentageDisplay}</span>
                        </div>
                    </td>
                    <td class="${childTransaction.amount >= 0 ? 'positive-amount' : 'negative-amount'}">${formatCurrency(childTransaction.amount)}</td>
                    <td>
                        <div class="table-actions">
                            <button onclick="editTransaction('${childTransaction.id || `${transaction.id}-child-${index}`}')">Edit</button>
                            <button onclick="deleteTransaction('${childTransaction.id || `${transaction.id}-child-${index}`}')">Delete</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(childTr);
            });
        }
    });
    
    // Update batch delete button
    updateBatchDeleteButton();
}

// Organize transactions into parent-child hierarchy
function organizeTransactionsByParent(transactions) {
    console.log("Organizing transactions by parent:", transactions.length);
    const result = [];
    const transactionsMap = {};
    const childrenIds = new Set();
    
    // First pass: create a map of all transactions
    transactions.forEach(transaction => {
        transactionsMap[transaction.id] = { 
            ...transaction, 
            children: [],
            is_parent: transaction.is_parent || (transaction.subtransactions && transaction.subtransactions.length > 0)
        };
    });
    
    // Debug logging
    const parentIds = Object.values(transactionsMap)
        .filter(t => t.is_parent)
        .map(t => t.id);
    console.log(`Identified ${parentIds.length} parent transactions`);
    
    // Second pass: organize parents and children
    transactions.forEach(transaction => {
        const transactionCopy = transactionsMap[transaction.id];
        
        // Check if this is a child transaction
        if (transaction.is_child && transaction.parent_id) {
            childrenIds.add(transaction.id);
            
            // Add to parent's children if parent exists
            if (transactionsMap[transaction.parent_id]) {
                const parent = transactionsMap[transaction.parent_id];
                parent.is_parent = true;
                parent.children.push(transactionCopy);
            } else {
                // Parent not in filtered set, treat as regular transaction
                result.push(transactionCopy);
            }
        } else {
            // This is a regular transaction or a parent
            result.push(transactionCopy);
            
            // If it has subtransactions, process them
            if (transaction.subtransactions && transaction.subtransactions.length > 0) {
                transaction.subtransactions.forEach(subTrans => {
                    // Create a proper transaction object for the subtransaction
                    const subTransCopy = {
                        ...subTrans,
                        is_child: true,
                        parent_id: transaction.id
                    };
                    
                    // Add to parent's children array
                    transactionCopy.children.push(subTransCopy);
                    
                    // Mark as a child so it doesn't appear twice
                    childrenIds.add(subTrans.id);
                });
            }
        }
    });
    
    // Remove child transactions from the result if they're included in a parent
    const finalResult = result.filter(transaction => !childrenIds.has(transaction.id));
    
    // Final debugging
    console.log(`Final result has ${finalResult.length} top-level transactions`);
    finalResult.forEach(transaction => {
        if (transaction.is_parent) {
            console.log(`Parent ${transaction.id} has ${transaction.children.length} children`);
        }
    });
    
    return finalResult;
}

// Split transaction handling
async function showSplitModal(transactionId) {
    // Ensure categories are loaded before showing the modal
    if (!window.allCategories || window.allCategories.length === 0) {
        console.log("Loading categories for split modal...");
        await loadCategories();
    }
    
    // Get transaction details
    const transaction = currentTransactions.find(t => t.id === transactionId);
    if (!transaction) {
        showError('Transaction not found');
        return;
    }
    
    console.log("Opening split modal for transaction:", transaction);
    
    // Reset form and populate with transaction details
    const form = document.getElementById('split-transaction-form');
    form.reset();
    
    // Set transaction ID in hidden field
    document.getElementById('split-transaction-id').value = transactionId;
    
    // Set transaction details in the form
    document.getElementById('split-transaction-date').value = transaction.date;
    document.getElementById('split-transaction-payee').value = transaction.payee || '';
    document.getElementById('split-transaction-total').value = formatCurrency(transaction.amount);
    
    // Clear existing split items
    document.getElementById('split-items-container').innerHTML = '';
    
    // Add initial split items (at least 2)
    addSplitItem(transaction.amount, transaction.category);
    addSplitItem(0, '');
    
    // Update remaining amount
    updateSplitRemaining();
    
    // Show the modal
    document.getElementById('split-transaction-modal').style.display = 'block';
}

// Add a split item to the form
function addSplitItem(initialAmount = 0, initialCategory = '') {
    const container = document.getElementById('split-items-container');
    const splitCount = container.querySelectorAll('.split-item').length;
    
    const item = document.createElement('div');
    item.className = 'split-item';
    
    // Ensure categories are available
    if (!window.allCategories || window.allCategories.length === 0) {
        console.error("Categories not loaded for split item. This should not happen.");
        showError("Categories not loaded. Please try again.");
        return;
    }
    
    console.log(`Building category options with ${window.allCategories.length} categories for split item`);
    
    // Get categories for select options
    let categoryOptions = '<option value="">-- Select Category --</option>';
    
    // Sort categories by name for better usability
    const sortedCategories = [...window.allCategories].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCategories.forEach(category => {
        const selected = category.id === initialCategory ? 'selected' : '';
        categoryOptions += `<option value="${category.id}" ${selected}>${category.name}</option>`;
    });
    
    item.innerHTML = `
        <div class="split-row">
            <div class="split-category">
                <select class="split-category-select" onchange="updateSplitRemaining()">
                    ${categoryOptions}
                </select>
            </div>
            <div class="split-amount">
                <input type="number" class="split-amount-input" value="${initialAmount / 100}" 
                       step="0.01" onchange="updateSplitRemaining()">
            </div>
            <div class="split-notes">
                <input type="text" class="split-notes-input" placeholder="Notes">
            </div>
            <div class="split-actions">
                <button type="button" onclick="this.closest('.split-item').remove(); updateSplitRemaining()">Remove</button>
            </div>
        </div>
    `;
    
    container.appendChild(item);
    updateSplitRemaining();
}

// Update the remaining amount display
function updateSplitRemaining() {
    const transactionId = document.getElementById('split-transaction-id').value;
    const transaction = currentTransactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const totalAmount = transaction.amount;
    
    // Calculate sum of split amounts
    let splitSum = 0;
    document.querySelectorAll('.split-amount-input').forEach(input => {
        const amount = parseFloat(input.value) || 0;
        splitSum += Math.round(amount * 100); // Convert to cents
    });
    
    // Update remaining display
    const remaining = totalAmount - splitSum;
    const remainingEl = document.getElementById('split-remaining');
    remainingEl.textContent = formatCurrency(remaining);
    remainingEl.className = remaining === 0 ? 'balanced' : (remaining > 0 ? 'positive-amount' : 'negative-amount');
    
    // Enable/disable save button based on balance
    document.getElementById('submit-split').disabled = remaining !== 0;
}

// Submit split transaction form
async function submitSplitTransaction(event) {
    event.preventDefault();
    
    const transactionId = document.getElementById('split-transaction-id').value;
    if (!transactionId) {
        showError('Transaction ID is missing');
        return;
    }
    
    // Gather split data
    const splits = [];
    document.querySelectorAll('.split-item').forEach(item => {
        const categorySelect = item.querySelector('.split-category-select');
        const amountInput = item.querySelector('.split-amount-input');
        const notesInput = item.querySelector('.split-notes-input');
        
        if (categorySelect && amountInput) {
            const category = categorySelect.value;
            const amount = Math.round(parseFloat(amountInput.value) * 100); // Convert to cents
            const notes = notesInput ? notesInput.value : '';
            
            if (amount !== 0) {
                splits.push({
                    category,
                    amount,
                    notes
                });
            }
        }
    });
    
    if (splits.length < 2) {
        showError('At least two split items with non-zero amounts are required');
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${transactionId}/split`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ splits })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            // Close the modal
            document.getElementById('split-transaction-modal').style.display = 'none';
            
            // Reload transactions
            const accountSelect = document.getElementById('account-select');
            if (accountSelect.value) {
                loadTransactions(accountSelect.value);
            }
        }
    } catch (error) {
        console.error('Failed to split transaction:', error);
        showError('Failed to split transaction');
    }
}

// Load Categories (improved to properly handle loading)
async function loadCategories() {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return [];
    }
    
    try {
        console.log("Loading categories...");
        const response = await fetch('/api/categories');
        const categories = await handleApiResponse(response);
        
        console.log("Categories loaded from API:", categories);
        
        // Store categories globally for use in split form and transaction display
        window.allCategories = categories;
        
        const categorySelect = document.getElementById('transaction-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            // Sort categories by name for better usability
            categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
        
        console.log(`Successfully loaded ${categories.length} categories`);
        return categories;
    } catch (error) {
        console.error('Failed to load categories:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
        return [];
    }
}

// Add Transaction (improved to reload transactions and properly handle categories)
document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    const accountId = document.getElementById('account-select').value;
    if (!accountId) {
        showError('Please select an account');
        return;
    }
    
    const date = document.getElementById('transaction-date').value;
    const payee = document.getElementById('transaction-payee').value;
    const categoryId = document.getElementById('transaction-category').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const notes = document.getElementById('transaction-notes').value;
    
    // Validate inputs
    if (!date) {
        showError('Date is required');
        return;
    }
    
    if (isNaN(amount)) {
        showError('Amount must be a valid number');
        return;
    }
    
    // Find category name for logging
    let categoryName = "None";
    if (categoryId && window.allCategories) {
        const category = window.allCategories.find(c => c.id === categoryId);
        categoryName = category ? category.name : "Unknown";
    }
    
    console.log('Adding transaction:', {
        date,
        payee_name: payee,
        category: categoryId || null,
        category_name: categoryName,
        amount: Math.round(amount * 100),
        notes
    });
    
    try {
        // Show loading indicator if it exists
        const loadingEl = document.getElementById('transaction-loading');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
        
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId,
                transaction: {
                    date,
                    payee_name: payee,
                    category: categoryId || null, // Handle empty category
                    amount: Math.round(amount * 100), // Convert to cents
                    notes
                }
            })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            // Reset the form
            const form = document.getElementById('add-transaction-form');
            if (form) {
                form.reset();
            }
            
            // Set the date field to today's date
            const dateField = document.getElementById('transaction-date');
            if (dateField) {
                dateField.valueAsDate = new Date();
            }
            
            // Clear and refetch everything to ensure accurate data
            window.allCategories = null;
            
            try {
                const reloadedTransactions = await loadTransactions(accountId);
                console.log(`Reloaded ${reloadedTransactions ? reloadedTransactions.length : 0} transactions after adding`);
            } catch (reloadError) {
                console.error('Error reloading transactions:', reloadError);
                showError('Transaction added but could not refresh the list');
            }
        }
        
        // Hide loading indicator if it exists
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    } catch (error) {
        // Hide loading indicator if it exists
        const loadingEl = document.getElementById('transaction-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
        
        console.error('Failed to add transaction:', error);
        showError('Failed to add transaction: ' + (error.message || 'Unknown error'));
    }
});

// Load Budget Months
async function loadBudgetMonths() {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return [];
    }
    
    try {
        const response = await fetch('/api/budget/months');
        const months = await handleApiResponse(response);
        
        const monthSelect = document.getElementById('month-select');
        monthSelect.innerHTML = '';
        
        if (months.length === 0) {
            showError('No budget months found');
            return [];
        }
        
        // Sort months in ascending order
        months.sort();
        
        // Get current month in YYYY-MM format
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Find current month or closest month
        let defaultMonth = months[months.length - 1]; // Most recent month as fallback
        let currentMonthIndex = months.indexOf(currentMonth);
        
        if (currentMonthIndex !== -1) {
            defaultMonth = currentMonth;
        } else {
            // If current month not found, find the closest available month
            // that doesn't exceed the current month
            for (let i = months.length - 1; i >= 0; i--) {
                if (months[i] <= currentMonth) {
                    defaultMonth = months[i];
                    break;
                }
            }
        }
        
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = formatMonth(month);
            if (month === defaultMonth) {
                option.selected = true;
            }
            monthSelect.appendChild(option);
        });
        
        // Add change event to load budget month
        monthSelect.onchange = () => {
            if (monthSelect.value) loadBudgetMonth(monthSelect.value);
        };
        
        // Load the default month
        if (defaultMonth) {
            loadBudgetMonth(defaultMonth);
        }
        
        return months;
    } catch (error) {
        console.error('Failed to load budget months:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
        return [];
    }
}

// Load Budget Month
async function loadBudgetMonth(month) {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    try {
        const response = await fetch(`/api/budget/month/${month}`);
        const budget = await handleApiResponse(response);
        
        const tbody = document.getElementById('budget-body');
        tbody.innerHTML = '';
        
        if (!budget.categoryGroups || budget.categoryGroups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No categories found for this month.</td></tr>';
            return;
        }
        
        // Calculate summary values
        let totalBudgeted = 0;
        let totalIncome = 0;
        
        // Process each category group
        budget.categoryGroups.forEach(group => {
            // Add group header row
            const groupRow = document.createElement('tr');
            groupRow.classList.add('category-group-row');
            groupRow.innerHTML = `
                <td colspan="5" class="category-group-header">${group.name}</td>
            `;
            tbody.appendChild(groupRow);
            
            // Process categories within this group
            group.categories.forEach(category => {
                // Handle income vs expense categories differently
                const isIncome = group.is_income;
                
                // For income categories, track received amount as "income"
                if (isIncome && category.received) {
                    totalIncome += category.received;
                }
                
                // For expense categories, track budgeted amount
                if (!isIncome && category.budgeted) {
                    totalBudgeted += category.budgeted;
                }
                
                const tr = document.createElement('tr');
                
                // Add CSS class based on category type
                if (isIncome) {
                    tr.classList.add('income-category');
                }
                
                if (isIncome) {
                    // Income category row
                    tr.innerHTML = `
                        <td class="indent-category">${category.name}</td>
                        <td class="positive-amount">${formatCurrency(category.received || 0)}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                            <div class="table-actions">
                                <button disabled>Income Category</button>
                            </div>
                        </td>
                    `;
                } else {
                    // Expense category row
                    tr.innerHTML = `
                        <td class="indent-category">${category.name}</td>
                        <td class="${category.budgeted > 0 ? 'positive-amount' : ''}">${formatCurrency(category.budgeted || 0)}</td>
                        <td class="${category.spent < 0 ? 'negative-amount' : ''}">${formatCurrency(category.spent || 0)}</td>
                        <td class="${category.balance > 0 ? 'positive-amount' : category.balance < 0 ? 'negative-amount' : ''}">${formatCurrency(category.balance || 0)}</td>
                        <td>
                            <div class="table-actions">
                                <button onclick="setBudgetAmount('${month}', '${category.id}', ${category.budgeted || 0})">Set Budget</button>
                            </div>
                        </td>
                    `;
                }
                tbody.appendChild(tr);
            });
        });
        
        // Update summary cards
        document.getElementById('to-budget-amount').textContent = formatCurrency(budget.toBudget || 0);
        document.getElementById('budgeted-amount').textContent = formatCurrency(totalBudgeted);
        document.getElementById('income-amount').textContent = formatCurrency(totalIncome);
        
    } catch (error) {
        console.error('Failed to load budget month:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
    }
}

// Enhanced version of setBudgetAmount to allow setting the amount with a modal
function setBudgetAmount(month, categoryId, currentAmount) {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return;
    }
    
    const amount = prompt('Enter budget amount:', (currentAmount / 100).toFixed(2));
    if (amount === null) return;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        showError('Please enter a valid number');
        return;
    }
    
    fetch('/api/budget/set-amount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            month,
            categoryId,
            amount: Math.round(numericAmount * 100) // Convert to cents
        })
    })
    .then(response => handleApiResponse(response))
    .then(result => {
        if (result.success) {
            loadBudgetMonth(month);
        }
    })
    .catch(error => {
        console.error('Failed to set budget amount:', error);
        if (error.message && error.message.includes('No budget file is open')) {
            updateBudgetStatus(false);
            showSection('budgets');
        }
    });
}

// Helper Functions
function formatCurrency(cents) {
    if (cents === undefined || cents === null) return '$0.00';
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US').format(date);
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date(parseInt(year), parseInt(month) - 1));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    getDataDirectory();
    checkBudgetStatus().then(() => {
        showSection('budgets');
    });
    
    // Initialize date input with current date
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    // Initialize search and filter functionality
    initializeTransactionControls();
});

// Initialize transaction controls
function initializeTransactionControls() {
    // Search input handler
    const searchInput = document.getElementById('transaction-search');
    const filterTypeSelect = document.getElementById('search-filter-type');
    
    searchInput.addEventListener('input', () => {
        displayTransactions();
    });
    
    filterTypeSelect.addEventListener('change', () => {
        displayTransactions();
    });
    
    // Clear search button
    document.getElementById('clear-search').addEventListener('click', () => {
        searchInput.value = '';
        filterTypeSelect.value = 'all';
        displayTransactions();
    });
    
    // Sort headers
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            
            // Toggle direction if already sorting by this field
            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            
            // Update sort icons
            updateSortIcons();
            
            // Sort and display
            sortTransactions();
            displayTransactions();
        });
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    selectAllCheckbox.addEventListener('change', () => {
        const isChecked = selectAllCheckbox.checked;
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateBatchDeleteButton();
    });
    
    // Select all button
    document.getElementById('select-all-transactions').addEventListener('click', () => {
        selectAllCheckbox.checked = true;
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateBatchDeleteButton();
    });
    
    // Batch delete button
    document.getElementById('batch-delete').addEventListener('click', batchDeleteTransactions);
    
    // Add delegation for checkbox changes
    document.getElementById('transactions-body').addEventListener('change', event => {
        if (event.target.classList.contains('transaction-checkbox')) {
            updateBatchDeleteButton();
        }
    });
}

// Update sort icons to reflect current sort state
function updateSortIcons() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const field = th.dataset.sort;
        const iconSpan = th.querySelector('.sort-icon');
        
        if (field === currentSort.field) {
            iconSpan.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
            iconSpan.style.opacity = '1';
        } else {
            iconSpan.textContent = '↕';
            iconSpan.style.opacity = '0.3';
        }
    });
}

// Delete a single transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            // Remove from current transactions
            currentTransactions = currentTransactions.filter(t => t.id !== id);
            
            // Update display
            displayTransactions();
        }
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        showError('Failed to delete transaction');
    }
}

// Batch delete selected transactions
async function batchDeleteTransactions() {
    const selected = Array.from(document.querySelectorAll('.transaction-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);
    
    if (selected.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selected.length} transaction(s)?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/transactions/batch-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: selected })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            // Remove from current transactions
            currentTransactions = currentTransactions.filter(t => !selected.includes(t.id));
            
            // Reset select all checkbox
            document.getElementById('select-all-checkbox').checked = false;
            
            // Update display
            displayTransactions();
        }
    } catch (error) {
        console.error('Failed to delete transactions:', error);
        showError('Failed to delete transactions');
    }
}

// Edit transaction
function editTransaction(id) {
    // For now, just display an alert
    alert(`Edit transaction ${id} - This feature will be implemented soon`);
    // TODO: Implement transaction editing
}

// Report-related functions

// Navigation between reports
document.getElementById('reports-btn').addEventListener('click', () => {
    if (isBudgetLoaded) showSection('reports');
});

// Update UI based on budget status (modify existing function)
function updateBudgetStatus(isLoaded) {
    isBudgetLoaded = isLoaded;
    const statusBar = document.getElementById('status-bar');
    const accountsBtn = document.getElementById('accounts-btn');
    const transactionsBtn = document.getElementById('transactions-btn');
    const budgetBtn = document.getElementById('budget-btn');
    const categoriesBtn = document.getElementById('categories-btn');
    const reportsBtn = document.getElementById('reports-btn'); // Add this line
    
    if (isLoaded) {
        statusBar.textContent = 'Budget loaded successfully';
        statusBar.classList.add('success', 'active');
        accountsBtn.disabled = false;
        transactionsBtn.disabled = false;
        budgetBtn.disabled = false;
        categoriesBtn.disabled = false;
        reportsBtn.disabled = false; // Add this line
    } else {
        statusBar.textContent = 'No budget loaded. Please select a budget file.';
        statusBar.classList.remove('success');
        statusBar.classList.add('active');
        accountsBtn.disabled = true;
        transactionsBtn.disabled = true;
        budgetBtn.disabled = true;
        categoriesBtn.disabled = true;
        reportsBtn.disabled = true; // Add this line
    }
}

// Update showSection function to handle reports (modify existing function)
function showSection(section) {
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${section}-section`).classList.remove('hidden');
    document.getElementById(`${section}-btn`).classList.add('active');
    
    if (section === 'budgets') loadBudgets();
    if (section === 'accounts' && isBudgetLoaded) loadAccounts();
    if (section === 'transactions' && isBudgetLoaded) {
        loadAccounts().then(() => {
            const accountSelect = document.getElementById('account-select');
            if (accountSelect.value) loadTransactions(accountSelect.value);
        });
        loadCategories();
    }
    if (section === 'budget' && isBudgetLoaded) {
        loadBudgetMonths().then(() => {
            const monthSelect = document.getElementById('month-select');
            if (monthSelect.value) loadBudgetMonth(monthSelect.value);
        });
    }
    if (section === 'categories' && isBudgetLoaded) {
        loadCategoryGroups();
    }
    if (section === 'reports' && isBudgetLoaded) {
        // Initialize the reports section
        loadSpendingByCategory();
        loadSavedReports();
        
        // Set up default date range (last 3 months)
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        document.getElementById('report-end-date').value = formatDateForInput(today);
        document.getElementById('report-start-date').value = formatDateForInput(threeMonthsAgo);
    }
}

// Helper to format dates for input fields
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Report navigation
document.getElementById('spending-category-btn').addEventListener('click', (e) => {
    showReport('spending-category');
    setActiveReportBtn(e.target);
    loadSpendingByCategory();
});

document.getElementById('income-expenses-btn').addEventListener('click', (e) => {
    showReport('income-expenses');
    setActiveReportBtn(e.target);
    loadIncomeVsExpenses();
});

document.getElementById('balance-history-btn').addEventListener('click', (e) => {
    showReport('balance-history');
    setActiveReportBtn(e.target);
    loadBalanceHistory();
});

// Set active report button
function setActiveReportBtn(button) {
    document.querySelectorAll('.report-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

// Show selected report
function showReport(reportId) {
    document.querySelectorAll('.report-container').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById(`${reportId}-report`).classList.remove('hidden');
}

// Date range controls
document.getElementById('apply-date-range').addEventListener('click', () => {
    // Get the active report and reload it with date range
    const activeReport = document.querySelector('.report-nav-btn.active').id;
    
    if (activeReport === 'spending-category-btn') {
        loadSpendingByCategory();
    } else if (activeReport === 'income-expenses-btn') {
        loadIncomeVsExpenses();
    } else if (activeReport === 'balance-history-btn') {
        loadBalanceHistory();
    }
});

document.getElementById('reset-date-range').addEventListener('click', () => {
    // Clear date range and reload
    document.getElementById('report-start-date').value = '';
    document.getElementById('report-end-date').value = '';
    
    // Reload active report
    const activeReport = document.querySelector('.report-nav-btn.active').id;
    
    if (activeReport === 'spending-category-btn') {
        loadSpendingByCategory();
    } else if (activeReport === 'income-expenses-btn') {
        loadIncomeVsExpenses();
    } else if (activeReport === 'balance-history-btn') {
        loadBalanceHistory();
    }
});

// Chart instances (to destroy before recreating)
let categoryChart = null;
let incomeExpensesChart = null;
let balanceHistoryChart = null;

// Load Spending by Category report
async function loadSpendingByCategory() {
    try {
        // Show loading indicator
        showReportLoading('category-chart-container');
        
        // Get date range if specified
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        // Build URL with query parameters
        let url = '/api/reports/spending-by-category';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        // Hide loading indicator
        hideReportLoading('category-chart-container');
        
        // Update summary cards
        document.getElementById('total-spending').textContent = formatCurrency(data.summary.totalSpending);
        document.getElementById('category-count').textContent = data.summary.categoryCount;
        document.getElementById('transaction-count').textContent = data.summary.transactionCount;
        
        // Create the chart
        createCategoryChart(data);
        
        // Populate the table
        const tbody = document.getElementById('category-spending-body');
        tbody.innerHTML = '';
        
        data.categories.forEach(category => {
            const percentage = (category.total / data.summary.totalSpending) * 100;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${category.name}</td>
                <td>${formatCurrency(category.total)}</td>
                <td>
                    <div class="progress-bar-cell">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                        <span class="progress-text">${percentage.toFixed(1)}%</span>
                    </div>
                </td>
                <td>${category.count}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        hideReportLoading('category-chart-container');
        console.error('Failed to load spending by category data:', error);
        showError('Failed to load report data');
    }
}

// Show and hide loading indicator
function showReportLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create loading indicator if it doesn't exist
    if (!container.querySelector('.loading-indicator')) {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator';
        loadingEl.innerHTML = 'Loading data...';
        container.appendChild(loadingEl);
    }
    
    // Show the loading indicator
    container.querySelector('.loading-indicator').style.display = 'flex';
}

function hideReportLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loadingEl = container.querySelector('.loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Save current report configuration
document.getElementById('save-current-report').addEventListener('click', async () => {
    const reportName = prompt('Enter a name for this report configuration:');
    if (!reportName) return;
    
    // Get active report type
    const activeReportButton = document.querySelector('.report-nav-btn.active');
    if (!activeReportButton) return;
    
    const reportType = activeReportButton.id.replace('-btn', '');
    
    // Get date range
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    try {
        const response = await fetch('/api/reports/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reportType,
                configuration: {
                    name: reportName,
                    dateRange: {
                        startDate,
                        endDate
                    }
                }
            })
        });
        
        const result = await handleApiResponse(response);
        if (result.success) {
            showError('Report configuration saved successfully');
            loadSavedReports();
        }
    } catch (error) {
        console.error('Failed to save report configuration:', error);
        showError('Failed to save report configuration');
    }
});

// Load saved report configurations
async function loadSavedReports() {
    try {
        const response = await fetch('/api/reports/config');
        const data = await handleApiResponse(response);
        
        const savedReportSelect = document.getElementById('saved-report-select');
        savedReportSelect.innerHTML = '<option value="">-- Select Saved Report --</option>';
        
        data.savedReports.forEach(report => {
            const option = document.createElement('option');
            option.value = JSON.stringify(report);
            option.textContent = report.name;
            savedReportSelect.appendChild(option);
        });
        
        // Add event listener to load saved report if not already added
        if (!savedReportSelect.dataset.listenerAdded) {
            savedReportSelect.addEventListener('change', loadSavedReport);
            savedReportSelect.dataset.listenerAdded = 'true';
        }
    } catch (error) {
        console.error('Failed to load saved reports:', error);
    }
}

// Load a saved report configuration
function loadSavedReport() {
    const savedReportSelect = document.getElementById('saved-report-select');
    if (!savedReportSelect.value) return;
    
    try {
        const reportConfig = JSON.parse(savedReportSelect.value);
        
        // Set date range inputs
        if (reportConfig.dateRange) {
            document.getElementById('report-start-date').value = reportConfig.dateRange.startDate || '';
            document.getElementById('report-end-date').value = reportConfig.dateRange.endDate || '';
        }
        
        // Switch to the correct report type
        const reportButton = document.getElementById(`${reportConfig.reportType}-btn`);
        if (reportButton) {
            reportButton.click();
        }
    } catch (error) {
        console.error('Failed to load saved report:', error);
        showError('Failed to load saved report configuration');
    }
}

// Load Income vs Expenses report
async function loadIncomeVsExpenses() {
    try {
        const response = await fetch('/api/reports/income-vs-expenses');
        const data = await handleApiResponse(response);
        
        // Update summary cards
        document.getElementById('total-income').textContent = formatCurrency(data.summary.totalIncome);
        document.getElementById('total-expenses').textContent = formatCurrency(data.summary.totalExpenses);
        
        const netIncomeElement = document.getElementById('net-income');
        netIncomeElement.textContent = formatCurrency(data.summary.netIncome);
        netIncomeElement.className = 'summary-value ' + (data.summary.netIncome >= 0 ? 'positive-amount' : 'negative-amount');
        
        // Create the chart
        createIncomeExpensesChart(data);
        
        // Populate the table
        const tbody = document.getElementById('monthly-income-expenses-body');
        tbody.innerHTML = '';
        
        data.monthly.forEach(month => {
            const netIncome = month.income - month.expenses;
            const netClass = netIncome >= 0 ? 'positive-amount' : 'negative-amount';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatMonthLabel(month.month)}</td>
                <td>${formatCurrency(month.income)}</td>
                <td>${formatCurrency(month.expenses)}</td>
                <td class="${netClass}">${formatCurrency(netIncome)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Failed to load income vs expenses data:', error);
        showError('Failed to load report data');
    }
}

// Format month for display (YYYY-MM to Month Year)
function formatMonthLabel(monthStr) {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Create or update income vs expenses chart
function createIncomeExpensesChart(data) {
    // Destroy existing chart if it exists
    if (incomeExpensesChart) {
        incomeExpensesChart.destroy();
    }
    
    const ctx = document.getElementById('income-expenses-chart').getContext('2d');
    
    // Prepare chart data
    const months = data.monthly.slice(-12); // Last 12 months
    const labels = months.map(m => formatMonthLabel(m.month));
    const incomeData = months.map(m => m.income / 100); // Convert to dollars
    const expenseData = months.map(m => m.expenses / 100); // Convert to dollars
    
    incomeExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Income vs Expenses',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `${context.dataset.label}: ${formatCurrency(value * 100)}`;
                        }
                    }
                }
            }
        }
    });
}

// Load Balance History report
async function loadBalanceHistory() {
    try {
        // First load accounts to populate account selector
        const accountsResponse = await fetch('/api/accounts');
        const accounts = await handleApiResponse(accountsResponse);
        
        // Update account selector
        const accountSelect = document.getElementById('balance-history-account');
        accountSelect.innerHTML = '<option value="">Select an account</option>';
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            accountSelect.appendChild(option);
        });
        
        // Add event listener to account selector
        if (!accountSelect.dataset.listenerAdded) {
            accountSelect.addEventListener('change', () => {
                if (accountSelect.value) {
                    loadAccountBalanceHistory(accountSelect.value);
                }
            });
            accountSelect.dataset.listenerAdded = 'true';
        }
        
        // If there's only one account, select it automatically
        if (accounts.length === 1) {
            accountSelect.value = accounts[0].id;
            loadAccountBalanceHistory(accounts[0].id);
        }
        
        // Clear chart area if no account is selected
        if (!accountSelect.value) {
            // Clear chart
            if (balanceHistoryChart) {
                balanceHistoryChart.destroy();
                balanceHistoryChart = null;
            }
            
            // Clear table
            document.getElementById('balance-history-body').innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load accounts for balance history:', error);
        showError('Failed to load account data');
    }
}

// Load balance history for a specific account
async function loadAccountBalanceHistory(accountId) {
    try {
        const response = await fetch('/api/reports/account-balance-history');
        const allAccountsData = await handleApiResponse(response);
        
        // Find the selected account
        const accountData = allAccountsData.find(a => a.id === accountId);
        
        if (!accountData) {
            showError('Account data not found');
            return;
        }
        
        // Create the chart
        createBalanceHistoryChart(accountData);
        
        // Populate the table
        const tbody = document.getElementById('balance-history-body');
        tbody.innerHTML = '';
        
        let previousBalance = 0;
        accountData.history.forEach((entry, index) => {
            const change = index === 0 ? entry.balance : entry.balance - previousBalance;
            const changeClass = change >= 0 ? 'positive-amount' : 'negative-amount';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(entry.date)}</td>
                <td>${formatCurrency(entry.balance)}</td>
                <td class="${changeClass}">${formatCurrency(change)}</td>
            `;
            tbody.appendChild(tr);
            
            previousBalance = entry.balance;
        });
    } catch (error) {
        console.error('Failed to load balance history data:', error);
        showError('Failed to load balance history');
    }
}

// Create or update balance history chart
function createBalanceHistoryChart(accountData) {
    // Destroy existing chart if it exists
    if (balanceHistoryChart) {
        balanceHistoryChart.destroy();
    }
    
    const ctx = document.getElementById('balance-history-chart').getContext('2d');
    
    // Prepare chart data
    const labels = accountData.history.map(entry => formatDate(entry.date));
    const balances = accountData.history.map(entry => entry.balance / 100); // Convert to dollars
    
    balanceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Account Balance',
                data: balances,
                fill: false,
                borderColor: 'rgba(46, 125, 50, 1)',
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(46, 125, 50, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Balance History: ${accountData.name}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Balance: ${formatCurrency(value * 100)}`;
                        }
                    }
                }
            }
        }
    });
}

// Generate colors for charts
function generateColors(count) {
    const baseColors = [
        'rgba(46, 125, 50, 0.7)',    // Green
        'rgba(3, 169, 244, 0.7)',    // Light Blue
        'rgba(156, 39, 176, 0.7)',   // Purple
        'rgba(255, 152, 0, 0.7)',    // Orange
        'rgba(233, 30, 99, 0.7)',    // Pink
        'rgba(0, 188, 212, 0.7)',    // Cyan
        'rgba(139, 195, 74, 0.7)',   // Light Green
        'rgba(121, 85, 72, 0.7)',    // Brown
        'rgba(33, 150, 243, 0.7)',   // Blue
        'rgba(255, 87, 34, 0.7)'     // Deep Orange
    ];
    
    // If we need more colors than our base set, generate them
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // Generate additional colors by shifting hue
    const result = [...baseColors];
    const additionalNeeded = count - baseColors.length;
    
    for (let i = 0; i < additionalNeeded; i++) {
        const hue = (i * 137) % 360; // Use golden angle approximation for even distribution
        result.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    
    return result;
}

// Re-add the createCategoryChart function that was accidentally removed
function createCategoryChart(data) {
    // Destroy existing chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Prepare chart data
    const categories = data.categories.slice(0, 10); // Top 10 categories
    const labels = categories.map(c => c.name);
    const values = categories.map(c => c.total / 100); // Convert to dollars for display
    
    // Generate colors for pie chart
    const backgroundColors = generateColors(categories.length);
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Categories by Spending',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${formatCurrency(value * 100)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create Budget Form Handler
document.getElementById('create-budget-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const budgetName = document.getElementById('new-budget-name').value.trim();
    if (!budgetName) {
        showError('Budget name is required');
        return;
    }
    
    createBudget(budgetName);
});

// Function to create a new budget
async function createBudget(budgetName) {
    try {
        const response = await fetch('/api/budgets/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ budgetName })
        });
        
        const result = await handleApiResponse(response);
        
        if (result.success) {
            showSuccess(result.message);
            loadBudgets(); // Reload the budgets list
            
            // Clear the form
            document.getElementById('new-budget-name').value = '';
        }
    } catch (error) {
        console.error('Failed to create budget:', error);
        showError('Failed to create budget: ' + (error.message || 'Unknown error'));
    }
}

// Copy last month's budget
document.getElementById('copy-last-month').addEventListener('click', async function() {
    const monthSelect = document.getElementById('month-select');
    const currentMonth = monthSelect.value;
    
    if (!currentMonth) {
        showError('Please select a month first');
        return;
    }
    
    try {
        // Get all budget months to find the previous month
        const response = await fetch('/api/budget/months');
        const months = await handleApiResponse(response);
        
        // Find current month index
        const currentIndex = months.findIndex(m => m === currentMonth);
        if (currentIndex <= 0) {
            showError('No previous month found to copy from');
            return;
        }
        
        // Get previous month's budget
        const prevMonth = months[currentIndex - 1];
        const prevBudgetResponse = await fetch(`/api/budget/month/${prevMonth}`);
        const prevBudget = await handleApiResponse(prevBudgetResponse);
        
        // Check if we have nested category groups (new structure)
        if (!prevBudget.categoryGroups) {
            showError('Unable to copy budget: Previous month data format is unexpected');
            return;
        }
        
        // For each category group and each category, copy the budgeted amount
        let copyCount = 0;
        
        for (const group of prevBudget.categoryGroups) {
            // Skip income groups since we don't budget for income
            if (group.is_income) continue;
            
            for (const category of group.categories) {
                // Only copy non-zero budgeted amounts
                if (category.budgeted > 0) {
                    await fetch('/api/budget/set-amount', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            month: currentMonth,
                            categoryId: category.id,
                            amount: category.budgeted
                        })
                    });
                    copyCount++;
                }
            }
        }
        
        // Reload the current month's budget
        loadBudgetMonth(currentMonth);
        showSuccess(`Copied budget amounts from ${formatMonth(prevMonth)} (${copyCount} categories)`);
    } catch (error) {
        console.error('Failed to copy budget from previous month:', error);
        showError('Failed to copy budget: ' + (error.message || 'Unknown error'));
    }
});

// Reset budgets to zero
document.getElementById('reset-budgets').addEventListener('click', async function() {
    const monthSelect = document.getElementById('month-select');
    const currentMonth = monthSelect.value;
    
    if (!currentMonth) {
        showError('Please select a month first');
        return;
    }
    
    // Confirm before resetting
    if (!confirm('Are you sure you want to reset all budget amounts to zero?')) {
        return;
    }
    
    try {
        // Get current month's budget
        const budgetResponse = await fetch(`/api/budget/month/${currentMonth}`);
        const budget = await handleApiResponse(budgetResponse);
        
        // Check if we have nested category groups (new structure)
        if (!budget.categoryGroups) {
            showError('Unable to reset budget: Data format is unexpected');
            return;
        }
        
        // For each category group and each category, set the budgeted amount to zero
        let resetCount = 0;
        
        for (const group of budget.categoryGroups) {
            // Skip income groups since we don't budget for income
            if (group.is_income) continue;
            
            for (const category of group.categories) {
                // Only reset non-zero budgeted amounts
                if (category.budgeted !== 0) {
                    await fetch('/api/budget/set-amount', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            month: currentMonth,
                            categoryId: category.id,
                            amount: 0
                        })
                    });
                    resetCount++;
                }
            }
        }
        
        // Reload the current month's budget
        loadBudgetMonth(currentMonth);
        showSuccess(`Reset ${resetCount} category budgets to zero`);
    } catch (error) {
        console.error('Failed to reset budgets:', error);
        showError('Failed to reset budgets: ' + (error.message || 'Unknown error'));
    }
});

// Add this right after the showError function
function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    // Find the success container or create one
    let container = document.getElementById('success-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'success-container';
        // document.querySelector('.content').prepend(container);
        
        // Use the currently visible section or body as parent
        const visibleSection = document.querySelector('section:not(.hidden)') || document.body;
        visibleSection.prepend(container);
    }
    
    container.appendChild(successElement);
    
    // Remove after animation completes
    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

// CATEGORY MANAGEMENT FUNCTIONS

// Load category groups and their categories using the optimized endpoint
async function loadCategoriesGrouped() {
    if (!isBudgetLoaded) {
        showError('Please load a budget first');
        showSection('budgets');
        return [];
    }
    
    try {
        console.log("Loading categories grouped by parent groups...");
        
        // Use timeout to prevent hanging if server is unresponsive
        const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                clearTimeout(id);
                return response;
            } catch (error) {
                clearTimeout(id);
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out - server may be unresponsive');
                }
                throw error;
            }
        };
        
        // Make the API call with timeout protection
        const response = await fetchWithTimeout('/api/categories/grouped');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        // Use try-catch to ensure we can handle parsing errors
        let categoryGroups;
        try {
            categoryGroups = await response.json();
        } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            throw new Error('Failed to parse server response. The server may be experiencing issues.');
        }
        
        console.log("Categories grouped by parent groups loaded:", categoryGroups);
        
        if (!Array.isArray(categoryGroups) || categoryGroups.length === 0) {
            console.log("No category groups found or empty array returned");
            document.getElementById('category-groups-container').innerHTML = `
                <div class="empty-state">
                    <p>No category groups found. Create your first category group to get started.</p>
                </div>
            `;
            return [];
        }
        
        // Render content inside a try-catch to prevent UI errors
        try {
            const container = document.getElementById('category-groups-container');
            container.innerHTML = '';
            
            // Sort groups: first regular groups, then income groups
            categoryGroups.sort((a, b) => {
                if (a.is_income === b.is_income) {
                    return a.name.localeCompare(b.name);
                }
                return a.is_income ? 1 : -1;
            });
            
            // Create DOM elements for each group and its categories
            categoryGroups.forEach(group => {
                try {
                    const groupEl = document.createElement('div');
                    groupEl.className = `category-group ${group.is_income ? 'income-group' : ''} ${group.hidden ? 'hidden-group' : ''}`;
                    
                    // Group header
                    const header = document.createElement('div');
                    header.className = 'category-group-header';
                    header.innerHTML = `
                        <div class="category-group-title">${group.name}</div>
                        <div class="category-group-actions">
                            <button class="add-category-btn" data-group-id="${group.id}" data-is-income="${group.is_income}">Add Category</button>
                            <button class="edit-group-btn" data-group-id="${group.id}">Edit</button>
                            <button class="delete-group-btn" data-group-id="${group.id}">Delete</button>
                        </div>
                    `;
                    
                    // Categories list
                    const categoriesList = document.createElement('ul');
                    categoriesList.className = 'category-list';
                    
                    // Sort categories by name
                    if (group.categories && Array.isArray(group.categories)) {
                        group.categories.sort((a, b) => a.name.localeCompare(b.name));
                        
                        if (group.categories.length === 0) {
                            const emptyItem = document.createElement('li');
                            emptyItem.className = 'category-empty';
                            emptyItem.textContent = 'No categories in this group. Add one using the "Add Category" button.';
                            categoriesList.appendChild(emptyItem);
                        } else {
                            group.categories.forEach(category => {
                                try {
                                    const categoryItem = document.createElement('li');
                                    categoryItem.className = `category-item ${category.hidden ? 'hidden-category' : ''}`;
                                    categoryItem.innerHTML = `
                                        <div class="category-name">${category.name}</div>
                                        <div class="category-actions">
                                            <button class="edit-category-btn" data-category-id="${category.id}">Edit</button>
                                            <button class="delete-category-btn" data-category-id="${category.id}">Delete</button>
                                        </div>
                                    `;
                                    categoriesList.appendChild(categoryItem);
                                } catch (categoryRenderError) {
                                    console.error(`Error rendering category ${category?.id || 'unknown'}:`, categoryRenderError);
                                }
                            });
                        }
                    } else {
                        console.warn(`Invalid or missing categories for group ${group.name}`);
                        const errorItem = document.createElement('li');
                        errorItem.className = 'category-error';
                        errorItem.textContent = 'Error loading categories for this group.';
                        categoriesList.appendChild(errorItem);
                    }
                    
                    // Append elements
                    groupEl.appendChild(header);
                    groupEl.appendChild(categoriesList);
                    container.appendChild(groupEl);
                } catch (groupRenderError) {
                    console.error(`Error rendering group ${group?.id || 'unknown'}:`, groupRenderError);
                }
            });
            
            // Add event listeners for category actions
            try {
                setupCategoryEventListeners();
            } catch (listenerError) {
                console.error('Error setting up category event listeners:', listenerError);
                showError('Error setting up interactions. Try refreshing the page.');
            }
        } catch (renderError) {
            console.error('Error rendering category groups:', renderError);
            showError('Error displaying categories. Please try refreshing the page.');
        }
        
        return categoryGroups;
    } catch (error) {
        console.error('Failed to load categories grouped by parent groups:', error);
        
        // Show more helpful error message based on error type
        let errorMessage = error.message || 'Unknown error';
        if (errorMessage.includes('No budget file is open')) {
            showError('No budget is loaded. Please load a budget first.');
            updateBudgetStatus(false);
            showSection('budgets');
        } else if (errorMessage.includes('timed out')) {
            showError('Server request timed out. The server may be unresponsive. Try refreshing the page or restarting the server.');
        } else {
            showError('Failed to load categories grouped by parent groups: ' + errorMessage);
            
            // Show empty state with error
            document.getElementById('category-groups-container').innerHTML = `
                <div class="error-state">
                    <p>Error loading categories and groups: ${errorMessage}</p>
                    <p>Please try reloading the page or loading a different budget.</p>
                </div>
            `;
        }
        
        return [];
    }
}

// Update the existing loadCategoryGroups function to use the new optimized endpoint
async function loadCategoryGroups() {
    // Use the new optimized endpoint function
    return loadCategoriesGrouped();
}

// Setup event listeners for category management
function setupCategoryEventListeners() {
    // Add Category Group button
    document.getElementById('add-category-group-btn').addEventListener('click', () => {
        // Reset form
        document.getElementById('category-group-form').reset();
        document.getElementById('category-group-id').value = '';
        document.getElementById('category-group-modal-title').textContent = 'Add Category Group';
        
        // Show modal
        document.getElementById('category-group-modal').style.display = 'block';
    });
    
    // Add Category buttons
    document.querySelectorAll('.add-category-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Reset form
            document.getElementById('category-form').reset();
            document.getElementById('category-id').value = '';
            document.getElementById('category-modal-title').textContent = 'Add Category';
            
            // Set the group ID
            const groupId = button.getAttribute('data-group-id');
            const isIncome = button.getAttribute('data-is-income') === 'true';
            document.getElementById('category-group-id-field').value = groupId;
            
            // Load group dropdown but select the current group
            loadCategoryGroupDropdown(groupId);
            
            // Show modal
            document.getElementById('category-modal').style.display = 'block';
        });
    });
    
    // Edit Category Group buttons
    document.querySelectorAll('.edit-group-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const groupId = button.getAttribute('data-group-id');
            await editCategoryGroup(groupId);
        });
    });
    
    // Delete Category Group buttons
    document.querySelectorAll('.delete-group-btn').forEach(button => {
        button.addEventListener('click', () => {
            const groupId = button.getAttribute('data-group-id');
            deleteCategoryGroup(groupId);
        });
    });
    
    // Edit Category buttons
    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const categoryId = button.getAttribute('data-category-id');
            await editCategory(categoryId);
        });
    });
    
    // Delete Category buttons
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.getAttribute('data-category-id');
            deleteCategory(categoryId);
        });
    });
}

// Load category groups dropdown for the category modal
async function loadCategoryGroupDropdown(selectedGroupId) {
    try {
        const response = await fetch('/api/category-groups');
        const groups = await handleApiResponse(response);
        
        const select = document.getElementById('category-group-select');
        select.innerHTML = '';
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name + (group.is_income ? ' (Income)' : '');
            option.selected = group.id === selectedGroupId;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load category groups for dropdown:', error);
        showError('Failed to load category groups');
    }
}

// Edit Category Group
async function editCategoryGroup(groupId) {
    try {
        const response = await fetch('/api/category-groups');
        const groups = await handleApiResponse(response);
        
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            showError('Category group not found');
            return;
        }
        
        // Populate form
        document.getElementById('category-group-id').value = group.id;
        document.getElementById('category-group-name').value = group.name;
        document.getElementById('category-group-is-income').checked = group.is_income;
        
        // Update modal title
        document.getElementById('category-group-modal-title').textContent = 'Edit Category Group';
        
        // Show modal
        document.getElementById('category-group-modal').style.display = 'block';
    } catch (error) {
        console.error('Failed to edit category group:', error);
        showError('Failed to load category group details');
    }
}

// Delete Category Group
function deleteCategoryGroup(groupId) {
    // Set up the confirm delete modal
    document.getElementById('confirm-delete-message').textContent = 
        'Are you sure you want to delete this category group? All categories in this group will also be deleted.';
    
    // Show transfer options for categories if needed
    document.getElementById('transfer-category-container').classList.add('hidden');
    
    // Set up the confirm button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.onclick = async () => {
        try {
            const response = await fetch(`/api/category-groups/${groupId}`, {
                method: 'DELETE'
            });
            
            await handleApiResponse(response);
            
            // Close modal and reload
            document.getElementById('confirm-delete-modal').style.display = 'none';
            loadCategoryGroups();
            showSuccess('Category group deleted successfully');
        } catch (error) {
            console.error('Failed to delete category group:', error);
            showError('Failed to delete category group: ' + (error.message || 'Unknown error'));
        }
    };
    
    // Show the confirm delete modal
    document.getElementById('confirm-delete-modal').style.display = 'block';
}

// Edit Category
async function editCategory(categoryId) {
    try {
        // Get all categories
        const categoriesResponse = await fetch('/api/categories');
        const categories = await handleApiResponse(categoriesResponse);
        
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            showError('Category not found');
            return;
        }
        
        // Populate form
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-group-id-field').value = category.group_id;
        
        // Load group dropdown
        await loadCategoryGroupDropdown(category.group_id);
        
        // Update modal title
        document.getElementById('category-modal-title').textContent = 'Edit Category';
        
        // Show modal
        document.getElementById('category-modal').style.display = 'block';
    } catch (error) {
        console.error('Failed to edit category:', error);
        showError('Failed to load category details');
    }
}

// Delete Category
function deleteCategory(categoryId) {
    // Load all categories for the transfer dropdown
    loadTransferCategoriesDropdown(categoryId).then(() => {
        // Set up the confirm delete modal
        document.getElementById('confirm-delete-message').textContent = 
            'Are you sure you want to delete this category?';
        
        // Show transfer options
        document.getElementById('transfer-category-container').classList.remove('hidden');
        
        // Set up the confirm button
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.onclick = async () => {
            try {
                const transferCategoryId = document.getElementById('transfer-category-select').value;
                const url = transferCategoryId 
                    ? `/api/categories/${categoryId}?transferCategoryId=${transferCategoryId}`
                    : `/api/categories/${categoryId}`;
                
                const response = await fetch(url, {
                    method: 'DELETE'
                });
                
                await handleApiResponse(response);
                
                // Close modal and reload
                document.getElementById('confirm-delete-modal').style.display = 'none';
                loadCategoryGroups();
                showSuccess('Category deleted successfully');
            } catch (error) {
                console.error('Failed to delete category:', error);
                showError('Failed to delete category: ' + (error.message || 'Unknown error'));
            }
        };
        
        // Show the confirm delete modal
        document.getElementById('confirm-delete-modal').style.display = 'block';
    });
}

// Load categories for transfer dropdown
async function loadTransferCategoriesDropdown(excludeCategoryId) {
    try {
        const response = await fetch('/api/categories');
        const categories = await handleApiResponse(response);
        
        const select = document.getElementById('transfer-category-select');
        select.innerHTML = '<option value="">None (Delete transactions)</option>';
        
        categories
            .filter(category => category.id !== excludeCategoryId)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
    } catch (error) {
        console.error('Failed to load categories for transfer dropdown:', error);
        showError('Failed to load categories');
    }
}

// Submit Category Group Form
function submitCategoryGroup(event) {
    event.preventDefault();
    
    const groupId = document.getElementById('category-group-id').value;
    const name = document.getElementById('category-group-name').value;
    const isIncome = document.getElementById('category-group-is-income').checked;
    
    if (!name) {
        showError('Category group name is required');
        return;
    }
    
    // First check if a category group with this name already exists
    checkCategoryGroupExists(name)
        .then(exists => {
            if (exists && !groupId) {
                showError(`A category group named "${name}" already exists. Please choose a different name.`);
                return;
            }
            
            // If the category group doesn't exist or we're updating an existing one, proceed
            createOrUpdateCategoryGroup(groupId, name, isIncome);
        })
        .catch(error => {
            console.error('Error checking category group existence:', error);
            showError('Failed to check if category group exists: ' + error.message);
        });
}

// Helper function to check if a category group exists
async function checkCategoryGroupExists(groupName) {
    try {
        const response = await fetch('/api/category-groups');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const groups = await response.json();
        
        // Check if the group exists (case-insensitive comparison)
        return groups.some(group => 
            group.name.toLowerCase() === groupName.toLowerCase() && 
            group.id !== document.getElementById('category-group-id').value // Exclude current group when editing
        );
    } catch (error) {
        console.error('Error checking category group existence:', error);
        throw error;
    }
}

// Function to create or update a category group
function createOrUpdateCategoryGroup(groupId, name, isIncome) {
    // Determine if this is a create or update operation
    const isUpdate = !!groupId;
    
    // Prepare the request
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate 
        ? `/api/category-groups/${groupId}` 
        : '/api/category-groups';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            is_income: isIncome
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Unknown error');
            });
        }
        return response.json();
    })
    .then(result => {
        document.getElementById('category-group-modal').style.display = 'none';
        
        // Handle special cases from our enhanced API
        if (result.modifiedName) {
            showSuccess(`Created category group "${result.modifiedName}" (original name "${result.originalName}" was reported as already existing)`);
        } else if (result.wasHidden) {
            showSuccess(`Found and un-hid existing category group "${result.message}"`);
        } else {
            // Standard success message
            showSuccess(isUpdate 
                ? 'Category group updated successfully' 
                : 'Category group created successfully'
            );
        }
        
        // Reload the category groups with a slight delay to ensure DB sync
        setTimeout(() => {
            loadCategoryGroups().then(() => {
                // After reload is complete, set up event listeners again
                setupCategoryEventListeners();
                
                // If we just created a new group, highlight it visually
                if ((!isUpdate || result.wasHidden) && result.id) {
                    const newGroupElement = document.querySelector(`.category-group button[data-group-id="${result.id}"]`);
                    if (newGroupElement) {
                        // Scroll to the new group
                        newGroupElement.scrollIntoView({ behavior: 'smooth' });
                        
                        // Highlight the new group temporarily
                        const groupContainer = newGroupElement.closest('.category-group');
                        if (groupContainer) {
                            groupContainer.classList.add('highlight-new');
                            setTimeout(() => {
                                groupContainer.classList.remove('highlight-new');
                            }, 3000);
                        }
                    }
                }
            });
        }, 500); // Half-second delay to ensure DB sync
    })
    .catch(error => {
        console.error('Failed to save category group:', error);
        // Check for common error patterns
        let errorMessage = error.message || 'Unknown error';
        
        if (errorMessage.includes('already exists')) {
            errorMessage = `A category group with this name already exists. Please choose a different name or try adding "(new)" at the end.`;
        }
        
        showError('Failed to save category group: ' + errorMessage);
    });
}

// Submit Category Form
function submitCategory(event) {
    event.preventDefault();
    
    const categoryId = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    const groupId = document.getElementById('category-group-select').value;
    
    if (!name) {
        showError('Category name is required');
        return;
    }
    
    if (!groupId) {
        showError('Category group is required');
        return;
    }
    
    // First check if a category with this name already exists in this group
    checkCategoryExists(name, groupId)
        .then(exists => {
            if (exists) {
                showError(`A category named "${name}" already exists in this group. Please choose a different name.`);
                return;
            }
            
            // If the category doesn't exist, proceed with creation/update
            createOrUpdateCategory(categoryId, name, groupId);
        })
        .catch(error => {
            console.error('Error checking category existence:', error);
            showError('Failed to check if category exists: ' + error.message);
        });
}

// Helper function to check if a category exists
async function checkCategoryExists(categoryName, groupId) {
    try {
        // Use the new grouped endpoint for more accurate data
        const response = await fetch('/api/categories/grouped');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const groupedCategories = await response.json();
        
        // Find the specific group
        const group = groupedCategories.find(g => g.id === groupId);
        if (!group) {
            return false; // Group not found, so category can't exist in it
        }
        
        // Check if the category exists in this group (case-insensitive comparison)
        return group.categories.some(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase() && 
            cat.id !== document.getElementById('category-id').value // Exclude current category when editing
        );
    } catch (error) {
        console.error('Error checking category existence:', error);
        throw error;
    }
}

// Function to create or update a category
function createOrUpdateCategory(categoryId, name, groupId) {
    // Find if the selected group is an income group
    const groupOption = document.getElementById('category-group-select').options[
        document.getElementById('category-group-select').selectedIndex
    ];
    const isIncome = groupOption.textContent.includes('(Income)');
    
    // Determine if this is a create or update operation
    const isUpdate = !!categoryId;
    
    // Prepare the request
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate 
        ? `/api/categories/${categoryId}` 
        : '/api/categories';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            group_id: groupId,
            is_income: isIncome
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Unknown error');
            });
        }
        return response.json();
    })
    .then(result => {
        document.getElementById('category-modal').style.display = 'none';
        loadCategoryGroups();
        showSuccess(isUpdate 
            ? 'Category updated successfully' 
            : 'Category created successfully'
        );
    })
    .catch(error => {
        console.error('Failed to save category:', error);
        // Check for common error patterns
        let errorMessage = error.message || 'Unknown error';
        if (errorMessage.includes('already exists')) {
            errorMessage = `A category with this name already exists in this group. Please choose a different name.`;
        }
        showError('Failed to save category: ' + errorMessage);
    });
}

// Add these event listeners near the bottom of the script tag
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Category management form submissions
    document.getElementById('category-group-form').addEventListener('submit', submitCategoryGroup);
    document.getElementById('category-form').addEventListener('submit', submitCategory);
});
