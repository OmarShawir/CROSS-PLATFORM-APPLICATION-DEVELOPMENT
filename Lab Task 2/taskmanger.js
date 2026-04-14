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
    modalOverlay.classList.remove('hidden');
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

    modalOverlay.classList.add('hidden');
});

document.getElementById('btn-cancel').addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
});

document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentTargetColumn = e.target.getAttribute('data-col');
        currentEditId = null;
        titleInput.value = descInput.value = dueInput.value = '';
        priorityInput.value = 'medium';
        modalHeading.textContent = 'Add Task';
        modalOverlay.classList.remove('hidden');
        titleInput.focus();
    });
});

['todo', 'inprogress', 'done'].forEach(col => {
    const list = document.getElementById(`${col}-list`);
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

    list.addEventListener('dblclick', (e) => {
        const titleSpan = e.target.closest('.task-title');
        if (!titleSpan) return;
        const card = titleSpan.closest('.task-card');
        const taskId = parseInt(card.getAttribute('data-id'), 10);
        const task = tasks.find(t => t.id === taskId);
        const input = document.createElement('input');
        input.className = 'inline-edit-input';
        input.value = task.title;
        card.replaceChild(input, titleSpan);
        input.focus();
        const saveInline = () => {
            task.title = input.value.trim() || task.title;
            titleSpan.textContent = task.title;
            card.replaceChild(titleSpan, input);
        };

        input.addEventListener('blur', saveInline);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') saveInline();
        });
    });
});

filterSelect.addEventListener('change', () => {
    const selected = filterSelect.value;
    document.querySelectorAll('.task-card').forEach(card => {
        const priority = card.getAttribute('data-priority');
        card.classList.toggle('is-hidden', selected !== 'all' && priority !== selected);
    });
});

document.getElementById('clear-done').addEventListener('click', () => {
    const doneCards = Array.from(document.getElementById('done-list').children);
    doneCards.forEach((card, index) => {
        const taskId = parseInt(card.getAttribute('data-id'), 10);
        setTimeout(() => {
            deleteTask(taskId);
        }, index * 100);
    });
});

function deleteTask(taskId) {
    const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (!card) return;

    card.classList.add('fade-out');
    setTimeout(() => {
        card.remove();
        tasks = tasks.filter(t => t.id !== taskId);
        updateCounters();
    }, 300);
}