const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const messageBox = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

let searchTimer;

document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en", {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
}).format(new Date());

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function showMessage(message, isError = false) {
  messageBox.textContent = message;
  messageBox.classList.remove("hidden", "error");
  if (isError) messageBox.classList.add("error");
  window.setTimeout(() => messageBox.classList.add("hidden"), 3500);
}

function formatStatus(status) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.errors?.join(", ") || "Something went wrong");
  }
  return result;
}

function updateStats(tasks) {
  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent = tasks.filter((task) => task.status === "pending").length;
  document.getElementById("progressCount").textContent = tasks.filter((task) => task.status === "in_progress").length;
  document.getElementById("completedCount").textContent = tasks.filter((task) => task.status === "completed").length;
}

function renderTasks(tasks) {
  updateStats(tasks);
  if (!tasks.length) {
    taskList.innerHTML = '<div class="empty-state">No tasks found. Add a task or change your filters.</div>';
    return;
  }

  taskList.innerHTML = tasks.map((task) => {
    const dueDate = task.due_date
      ? new Date(`${String(task.due_date).slice(0, 10)}T00:00:00`).toLocaleDateString()
      : "No due date";
    return `
      <article class="task-card">
        <div class="task-main">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}
          <div class="task-meta">
            <span class="pill status-${escapeHTML(task.status)}">${escapeHTML(formatStatus(task.status))}</span>
            <span class="pill priority-${escapeHTML(task.priority)}">${escapeHTML(formatStatus(task.priority))} priority</span>
            <span class="pill">${escapeHTML(dueDate)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="small-button" type="button" data-action="edit" data-id="${task.id}">Edit</button>
          <button class="small-button delete" type="button" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </article>`;
  }).join("");
}

async function loadTasks() {
  taskList.innerHTML = '<div class="loading">Loading your tasks...</div>';
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (priorityFilter.value) params.set("priority", priorityFilter.value);
  params.set("limit", "100");

  try {
    const result = await request(`/api/tasks?${params.toString()}`);
    renderTasks(result.data);
  } catch (error) {
    taskList.innerHTML = '<div class="empty-state">Could not load tasks. Check your database connection and refresh.</div>';
    showMessage(error.message, true);
  }
}

function openForm(task = null) {
  taskForm.classList.remove("hidden");
  document.getElementById("formTitle").textContent = task ? "Update task" : "Create a task";
  document.getElementById("taskId").value = task?.id || "";
  document.getElementById("title").value = task?.title || "";
  document.getElementById("description").value = task?.description || "";
  document.getElementById("status").value = task?.status || "pending";
  document.getElementById("priority").value = task?.priority || "medium";
  document.getElementById("due_date").value = task?.due_date ? String(task.due_date).slice(0, 10) : "";
  document.getElementById("saveButton").textContent = task ? "Update task" : "Save task";
  document.getElementById("title").focus();
}

function closeForm() {
  taskForm.classList.add("hidden");
  taskForm.reset();
  document.getElementById("taskId").value = "";
}

document.getElementById("newTaskButton").addEventListener("click", () => openForm());
document.getElementById("closeFormButton").addEventListener("click", closeForm);
document.getElementById("cancelButton").addEventListener("click", closeForm);

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.getElementById("taskId").value;
  const payload = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim() || null,
    status: document.getElementById("status").value,
    priority: document.getElementById("priority").value,
    due_date: document.getElementById("due_date").value || null
  };

  try {
    await request(id ? `/api/tasks/${id}` : "/api/tasks", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeForm();
    showMessage(id ? "Task updated successfully." : "Task created successfully.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
  }
});

taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  if (button.dataset.action === "edit") {
    try {
      const result = await request(`/api/tasks/${id}`);
      openForm(result.data);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  if (button.dataset.action === "delete") {
    if (!window.confirm("Delete this task? This action cannot be undone.")) return;
    try {
      await request(`/api/tasks/${id}`, { method: "DELETE" });
      showMessage("Task deleted successfully.");
      await loadTasks();
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadTasks, 300);
});
statusFilter.addEventListener("change", loadTasks);
priorityFilter.addEventListener("change", loadTasks);

loadTasks();
