/* =========================
SELECTORES DEL DOM
========================= */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const completedCount = document.getElementById("completedCount");

const filterButtons = document.querySelectorAll(".filter-btn");

/* =========================
ESTADO DE LA APP
========================= */

// Array principal de tareas
let tasks = [];

// Filtro actual
let currentFilter = "all";

/* =========================
EVENTOS
========================= */

// Agregar tarea
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  addTask();
});

// Eventos de filtros
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {

    currentFilter = button.dataset.filter;

    saveFilter();
    updateActiveFilter(button);
    renderTasks();

  });
});

/* =========================
FUNCIONES PRINCIPALES
========================= */

/* ---------- AGREGAR TAREA ---------- */

function addTask() {

  const text = taskInput.value.trim();

  if (text === "") return;

  const newTask = {
    id: Date.now(),
    text: text,
    completed: false
  };

  tasks.push(newTask);

  saveTasks();
  renderTasks();

  taskInput.value = "";
}

/* ---------- RENDERIZAR TAREAS ---------- */

function renderTasks() {

  // Limpiar lista
  taskList.innerHTML = "";

  // Filtrar tareas
  let filteredTasks = [];

  if (currentFilter === "pending") {

    filteredTasks = tasks.filter(task => !task.completed);

  } else if (currentFilter === "completed") {

    filteredTasks = tasks.filter(task => task.completed);

  } else {

    filteredTasks = tasks;

  }

  // Crear elementos dinámicamente
  filteredTasks.forEach((task) => {

    const li = document.createElement("li");

    li.classList.add("task-item");

    if (task.completed) {
      li.classList.add("completed");
    }

    li.innerHTML = `
  <div class="task-content">

    <input 
      type="checkbox"
      class="task-checkbox"
      ${task.completed ? "checked" : ""}
    >

    <p class="task-text">
      ${task.text}
    </p>

  </div>

  <div class="task-actions">

    <button class="task-btn delete">
      Eliminar
    </button>

  </div>
`;

    // Checkbox completar
    const checkbox = li.querySelector(".task-checkbox");

    checkbox.addEventListener("change", () => {
      toggleTask(task.id);
    });

    // Botón eliminar
    const deleteBtn = li.querySelector(".delete");

    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    taskList.appendChild(li);

  });

  updateCompletedCounter();
}

/* ---------- COMPLETAR TAREA ---------- */

function toggleTask(id) {

  tasks = tasks.map((task) => {

    if (task.id === id) {

      return {
        ...task,
        completed: !task.completed
      };

    }

    return task;

  });

  saveTasks();
  renderTasks();
}

/* ---------- ELIMINAR TAREA ---------- */

function deleteTask(id) {

  tasks = tasks.filter(task => task.id !== id);

  saveTasks();
  renderTasks();
}

/* ---------- CONTADOR ---------- */

function updateCompletedCounter() {

  const completedTasks = tasks.filter(task => task.completed);

  completedCount.textContent = completedTasks.length;
}

/* =========================
LOCAL STORAGE
========================= */

/* ---------- GUARDAR ---------- */

function saveTasks() {

  localStorage.setItem(
    "tasks",
    JSON.stringify(tasks)
  );
}

/* ---------- CARGAR ---------- */

function loadTasks() {

  const storedTasks = localStorage.getItem("tasks");

  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
}

/* =========================
SESSION STORAGE
========================= */

/* ---------- GUARDAR FILTRO ---------- */

function saveFilter() {

  sessionStorage.setItem(
    "taskFilter",
    currentFilter
  );
}

/* ---------- CARGAR FILTRO ---------- */

function loadFilter() {

  const storedFilter = sessionStorage.getItem("taskFilter");

  if (storedFilter) {
    currentFilter = storedFilter;
  }
}

/* =========================
UI
========================= */

/* ---------- FILTRO ACTIVO ---------- */

function updateActiveFilter(activeButton) {

  filterButtons.forEach((button) => {
    button.classList.remove("active");
  });

  activeButton.classList.add("active");
}

/* ---------- RESTAURAR FILTRO ---------- */

function restoreActiveFilterUI() {

  filterButtons.forEach((button) => {

    if (button.dataset.filter === currentFilter) {
      button.classList.add("active");
    }

  });
}

/* =========================
INICIALIZAR APP
========================= */

function initApp() {

  loadTasks();

  loadFilter();

  restoreActiveFilterUI();

  renderTasks();
}

initApp();