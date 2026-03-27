const STORAGE_KEY = "todolist-app.tasks.v1";

/** @type {{ id: string, text: string, completed: boolean }[]} */
let tasks = [];
/** @type {"all" | "active" | "completed"} */
let currentFilter = "all";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");
const itemTemplate = document.getElementById("todo-item-template");

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.text === "string" &&
          typeof item.completed === "boolean"
      )
      .map((item) => ({
        id: item.id,
        text: item.text.trim(),
        completed: item.completed,
      }))
      .filter((item) => item.text.length > 0);
  } catch (_error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }
  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function updateTaskCount() {
  const remaining = tasks.filter((task) => !task.completed).length;
  const label = remaining === 1 ? "task" : "tasks";
  taskCount.textContent = `${remaining} ${label} remaining`;
}

function render() {
  const visibleTasks = getFilteredTasks();
  todoList.innerHTML = "";

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent =
      currentFilter === "completed"
        ? "No completed tasks yet."
        : currentFilter === "active"
          ? "No active tasks left."
          : "No tasks yet. Add your first one above.";
    todoList.appendChild(empty);
  } else {
    visibleTasks.forEach((task) => {
      const fragment = itemTemplate.content.cloneNode(true);
      const item = fragment.querySelector(".todo-item");
      const checkbox = fragment.querySelector(".todo-toggle");
      const text = fragment.querySelector(".todo-text");
      const deleteBtn = fragment.querySelector(".delete-btn");

      item.dataset.id = task.id;
      checkbox.checked = task.completed;
      text.textContent = task.text;
      text.classList.toggle("is-completed", task.completed);
      deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);

      todoList.appendChild(fragment);
    });
  }

  clearCompletedBtn.disabled = !tasks.some((task) => task.completed);
  updateTaskCount();
}

function addTask(text) {
  tasks.unshift({
    id: createId(),
    text,
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(taskId, completed) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed } : task
  );
  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.filter === filter);
  });
  render();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;
  addTask(value);
  todoInput.value = "";
  todoInput.focus();
});

todoList.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.classList.contains("todo-toggle")) return;

  const item = target.closest(".todo-item");
  if (!item || !item.dataset.id) return;
  toggleTask(item.dataset.id, target.checked);
});

todoList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("delete-btn")) return;

  const item = target.closest(".todo-item");
  if (!item || !item.dataset.id) return;
  deleteTask(item.dataset.id);
});

clearCompletedBtn.addEventListener("click", clearCompleted);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    if (filter === "all" || filter === "active" || filter === "completed") {
      setFilter(filter);
    }
  });
});

tasks = loadTasks();
render();
