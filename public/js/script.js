// ─── Todo App – Main Script ───────────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addBtn");
const clearCompletedBtn = document.getElementById("clearCompleted");
const filterButtons = document.querySelectorAll(".filter-btn");
const emptyState = document.getElementById("emptyState");
const itemsLeft = document.getElementById("itemsLeft");
const userInfoEl = document.getElementById("user-info");
const logoutBtn = document.getElementById("logoutBtn");

// Settings Modal
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettings");

// Change Username
const newUsernameInput = document.getElementById("new-username");
const saveUsernameBtn = document.getElementById("save-username-btn");
const usernameSpinner = document.getElementById("username-spinner");

// Change Password
const newPassInput = document.getElementById("new-password");
const confirmPassInput = document.getElementById("confirm-password");
const savePasswordBtn = document.getElementById("save-password-btn");
const passwordSpinner = document.getElementById("password-spinner");

// Modal Alert
const modalAlert = document.getElementById("modal-alert");

// ─── State ────────────────────────────────────────────────────────────────────
let tasks = [];
let currentFilter = "all";
let authToken = null;
let profileData = null;

// ─── Auth Guard & Init ────────────────────────────────────────────────────────
const loadingOverlay = document.createElement("div");
loadingOverlay.className = "app-loading";
loadingOverlay.innerHTML = '<div class="app-loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

async function init() {
  const { data: { session }, error } = await sb.auth.getSession();
  if (!session || error) {
    window.location.replace("auth.html");
    return;
  }
  authToken = session.access_token;

  // Load profile (username)
  try {
    profileData = await api("/api/profile");
  } catch (err) {
    console.error("Failed to load profile:", err);
  }

  updateHeaderDisplay(session.user);

  loadingOverlay.classList.add("fade-out");
  setTimeout(() => loadingOverlay.remove(), 350);

  await loadTasks();
  renderTasks();
}

function updateHeaderDisplay(user) {
  const username = profileData?.username || "User";
  const email = user?.email || "";
  userInfoEl.innerHTML = `@${username} <span>(${email})</span>`;
}

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API request failed");
  return data;
}

// ─── Load Tasks ───────────────────────────────────────────────────────────────
async function loadTasks() {
  try {
    const data = await api("/api/todos");
    tasks = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to load tasks:", err);
    tasks = [];
  }
}

// ─── Add Task ─────────────────────────────────────────────────────────────────
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  taskInput.value = "";
  try {
    const newTask = await api("/api/todos", "POST", { text });
    tasks.push(newTask);
    renderTasks();
  } catch (err) {
    console.error("Failed to add task:", err);
  }
}

addBtn.onclick = addTask;
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

// ─── Toggle ───────────────────────────────────────────────────────────────────
async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const updated = await api(`/api/todos/${id}`, "PATCH", { completed: !task.completed });
  if (updated) {
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    renderTasks();
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteTask(id) {
  await api(`/api/todos/${id}`, "DELETE");
  tasks = tasks.filter((t) => t.id !== id);
  renderTasks();
}

// ─── Clear Completed ─────────────────────────────────────────────────────────
clearCompletedBtn.onclick = async () => {
  await api("/api/todos", "DELETE");
  tasks = tasks.filter((t) => !t.completed);
  renderTasks();
};

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTasks() {
  taskList.innerHTML = "";
  let filtered = tasks;
  if (currentFilter === "active") filtered = tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") filtered = tasks.filter((t) => t.completed);

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <i class="checkbox ${task.completed ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"}"></i>
      <span class="task-text">${task.text}</span>
      <button class="delete-btn">×</button>
    `;

    li.querySelector(".checkbox").onclick = () => toggleTask(task.id);
    li.querySelector(".delete-btn").onclick = () => deleteTask(task.id);
    taskList.appendChild(li);
  });

  emptyState.classList.toggle("hidden", filtered.length !== 0);
  const activeCount = tasks.filter((t) => !t.completed).length;
  itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? "s" : ""} left`;
  updateFilterUI();
}

// ─── Filters ─────────────────────────────────────────────────────────────────
filterButtons.forEach((btn) => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    renderTasks();
  };
});

function updateFilterUI() {
  filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === currentFilter));
}

// ─── Logout ───────────────────────────────────────────────────────────────────
logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.replace("auth.html");
});

sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") window.location.replace("auth.html");
  else if (session?.access_token) authToken = session.access_token;
});

// ─── Settings Modal Logic ─────────────────────────────────────────────────────

function showSettingsAlert(msg, type = "error") {
  modalAlert.textContent = msg;
  modalAlert.className = `auth-alert ${type}`;
  modalAlert.classList.remove("hidden");
}

function clearSettingsAlert() {
  modalAlert.textContent = "";
  modalAlert.className = "auth-alert hidden";
}

settingsBtn.onclick = () => {
  clearSettingsAlert();
  newUsernameInput.value = profileData?.username || "";
  newPassInput.value = "";
  confirmPassInput.value = "";
  settingsOverlay.classList.remove("hidden");
};

closeSettingsBtn.onclick = () => {
  settingsOverlay.classList.add("hidden");
};

// Close modal if clicking outside the card
settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden");
});

// Save Username
saveUsernameBtn.onclick = async () => {
  const username = newUsernameInput.value.trim().toLowerCase();
  if (!username) return;

  clearSettingsAlert();
  saveUsernameBtn.disabled = true;
  usernameSpinner.classList.remove("hidden");
  saveUsernameBtn.querySelector("span").style.opacity = "0";

  try {
    const freshProfile = await api("/api/profile", "PATCH", { username });
    profileData = freshProfile;
    const { data: { session } } = await sb.auth.getSession();
    updateHeaderDisplay(session?.user);
    showSettingsAlert("✅ Username updated successfully!", "success");
  } catch (err) {
    showSettingsAlert(err.message);
  } finally {
    saveUsernameBtn.disabled = false;
    usernameSpinner.classList.add("hidden");
    saveUsernameBtn.querySelector("span").style.opacity = "1";
  }
};

// Save Password
savePasswordBtn.onclick = async () => {
  const newPass = newPassInput.value;
  const confPass = confirmPassInput.value;

  if (newPass.length < 6) {
    showSettingsAlert("Password must be at least 6 characters.");
    return;
  }
  if (newPass !== confPass) {
    showSettingsAlert("Passwords do not match.");
    return;
  }

  clearSettingsAlert();
  savePasswordBtn.disabled = true;
  passwordSpinner.classList.remove("hidden");
  savePasswordBtn.querySelector("span").style.opacity = "0";

  try {
    await api("/api/profile/password", "PATCH", { newPassword: newPass });
    showSettingsAlert("✅ Password changed successfully!", "success");
    newPassInput.value = "";
    confirmPassInput.value = "";
  } catch (err) {
    showSettingsAlert(err.message);
  } finally {
    savePasswordBtn.disabled = false;
    passwordSpinner.classList.add("hidden");
    savePasswordBtn.querySelector("span").style.opacity = "1";
  }
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
