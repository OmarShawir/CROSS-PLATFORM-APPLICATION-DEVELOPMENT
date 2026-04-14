let tasks = [];
let nextTaskId = 1;

let currentEditId = null;
let currentTargetColumn = null;

const totalCounter = document.getElementById('task-counter');
const filterSelect = document.getElementById('priority-filter');
const modalOverlay = document.getElementById('modal-overlay');
const modalHeading = document.getElementById('modal-heading');
const titleInput = document.getElementById('input-title');
const descInput = document.getElementById('input-desc');
const priorityInput = document.getElementById('input-priority');
const dueInput = document.getElementById('input-due');
const modalError = document.getElementById('modal-error');

function updateCounters() {

    totalCounter.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    ['todo', 'inprogress', 'done'].forEach(col => {
        const count = tasks.filter(t => t.column === col).length;
        document.getElementById(`${col}-count`).textContent = count;
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function createTaskCard(task) {
    const li = document.createElement('li');
    li.className = 'task-card';
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-priority', task.priority);
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.textContent = task.priority;
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;
    const descP = document.createElement('p');
    descP.className = 'task-desc';
    descP.textContent = task.desc;
    const dueSpan = document.createElement('span');
    dueSpan.className = 'task-due';
    dueSpan.textContent = task.due ? `📅 ${formatDate(task.due)}` : '';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.setAttribute('data-action', 'edit');
    editBtn.setAttribute('data-id', task.id);
    editBtn.textContent = '✏️ Edit';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.setAttribute('data-id', task.id);
    deleteBtn.textContent = '🗑 Delete';
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    li.append(priorityBadge, titleSpan, descP, dueSpan, actionsDiv);
    const currentFilter = filterSelect.value;
    li.classList.toggle('is-hidden', currentFilter !== 'all' && task.priority !== currentFilter);
    return li;
}

function addTask(columnId, taskData) {
    taskData.id = nextTaskId++;
    taskData.column = columnId;
    tasks.push(taskData);
    const listElement = document.getElementById(`${columnId}-list`);
    if (listElement) {
        listElement.appendChild(createTaskCard(taskData));
    }
    updateCounters();
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    titleInput.value = task.title;
    descInput.value = task.desc;
    priorityInput.value = task.priority;
    dueInput.value = task.due || '';
    currentEditId = taskId;
    modalTitle.textContent = 'Edit Task';
    taskModal.classList.remove('hidden');
}

function updateTask(taskId, updatedData) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    Object.assign(tasks[taskIndex], updatedData);
    const oldCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (oldCard) {
        const newCard = createTaskCard(tasks[taskIndex]);
        oldCard.replaceWith(newCard);
    }
}