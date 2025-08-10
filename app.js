// DOM elements
const addMemberForm = document.getElementById('addMemberForm');
const memberNameInput = document.getElementById('memberName');
const membersList = document.getElementById('membersList');
const addTransactionForm = document.getElementById('addTransactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const paidBySelect = document.getElementById('paidBy');
const transactionsList = document.getElementById('transactionsList');
const balancesList = document.getElementById('balancesList');

// State
let members = [];
let transactions = [];
let currentUser = null;

// --- AUTH LOGIC ---
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authError = document.getElementById('authError');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const logoutBtn = document.getElementById('logoutBtn');

let isRegisterMode = false;

function showAuthModal() {
    authForm.reset();
    authError.textContent = '';
    isRegisterMode = false;
    authSubmitBtn.textContent = 'Sign In';
    toggleAuthMode.textContent = 'Create account';
    authModal.show();
}

toggleAuthMode.onclick = () => {
    isRegisterMode = !isRegisterMode;
    authSubmitBtn.textContent = isRegisterMode ? 'Register' : 'Sign In';
    toggleAuthMode.textContent = isRegisterMode ? 'Already have an account?' : 'Create account';
    authError.textContent = '';
};

authForm.onsubmit = async (e) => {
    e.preventDefault();
    authError.textContent = '';
    try {
        if (isRegisterMode) {
            await window.auth.createUserWithEmailAndPassword(authEmail.value, authPassword.value);
        } else {
            await window.auth.signInWithEmailAndPassword(authEmail.value, authPassword.value);
        }
        authModal.hide();
    } catch (err) {
        authError.textContent = err.message;
    }
};

logoutBtn.onclick = () => window.auth.signOut();

window.auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        logoutBtn.classList.remove('d-none');
        setupEventListeners();
        await loadData();
    } else {
        currentUser = null;
        logoutBtn.classList.add('d-none');
        showAuthModal();
        // Clear UI
        membersList.innerHTML = '';
        transactionsList.innerHTML = '';
        balancesList.innerHTML = '';
    }
});

// --- END AUTH LOGIC ---

// Set up event listeners
function setupEventListeners() {
    addMemberForm.onsubmit = handleAddMember;
    addTransactionForm.onsubmit = handleAddTransaction;
}

// Load data from Firestore (user-specific)
async function loadData() {
    if (!currentUser) return;
    try {
        // Load members
        const membersSnapshot = await window.db
            .collection('users').doc(currentUser.uid)
            .collection('members').orderBy('createdAt', 'asc').get();
        members = membersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load transactions
        const transactionsSnapshot = await window.db
            .collection('users').doc(currentUser.uid)
            .collection('transactions').orderBy('date', 'desc').get();
        transactions = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderMembersList();
        updatePaidBySelect();
        renderTransactions();
        updateBalances();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again.');
    }
}

// Handle adding a new member (user-specific)
async function handleAddMember(e) {
    e.preventDefault();
    const name = memberNameInput.value.trim();
    if (!name || !currentUser) return;
    try {
        const docRef = await window.db
            .collection('users').doc(currentUser.uid)
            .collection('members').add({
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        members.push({
            id: docRef.id,
            name: name
        });
        memberNameInput.value = '';
        renderMembersList();
        updatePaidBySelect();
        updateBalances();
    } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member. Please try again.');
    }
}

// Handle adding a new transaction (user-specific)
async function handleAddTransaction(e) {
    e.preventDefault();
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const paidBy = paidBySelect.value;
    if (!description || isNaN(amount) || !paidBy || !currentUser) return;
    try {
        const docRef = await window.db
            .collection('users').doc(currentUser.uid)
            .collection('transactions').add({
                description: description,
                amount: amount,
                paidBy: paidBy,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
        transactions.unshift({
            id: docRef.id,
            description,
            amount,
            paidBy,
            date: new Date()
        });
        descriptionInput.value = '';
        amountInput.value = '';
        renderTransactions();
        updateBalances();
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction. Please try again.');
    }
}

// Render members list
function renderMembersList() {
    membersList.innerHTML = members.length > 0 
        ? members.map(member => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${member.name}
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${member.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('')
        : '<li class="list-group-item text-muted">No members added yet</li>';
}

// Render transactions list
function renderTransactions() {
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="text-muted text-center py-3">No transactions yet</p>';
        return;
    }
    transactionsList.innerHTML = transactions.map(transaction => {
        let dateObj;
        if (transaction.date && typeof transaction.date.toDate === 'function') {
            dateObj = transaction.date.toDate();
        } else if (transaction.date instanceof Date) {
            dateObj = transaction.date;
        } else {
            dateObj = new Date();
        }
        return `
        <div class="card mb-2">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${transaction.description}</h6>
                        <small class="text-muted">Paid by ${transaction.paidBy} • ${formatDate(dateObj)}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">$${transaction.amount.toFixed(2)}</div>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Update the 'Paid by' select dropdown
function updatePaidBySelect() {
    paidBySelect.innerHTML = `
        <option value="" disabled selected>Paid by</option>
        ${members.map(member => `
            <option value="${member.name}">${member.name}</option>
        `).join('')}
    `;
}

// Calculate and update balances
function updateBalances() {
    if (members.length === 0) {
        balancesList.innerHTML = '<p class="text-muted text-center py-3">Add members to see balances</p>';
        return;
    }
    const balances = {};
    members.forEach(member => {
        balances[member.name] = 0;
    });
    transactions.forEach(transaction => {
        if (balances.hasOwnProperty(transaction.paidBy)) {
            balances[transaction.paidBy] += transaction.amount;
        }
    });
    const totalSpent = Object.values(balances).reduce((sum, amount) => sum + amount, 0);
    const average = totalSpent / members.length;
    balancesList.innerHTML = `
        <div class="alert alert-info">
            <div class="d-flex justify-content-between">
                <span>Total Expenses:</span>
                <strong>$${totalSpent.toFixed(2)}</strong>
            </div>
            <div class="d-flex justify-content-between">
                <span>Average per person:</span>
                <strong>$${average.toFixed(2)}</strong>
            </div>
        </div>
        <ul class="list-group">
            ${Object.entries(balances)
                .map(([name, amount]) => {
                    const balance = amount - average;
                    const isPositive = balance >= 0;
                    return `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${name}
                            <span class="badge ${isPositive ? 'bg-success' : 'bg-danger'} rounded-pill">
                                ${isPositive ? 'Gets back' : 'Owes'} $${Math.abs(balance).toFixed(2)}
                            </span>
                        </li>
                    `;
                })
                .join('')}
        </ul>
    `;
}

// Delete a member (user-specific)
window.deleteMember = async function(memberId) {
    if (!confirm('Are you sure you want to delete this member? This will not delete their transactions.')) {
        return;
    }
    try {
        await window.db
            .collection('users').doc(currentUser.uid)
            .collection('members').doc(memberId).delete();
        members = members.filter(member => member.id !== memberId);
        renderMembersList();
        updatePaidBySelect();
        updateBalances();
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member. Please try again.');
    }
};

// Delete a transaction (user-specific)
window.deleteTransaction = async function(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    try {
        await window.db
            .collection('users').doc(currentUser.uid)
            .collection('transactions').doc(transactionId).delete();
        transactions = transactions.filter(transaction => transaction.id !== transactionId);
        renderTransactions();
        updateBalances();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
    }
};

// Helper function to format dates
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}