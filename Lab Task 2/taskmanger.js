/* ═══════════════════════════════════════════════════════════════
   taskmanager.js — Kanban Task Board
   ───────────────────────────────────────────────────────────────
   1. State & DOM Elements
   2. Core CRUD Operations
   3. Event Listeners
═══════════════════════════════════════════════════════════════ */

// ==========================================
// 1. STATE & DOM ELEMENTS
// ==========================================

// In-memory task store: array of task objects
let tasks = [];
let nextTaskId = 1;

// Tracking variables for modal actions
let currentEditId = null;
let currentTargetColumn = null;

// -- DOM References --

// Header & Counters
const totalCounter = document.getElementById('task-counter');
const filterSelect = document.getElementById('priority-filter');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalHeading = document.getElementById('modal-heading');
const titleInput = document.getElementById('input-title');
const descInput = document.getElementById('input-desc');
const priorityInput = document.getElementById('input-priority');
const dueInput = document.getElementById('input-due');
const modalError = document.getElementById('modal-error');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Updates the total task counter and individual column counters
 */
function updateCounters() {
    // Total counter
    totalCounter.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

    // Column counters
    ['todo', 'inprogress', 'done'].forEach(col => {
        const count = tasks.filter(t => t.column === col).length;
        document.getElementById(`${col}-count`).textContent = count;
    });
}

/**
 * Formats a date string (YYYY-MM-DD) into a readable format (e.g., 10 Aug 2025)
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ==========================================
// 2. CORE CRUD OPERATIONS
// ==========================================

/**
 * Creates a DOM element for a task card using strict DOM API (No innerHTML)
 */
function createTaskCard(task) {
    // 1. Create main card container
    const li = document.createElement('li');
    li.className = 'task-card';
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-priority', task.priority);

    // 2. Priority Badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.textContent = task.priority;

    // 3. Task Title (double-click to edit)
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;

    // 4. Task Description
    const descP = document.createElement('p');
    descP.className = 'task-desc';
    descP.textContent = task.desc;

    // 5. Due Date
    const dueSpan = document.createElement('span');
    dueSpan.className = 'task-due';
    dueSpan.textContent = task.due ? `📅 ${formatDate(task.due)}` : '';

    // 6. Action Buttons Container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit Button (Using data-action for Event Delegation)
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.setAttribute('data-action', 'edit');
    editBtn.setAttribute('data-id', task.id);
    editBtn.textContent = '✏️ Edit';

    // Delete Button (Using data-action for Event Delegation)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.setAttribute('data-id', task.id);
    deleteBtn.textContent = '🗑 Delete';

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // 7. Assemble the card safely
    li.append(priorityBadge, titleSpan, descP, dueSpan, actionsDiv);

    // Apply active filter instantly if a filter is selected
    const currentFilter = filterSelect.value;
    li.classList.toggle('is-hidden', currentFilter !== 'all' && task.priority !== currentFilter);

    return li;
}

/**
 * Adds a task to the state array and renders it in the specified column
 */
function addTask(columnId, taskData) {
    // Assign unique ID and Column
    taskData.id = nextTaskId++;
    taskData.column = columnId;

    // Save to state
    tasks.push(taskData);

    // Build card and append to DOM
    const listElement = document.getElementById(`${columnId}-list`);
    if (listElement) {
        listElement.appendChild(createTaskCard(taskData));
    }

    // Update UI counters
    updateCounters();
}

// ==========================================
// 3. EDIT & UPDATE TASKS
// ==========================================

/**
 * Opens the modal and pre-fills it with the selected task's data
 */
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Populate modal inputs
    titleInput.value = task.title;
    descInput.value = task.desc;
    priorityInput.value = task.priority;
    dueInput.value = task.due || ''; // Fallback for empty dates

    // Set modal state to 'Edit Mode'
    currentEditId = taskId;
    modalTitle.textContent = 'Edit Task';

    // Show modal
    taskModal.classList.remove('hidden');
}

/**
 * Updates an existing task in the state array and replaces its DOM card safely
 */
function updateTask(taskId, updatedData) {
    // Find task in array
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Merge old data with new data
    Object.assign(tasks[taskIndex], updatedData);

    // Find the old card in the DOM
    const oldCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (oldCard) {
        // Create a fresh card with updated data and replace the old one
        const newCard = createTaskCard(tasks[taskIndex]);
        oldCard.replaceWith(newCard); // Safe DOM replacement
    }
}

// ==========================================
// 3. EDIT & UPDATE TASKS
// ==========================================

/**
 * Opens the modal and pre-fills it with the selected task's data
 */
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Populate modal inputs
    titleInput.value = task.title;
    descInput.value = task.desc;
    priorityInput.value = task.priority;
    dueInput.value = task.due || ''; // Fallback for empty dates

    // Set modal state to 'Edit Mode'
    currentEditId = taskId;
    modalTitle.textContent = 'Edit Task';

    // Show modal
    taskModal.classList.remove('hidden');
}

/**
 * Updates an existing task in the state array and replaces its DOM card safely
 */
function updateTask(taskId, updatedData) {
    // Find task in array
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Merge old data with new data
    Object.assign(tasks[taskIndex], updatedData);

    // Find the old card in the DOM
    const oldCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (oldCard) {
        // Create a fresh card with updated data and replace the old one
        const newCard = createTaskCard(tasks[taskIndex]);
        oldCard.replaceWith(newCard); // Safe DOM replacement
    }
}

// ==========================================
// 4. EVENT LISTENERS
// ==========================================

// --- 1. Modal Controls (Save, Cancel, Close) ---
document.getElementById('btn-save').addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) {
        alert('Task title is required!');
        return;
    }

    const taskData = {
        title: title,
        desc: descInput.value.trim(),
        priority: priorityInput.value,
        due: dueInput.value
    };

    if (currentEditId) {
        updateTask(currentEditId, taskData);
    } else {
        addTask(currentTargetColumn, taskData);
    }

    modalOverlay.classList.add('hidden'); // Hide modal
});

document.getElementById('btn-cancel').addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

// Close modal if clicked outside the box
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
});

// --- 2. Open Add Modal for columns ---
document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentTargetColumn = e.target.getAttribute('data-col');
        currentEditId = null;

        // Reset form fields
        titleInput.value = descInput.value = dueInput.value = '';
        priorityInput.value = 'medium';

        modalHeading.textContent = 'Add Task';
        modalOverlay.classList.remove('hidden');
        titleInput.focus();
    });
});

// --- 3. Event Delegation & Inline Editing ---
['todo', 'inprogress', 'done'].forEach(col => {
    const list = document.getElementById(`${col}-list`);

    // A. Single Listener per column for Edit & Delete
    list.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (!action) return;

        const id = parseInt(e.target.getAttribute('data-id'), 10);

        if (action === 'delete') deleteTask(id);
        if (action === 'edit') {
            modalOverlay.classList.remove('hidden');
            editTask(id);
        }
    });

    // B. Double click for inline editing
    list.addEventListener('dblclick', (e) => {
        const titleSpan = e.target.closest('.task-title');
        if (!titleSpan) return;

        const card = titleSpan.closest('.task-card');
        const taskId = parseInt(card.getAttribute('data-id'), 10);
        const task = tasks.find(t => t.id === taskId);

        // Replace span with input
        const input = document.createElement('input');
        input.className = 'inline-edit-input';
        input.value = task.title;

        card.replaceChild(input, titleSpan);
        input.focus();

        // Save changes function
        const saveInline = () => {
            task.title = input.value.trim() || task.title; // Fallback to old title if empty
            titleSpan.textContent = task.title;
            card.replaceChild(titleSpan, input);
        };

        // Save on clicking outside (blur) or pressing Enter
        input.addEventListener('blur', saveInline);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') saveInline();
        });
    });
});

// --- 4. Priority Filter (classList.toggle) ---
filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;
    document.querySelectorAll('.task-card').forEach(card => {
        const priority = card.getAttribute('data-priority');
        // Hide if the selected filter is not 'all' AND doesn't match the card's priority
        card.classList.toggle('is-hidden', selected !== 'all' && priority !== selected);
    });
});

// --- 5. Clear Done (Staggered Animation) ---
document.getElementById('clear-done').addEventListener('click', () => {
    const doneCards = Array.from(document.getElementById('done-list').children);
    doneCards.forEach((card, index) => {
        const taskId = parseInt(card.getAttribute('data-id'), 10);
        // Stagger animation: wait 100ms * index for each card
        setTimeout(() => {
            deleteTask(taskId);
        }, index * 100);
    });
});
