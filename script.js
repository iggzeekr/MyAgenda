/* ============================================
   MY AGENDA - Personal Planner JavaScript
   Author: Ezgi Kara
   ============================================ */

// State Management
let tasks = [];
let settings = {
    name: 'Ezgi Kara',
    title: 'Software Engineer',
    theme: 'purple'
};
let currentView = 'today';
let currentCategory = 'all';
let currentDate = new Date();
let currentMonth = new Date();
let currentWeekStart = getWeekStart(new Date());

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Apply theme
    document.body.setAttribute('data-theme', settings.theme);
    
    // Update user profile
    document.getElementById('userName').textContent = settings.name;
    document.getElementById('userTitle').textContent = settings.title;
    document.getElementById('userInitial').textContent = settings.name.charAt(0).toUpperCase();
    
    // Update date display
    updateDateDisplay();
    
    // Set default date for new task
    document.getElementById('taskDate').valueAsDate = new Date();
    
    // Render views
    renderTodayView();
    renderWeekView();
    renderMonthView();
    renderAllTasks();
    updateStats();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            switchView(item.dataset.view);
        });
    });

    // Categories
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            renderCurrentView();
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderCurrentView();
    });

    // Reminder checkbox
    document.getElementById('taskReminder').addEventListener('change', (e) => {
        document.getElementById('reminderTime').disabled = !e.target.checked;
    });

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            settings.theme = btn.dataset.theme;
            document.body.setAttribute('data-theme', settings.theme);
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                closeSettings();
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeSettings();
        }
        if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            openModal();
        }
    });
}

// Data Management
function loadData() {
    const savedTasks = localStorage.getItem('myAgenda_tasks');
    const savedSettings = localStorage.getItem('myAgenda_settings');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

function saveData() {
    localStorage.setItem('myAgenda_tasks', JSON.stringify(tasks));
    localStorage.setItem('myAgenda_settings', JSON.stringify(settings));
}

// View Management
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');
    renderCurrentView();
}

function renderCurrentView() {
    switch (currentView) {
        case 'today':
            renderTodayView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'month':
            renderMonthView();
            break;
        case 'all':
            renderAllTasks();
            break;
    }
}

// Date Helpers
function updateDateDisplay() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
    document.getElementById('dayOfWeek').textContent = today.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isSameDay(date1, date2) {
    return formatDate(new Date(date1)) === formatDate(new Date(date2));
}

function isToday(date) {
    return isSameDay(date, new Date());
}

// Task Filtering
function getFilteredTasks() {
    let filtered = [...tasks];
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(task => task.category === currentCategory);
    }
    
    // Filter by search
    if (searchTerm) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered;
}

function getTodayTasks() {
    const today = formatDate(new Date());
    return getFilteredTasks().filter(task => task.date === today);
}

function getTasksForDate(date) {
    const dateStr = formatDate(new Date(date));
    return getFilteredTasks().filter(task => task.date === dateStr);
}

// Render Functions
function renderTodayView() {
    const container = document.getElementById('todayTimeline');
    const emptyState = document.getElementById('emptyToday');
    const todayTasks = getTodayTasks();
    
    // Update badge
    document.getElementById('todayCount').textContent = todayTasks.filter(t => !t.completed).length;
    
    if (todayTasks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by time
    todayTasks.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
    
    container.innerHTML = todayTasks.map(task => createTaskCard(task)).join('');
}

function createTaskCard(task) {
    const categoryColors = {
        work: '#3b82f6',
        personal: '#10b981',
        study: '#f59e0b',
        health: '#ef4444'
    };
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-time">${task.time || '--:--'}</div>
            <div class="task-content">
                <div class="task-header">
                    <span class="task-title">${escapeHtml(task.title)}</span>
                    <span class="task-priority ${task.priority}"></span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="task-category">
                        <span class="dot" style="background: ${categoryColors[task.category]}"></span>
                        ${capitalize(task.category)}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn complete" onclick="toggleComplete('${task.id}')" title="${task.completed ? 'Mark Incomplete' : 'Mark Complete'}">
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                </button>
                <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function renderWeekView() {
    const container = document.getElementById('weekGrid');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        days.push(date);
    }
    
    // Update week range display
    const startStr = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('weekRange').textContent = `${startStr} - ${endStr}`;
    
    container.innerHTML = days.map(date => {
        const dayTasks = getTasksForDate(date);
        const todayClass = isToday(date) ? 'today' : '';
        
        return `
            <div class="week-day ${todayClass}">
                <div class="week-day-header">
                    <div class="week-day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="week-day-number">${date.getDate()}</div>
                </div>
                <div class="week-day-tasks">
                    ${dayTasks.slice(0, 4).map(task => `
                        <div class="week-task ${task.category}" onclick="editTask('${task.id}')">
                            ${task.time ? task.time + ' - ' : ''}${escapeHtml(task.title)}
                        </div>
                    `).join('')}
                    ${dayTasks.length > 4 ? `<div class="week-task" style="text-align: center; opacity: 0.6;">+${dayTasks.length - 4} more</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderMonthView() {
    const container = document.getElementById('calendarGrid');
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update month display
    document.getElementById('currentMonth').textContent = 
        currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    let html = '';
    
    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
        const day = prevMonth.getDate() - i;
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const todayClass = isToday(date) ? 'today' : '';
        const dayTasks = getTasksForDate(date);
        const hasTasksClass = dayTasks.length > 0 ? 'has-tasks' : '';
        
        html += `
            <div class="calendar-day ${todayClass} ${hasTasksClass}" onclick="openModalForDate('${formatDate(date)}')">
                <span class="calendar-day-number">${day}</span>
            </div>
        `;
    }
    
    // Next month padding
    const remainingCells = 42 - (startPadding + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
    }
    
    container.innerHTML = html;
}

function renderAllTasks() {
    const container = document.getElementById('allTasksList');
    const filter = document.getElementById('taskFilter').value;
    let filteredTasks = getFilteredTasks();
    
    // Apply status filter
    if (filter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Sort by date
    filteredTasks.sort((a, b) => {
        const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
        const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
        return dateA - dateB;
    });
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks found</h3>
                <p>Add some tasks to get started!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
}

// Stats
function updateStats() {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

// Task CRUD
function openModal() {
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskDate').valueAsDate = new Date();
    document.getElementById('reminderTime').disabled = true;
}

function openModalForDate(date) {
    openModal();
    document.getElementById('taskDate').value = date;
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function saveTask(event) {
    event.preventDefault();
    
    const id = document.getElementById('taskId').value;
    const taskData = {
        id: id || generateId(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        reminder: document.getElementById('taskReminder').checked,
        reminderTime: document.getElementById('reminderTime').value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    if (id) {
        // Edit existing task
        const index = tasks.findIndex(t => t.id === id);
        taskData.completed = tasks[index].completed;
        taskData.createdAt = tasks[index].createdAt;
        tasks[index] = taskData;
        showToast('Task updated successfully!');
    } else {
        // Add new task
        tasks.push(taskData);
        showToast('Task added successfully!');
    }
    
    saveData();
    closeModal();
    renderCurrentView();
    updateStats();
    
    // Schedule reminder if enabled
    if (taskData.reminder && taskData.time) {
        scheduleReminder(taskData);
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskTime').value = task.time || '';
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskReminder').checked = task.reminder;
    document.getElementById('reminderTime').value = task.reminderTime || '15';
    document.getElementById('reminderTime').disabled = !task.reminder;
    
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskModal').classList.add('active');
}

function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    renderCurrentView();
    updateStats();
    showToast('Task deleted!');
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    saveData();
    renderCurrentView();
    updateStats();
    showToast(task.completed ? 'Task completed! 🎉' : 'Task marked incomplete');
}

// Sorting
function sortTasks(by) {
    const todayTasks = getTodayTasks();
    
    if (by === 'time') {
        todayTasks.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
    } else if (by === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        todayTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    
    const container = document.getElementById('todayTimeline');
    container.innerHTML = todayTasks.map(task => createTaskCard(task)).join('');
}

function filterTasks() {
    renderAllTasks();
}

// Navigation
function changeWeek(delta) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (delta * 7));
    renderWeekView();
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderMonthView();
}

// Settings
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('settingsName').value = settings.name;
    document.getElementById('settingsTitle').value = settings.title;
    
    // Set active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings(event) {
    event.preventDefault();
    
    settings.name = document.getElementById('settingsName').value || 'User';
    settings.title = document.getElementById('settingsTitle').value || 'Personal Planner';
    
    // Theme is already updated via button click
    
    saveData();
    initializeApp();
    closeSettings();
    showToast('Settings saved!');
}

function clearAllData() {
    if (!confirm('Are you sure you want to delete ALL tasks? This cannot be undone!')) return;
    
    tasks = [];
    saveData();
    renderCurrentView();
    updateStats();
    closeSettings();
    showToast('All data cleared!');
}

// Sidebar Toggle
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Reminder System
function scheduleReminder(task) {
    if (!('Notification' in window)) return;
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            const taskDateTime = new Date(task.date + 'T' + task.time);
            const reminderTime = parseInt(task.reminderTime) * 60 * 1000;
            const notifyAt = taskDateTime.getTime() - reminderTime;
            const now = Date.now();
            
            if (notifyAt > now) {
                setTimeout(() => {
                    new Notification('📅 MyAgenda Reminder', {
                        body: `${task.title} is coming up!`,
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📅</text></svg>'
                    });
                }, notifyAt - now);
            }
        }
    });
}

// Utilities
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    // Will request when user adds a task with reminder
}

