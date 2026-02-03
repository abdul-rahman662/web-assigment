/***********************
 * TASK MANAGER APPLICATION
 * File: script.js
 * Description: Main JavaScript file for Task Manager website
 ***********************/

// ==================== UTILITY FUNCTIONS ====================
/**
 * Format date to readable string
 */
function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Show notification message
 */
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#4CAF50" : "#f44336"};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==================== AUTHENTICATION SYSTEM ====================
let currentUser = null;

/**
 * Initialize authentication
 */
function initAuth() {
  // Check if user is logged in
  const userData = sessionStorage.getItem("loggedInUser");
  if (userData) {
    currentUser = JSON.parse(userData);

    // Update UI for logged-in user
    const userElements = document.querySelectorAll(".user-info");
    userElements.forEach((el) => {
      el.textContent = `Welcome, ${currentUser.name}`;
      el.style.display = "inline-block";
    });

    // Add logout button if not present
    if (!document.getElementById("logoutBtn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.className = "btn btn-outline";
      logoutBtn.textContent = "Logout";
      logoutBtn.onclick = logout;

      const header = document.querySelector(".header-container");
      if (header) {
        const nav = header.querySelector("nav");
        if (nav) {
          nav.appendChild(logoutBtn);
        }
      }
    }
  }

  // Protect task page if not logged in
  if (window.location.pathname.includes("task.html") && !currentUser) {
    showNotification("Please login to access tasks", "error");
    setTimeout(() => (window.location.href = "login.html"), 1500);
    return false;
  }

  return true;
}

/**
 * Get all users from localStorage
 */
function getUsers() {
  return JSON.parse(localStorage.getItem("taskManagerUsers")) || [];
}

/**
 * Save users to localStorage
 */
function saveUsers(users) {
  localStorage.setItem("taskManagerUsers", JSON.stringify(users));
}

/**
 * User registration
 */
function signup() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document
    .getElementById("signupEmail")
    ?.value.trim()
    .toLowerCase();
  const password = document.getElementById("signupPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  // Validation
  if (!name || !email || !password) {
    showNotification("All fields are required", "error");
    return false;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return false;
  }

  if (confirmPassword && password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return false;
  }

  // Check if user exists
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    showNotification("User already exists", "error");
    return false;
  }

  // Create new user (in real app, NEVER store plain passwords!)
  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    password: password, // WARNING: For demo only!
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  showNotification("Account created successfully!", "success");
  setTimeout(() => (window.location.href = "login.html"), 1500);
  return true;
}

/**
 * User login
 */
function login() {
  const email = document
    .getElementById("loginEmail")
    ?.value.trim()
    .toLowerCase();
  const password = document.getElementById("loginPassword")?.value;

  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    showNotification("Invalid email or password", "error");
    return false;
  }

  // Store user data (remove password for security)
  const userData = { id: user.id, name: user.name, email: user.email };
  sessionStorage.setItem("loggedInUser", JSON.stringify(userData));

  showNotification(`Welcome back, ${user.name}!`, "success");
  setTimeout(() => (window.location.href = "task.html"), 1500);
  return true;
}

/**
 * User logout
 */
function logout() {
  sessionStorage.removeItem("loggedInUser");
  showNotification("Logged out successfully", "success");
  setTimeout(() => (window.location.href = "index.html"), 1500);
}

// ==================== TASK MANAGEMENT SYSTEM ====================
/**
 * Get tasks for current user
 */
function getTasks() {
  if (!currentUser) return [];
  const allTasks = JSON.parse(localStorage.getItem("taskManagerTasks")) || {};
  return allTasks[currentUser.email] || [];
}

/**
 * Save tasks for current user
 */
function saveTasks(tasks) {
  if (!currentUser) return;
  const allTasks = JSON.parse(localStorage.getItem("taskManagerTasks")) || {};
  allTasks[currentUser.email] = tasks;
  localStorage.setItem("taskManagerTasks", JSON.stringify(allTasks));
}

/**
 * Add a new task
 */
function addTask(event) {
  if (event) event.preventDefault();

  const taskInput = document.getElementById("taskInput");
  const taskCategory = document.getElementById("taskCategory");
  const taskPriority = document.getElementById("taskPriority");
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");

  if (!taskInput || !taskCategory || !taskPriority || !startTime || !endTime) {
    console.error("Task form elements not found");
    return false;
  }

  const title = taskInput.value.trim();
  const category = taskCategory.value;
  const priority = taskPriority.value;
  const start = startTime.value;
  const end = endTime.value;

  // Validation
  if (!title) {
    showNotification("Task title is required", "error");
    taskInput.focus();
    return false;
  }

  if (!start || !end) {
    showNotification("Start and end times are required", "error");
    return false;
  }

  if (new Date(start) >= new Date(end)) {
    showNotification("End time must be later than start time", "error");
    endTime.focus();
    return false;
  }

  // Create task object
  const task = {
    id: Date.now(),
    title: title,
    category: category,
    priority: priority,
    start: start,
    end: end,
    completed: false,
    createdAt: new Date().toISOString(),
    userId: currentUser?.email,
  };

  // Save to storage
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);

  // Update UI
  showNotification("Task added successfully!", "success");
  loadTasks();

  // Reset form
  taskInput.value = "";
  startTime.value = "";
  endTime.value = "";
  taskCategory.value = "Academic";
  taskPriority.value = "Medium";

  return true;
}

/**
 * Load and display all tasks
 */
function loadTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  const tasks = getTasks();

  if (tasks.length === 0) {
    taskList.innerHTML = `
            <li class="empty-state">
                <p>📝 No tasks yet. Add your first task above!</p>
                <p class="small-text">Tasks you add will appear here.</p>
            </li>
        `;
    return;
  }

  taskList.innerHTML = "";

  // Sort tasks: pending first, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  sortedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.priority.toLowerCase()}-priority ${task.completed ? "completed" : ""}`;
    li.dataset.taskId = task.id;

    li.innerHTML = `
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category">${task.category}</span>
                    <span class="task-priority">${task.priority} Priority</span>
                    <span class="task-time">${formatDate(task.start)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn complete-btn" title="${task.completed ? "Mark as Pending" : "Mark as Complete"}">
                    ${task.completed ? "↶" : "✓"}
                </button>
                <button class="task-btn view-btn" title="View Details">👁</button>
                <button class="task-btn delete-btn" title="Delete Task">🗑</button>
            </div>
        `;

    taskList.appendChild(li);

    // Add event listeners
    li.querySelector(".complete-btn").onclick = () =>
      toggleTaskCompletion(task.id);
    li.querySelector(".view-btn").onclick = () => openTaskModal(task.id);
    li.querySelector(".delete-btn").onclick = () => deleteTask(task.id);
    li.onclick = (e) => {
      if (!e.target.closest(".task-actions")) {
        openTaskModal(task.id);
      }
    };
  });

  // Update task statistics
  updateTaskStats();
}

/**
 * Toggle task completion status
 */
function toggleTaskCompletion(taskId) {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].updatedAt = new Date().toISOString();
    saveTasks(tasks);
    loadTasks();

    const status = tasks[taskIndex].completed ? "completed" : "pending";
    showNotification(`Task marked as ${status}`, "success");
  }
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  const tasks = getTasks();
  const filteredTasks = tasks.filter((t) => t.id !== taskId);
  saveTasks(filteredTasks);
  loadTasks();

  showNotification("Task deleted successfully", "success");
}

/**
 * Open task details modal
 */
function openTaskModal(taskId) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) return;

  // Update modal content
  document.getElementById("detailTitle").textContent = task.title;
  document.getElementById("detailCategory").textContent = task.category;
  document.getElementById("detailPriority").textContent = task.priority;
  document.getElementById("detailStart").textContent = formatDate(task.start);
  document.getElementById("detailEnd").textContent = formatDate(task.end);
  document.getElementById("detailStatus").textContent = task.completed
    ? "Completed"
    : "Pending";
  document.getElementById("detailStatus").className = task.completed
    ? "status-badge completed"
    : "status-badge pending";
  document.getElementById("detailPriority").className =
    `priority-badge ${task.priority.toLowerCase()}`;

  // Show modal
  const modal = document.getElementById("taskModal");
  if (modal) {
    modal.style.display = "flex";

    // Add edit button functionality
    const editBtn = document.getElementById("editTaskBtn");
    if (editBtn) {
      editBtn.onclick = () => {
        closeModal();
        // TODO: Implement edit functionality
        showNotification("Edit feature coming soon!", "info");
      };
    }
  }
}

/**
 * Close task modal
 */
function closeModal() {
  const modal = document.getElementById("taskModal");
  if (modal) modal.style.display = "none";
}

/**
 * Update task statistics
 */
function updateTaskStats() {
  const tasks = getTasks();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  // Update stats display if elements exist
  const totalEl = document.getElementById("totalTasks");
  const completedEl = document.getElementById("completedTasks");
  const pendingEl = document.getElementById("pendingTasks");

  if (totalEl) totalEl.textContent = `Total: ${total}`;
  if (completedEl) completedEl.textContent = `Completed: ${completed}`;
  if (pendingEl) pendingEl.textContent = `Pending: ${pending}`;
}

// ==================== CONTACT FORM HANDLER ====================
function handleContactSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("fullName")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const message = document.getElementById("message")?.value.trim();

  if (!name || !email || !message) {
    showNotification("Please fill in all fields", "error");
    return false;
  }

  // In a real app, you would send this to a server
  console.log("Contact form submitted:", { name, email, message });

  showNotification(
    "Message sent successfully! We'll get back to you soon.",
    "success",
  );

  // Reset form
  event.target.reset();

  return true;
}

// ==================== INITIALIZATION ====================
/**
 * Initialize the application
 */
function initApp() {
  console.log("Task Manager initializing...");

  // Initialize authentication
  initAuth();

  // Set up event listeners
  setupEventListeners();

  // Load tasks if on task page
  if (document.getElementById("taskList")) {
    loadTasks();
  }

  // Set minimum datetime to current time
  const datetimeInputs = document.querySelectorAll(
    'input[type="datetime-local"]',
  );
  const now = new Date();
  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  datetimeInputs.forEach((input) => {
    input.min = localDateTime;
  });

  console.log("Task Manager initialized successfully");
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Task form submission
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", addTask);
  }

  // Contact form submission
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactSubmit);
  }

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      login();
    });
  }

  // Signup form submission
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      signup();
    });
  }

  // Modal close buttons
  const modal = document.getElementById("taskModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.classList.contains("modal-close")) {
        closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.style.display === "flex") {
        closeModal();
      }
    });
  }

  // Logout button (if dynamically added)
  document.addEventListener("click", function (e) {
    if (
      e.target.id === "logoutBtn" ||
      e.target.classList.contains("logout-btn")
    ) {
      logout();
    }
  });
}

// ==================== START APPLICATION ====================
// Wait for DOM to be fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/* ===== FORGOT PASSWORD FUNCTIONALITY ===== */

function initForgotPassword() {
  const form = document.getElementById("forgotPasswordForm");
  const successMessage = document.getElementById("successMessage");
  const phoneField = document.getElementById("phoneField");
  const verificationRadios = document.querySelectorAll(
    'input[name="verification"]',
  );

  if (!form) return;

  // Show/hide phone field based on verification method
  verificationRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "sms") {
        phoneField.style.display = "block";
        document.getElementById("phoneNumber").required = true;
      } else {
        phoneField.style.display = "none";
        document.getElementById("phoneNumber").required = false;
      }
    });
  });

  // Handle form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("resetEmail").value.trim();
    const verificationMethod = document.querySelector(
      'input[name="verification"]:checked',
    ).value;
    const phone = document.getElementById("phoneNumber").value.trim();

    // Validation
    if (!email) {
      showNotification("Please enter your email address", "error");
      return false;
    }

    if (verificationMethod === "sms" && !phone) {
      showNotification(
        "Please enter your phone number for SMS verification",
        "error",
      );
      return false;
    }

    // Check if email exists in users (simulated)
    const users = getUsers();
    const userExists = users.some((user) => user.email === email.toLowerCase());

    if (!userExists) {
      showNotification("No account found with this email address", "error");
      return false;
    }

    // Simulate sending reset email/SMS
    showNotification(
      `Password reset instructions sent via ${verificationMethod.toUpperCase()}!`,
      "success",
    );

    // Show success message
    successMessage.style.display = "flex";
    form.reset();
    phoneField.style.display = "none";

    // Simulate delay
    setTimeout(() => {
      successMessage.style.display = "none";
      // In real app, you would redirect to reset password page
      // window.location.href = 'reset-password.html?token=simulated_token';
    }, 5000);

    return true;
  });
}

// Update the initApp function to include forgot password
function initApp() {
  console.log("Task Manager initializing...");

  // Initialize authentication
  initAuth();

  // Set up event listeners
  setupEventListeners();

  // Load tasks if on task page
  if (document.getElementById("taskList")) {
    loadTasks();
  }

  // Initialize forgot password if on that page
  if (document.getElementById("forgotPasswordForm")) {
    initForgotPassword();
  }

  // Set minimum datetime to current time
  const datetimeInputs = document.querySelectorAll(
    'input[type="datetime-local"]',
  );
  const now = new Date();
  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  datetimeInputs.forEach((input) => {
    input.min = localDateTime;
  });

  console.log("Task Manager initialized successfully");
}
