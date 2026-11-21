
document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "http://127.0.0.1:8000";

/* =====================================
   DARK / LIGHT MODE
===================================== */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function applyTheme(theme) {

    const isLight = theme === "light";

    document.body.classList.toggle("light-mode", isLight);

    if (themeIcon) {
        themeIcon.textContent = isLight ? "🌙" : "☀️";
    }

    if (themeText) {
        themeText.textContent = isLight ? "Dark Mode" : "Light Mode";
    }

    localStorage.setItem("assistantTheme", theme);
}

const savedTheme = localStorage.getItem("assistantTheme") || "dark";

applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {

    const isLight = document.body.classList.contains("light-mode");

    applyTheme(isLight ? "dark" : "light");

});


    /* =====================================
       1. COMMON API FUNCTIONS
    ===================================== */

    async function apiRequest(endpoint, options = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Invalid response from server.");
        }

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : JSON.stringify(data.detail || "API request failed")
            );
        }

        if (
            data.message &&
            /^(Database Error|Error:|No .* found)/i.test(data.message)
        ) {
            throw new Error(data.message);
        }

        return data;
    }

    function createElement(tag, className, text = "") {
        const element = document.createElement(tag);

        if (className) element.className = className;

        element.textContent = text;

        return element;
    }

    function createActionButton(text, action, id, className = "") {
        const button = createElement(
            "button",
            className,
            text
        );

        button.type = "button";
        button.dataset.action = action;
        button.dataset.id = id;

        return button;
    }

    function showError(message) {
        console.error(message);
        alert(message);
    }

    /* =====================================
       2. NAVIGATION
    ===================================== */

    const views = document.querySelectorAll(".app-view");
    const navLinks = document.querySelectorAll(".nav-link");

    function showView(viewId) {
        const target = document.getElementById(viewId);

        if (!target) return;

        views.forEach(view => {
            view.hidden = view.id !== viewId;
        });

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.view === viewId
            );
        });

        if (viewId === "tasksView") loadTasks();
        if (viewId === "notesView") loadNotes();
        if (viewId === "remindersView") loadReminders();
        if (viewId === "dashboardView") loadDashboard();
    }

    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            showView(link.dataset.view);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => {
            showView(button.dataset.go);
        });
    });

    /* =====================================
       3. TASK MANAGER
    ===================================== */

    const taskForm = document.getElementById("taskForm");
    const taskList = document.getElementById("taskList");

    async function loadTasks() {
        if (!taskList) return;

        try {
            const tasks = await apiRequest("/api/tasks");

            taskList.replaceChildren();

            if (!tasks.length) {
                taskList.appendChild(
                    createElement("p", "empty-message", "No tasks found. Add your first task!")
                );
                return;
            }

            tasks.forEach(task => {
                const card = createElement("div", "record-card");

                card.appendChild(
                    createElement("h3", "", task.title)
                );

                card.appendChild(
                    createElement(
                        "p",
                        "",
                        task.description || "No description"
                    )
                );

                const status = createElement(
                    "span",
                    `status-badge ${task.status}`,
                    task.status
                );

                card.appendChild(status);

                card.appendChild(
                    createElement(
                        "div",
                        "record-meta",
                        `Created: ${task.created_at}`
                    )
                );

                const actions = createElement("div", "record-actions");

                actions.appendChild(
                    createActionButton("Edit", "edit-task", task.id, "edit-button")
                );

                if (task.status === "pending") {
                    actions.appendChild(
                        createActionButton(
                            "Complete",
                            "complete-task",
                            task.id,
                            "complete-button"
                        )
                    );
                } else {
                    actions.appendChild(
                        createActionButton(
                            "Mark Pending",
                            "pending-task",
                            task.id
                        )
                    );
                }

                actions.appendChild(
                    createActionButton(
                        "Delete",
                        "delete-task",
                        task.id,
                        "delete-button"
                    )
                );

                card.appendChild(actions);
                taskList.appendChild(card);
            });

        } catch (error) {
            showError("Unable to load tasks: " + error.message);
        }
    }

    if (taskForm) {
        taskForm.addEventListener("submit", async event => {
            event.preventDefault();

            const id = document.getElementById("taskId").value;

            const title = document.getElementById("taskTitle").value.trim();
            const description = document.getElementById("taskDescription").value.trim();

            if (!title) return alert("Please enter a task title.");

            const submitButton = document.getElementById("taskSubmitButton");

            try {
                submitButton.disabled = true;

                const data = {
                    title,
                    description
                };

                const result = await apiRequest(
                    id ? `/api/tasks/${id}` : "/api/tasks",
                    {
                        method: id ? "PUT" : "POST",
                        body: JSON.stringify(data)
                    }
                );

                alert(result.message);

                taskForm.reset();
                document.getElementById("taskId").value = "";
                document.getElementById("taskSubmitButton").textContent = "Add Task";

                const cancelButton = document.getElementById("cancelTaskEdit");
                if (cancelButton) cancelButton.hidden = true;

                await loadTasks();
                await loadDashboard();

            } catch (error) {
                showError(error.message);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (taskList) {
        taskList.addEventListener("click", async event => {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            try {
                if (action === "edit-task") {
                    const tasks = await apiRequest("/api/tasks");
                    const task = tasks.find(item => String(item.id) === id);

                    if (!task) return alert("Task not found.");

                    document.getElementById("taskId").value = task.id;
                    document.getElementById("taskTitle").value = task.title;
                    document.getElementById("taskDescription").value = task.description;

                    document.getElementById("taskSubmitButton").textContent = "Update Task";
                    document.getElementById("cancelTaskEdit").hidden = false;

                    taskForm.scrollIntoView({ behavior: "smooth" });
                }

                if (action === "complete-task" || action === "pending-task") {
                    const status = action === "complete-task" ? "completed" : "pending";

                    const result = await apiRequest(
                        `/api/tasks/${id}/status`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({ status })
                        }
                    );

                    alert(result.message);
                    await loadTasks();
                    await loadDashboard();
                }

                if (action === "delete-task") {
                    if (!confirm("Are you sure you want to delete this task?")) return;

                    const result = await apiRequest(`/api/tasks/${id}`, {
                        method: "DELETE"
                    });

                    alert(result.message);
                    await loadTasks();
                    await loadDashboard();
                }

            } catch (error) {
                showError(error.message);
            }
        });
    }

    document.getElementById("cancelTaskEdit")?.addEventListener("click", () => {
        taskForm.reset();
        document.getElementById("taskId").value = "";
        document.getElementById("taskSubmitButton").textContent = "Add Task";
        document.getElementById("cancelTaskEdit").hidden = true;
    });

    /* =====================================
       4. NOTES MANAGER
    ===================================== */

    const noteForm = document.getElementById("noteForm");
    const noteList = document.getElementById("noteList");

    async function loadNotes() {
        if (!noteList) return;

        try {
            const notes = await apiRequest("/api/notes");

            noteList.replaceChildren();

            if (!notes.length) {
                noteList.appendChild(
                    createElement("p", "empty-message", "No notes found. Create your first note!")
                );
                return;
            }

            notes.forEach(note => {
                const card = createElement("div", "record-card");

                card.appendChild(
                    createElement("h3", "", note.title)
                );

                card.appendChild(
                    createElement("p", "", note.content)
                );

                card.appendChild(
                    createElement(
                        "div",
                        "record-meta",
                        `Created: ${note.created_at}`
                    )
                );

                const actions = createElement("div", "record-actions");

                actions.appendChild(
                    createActionButton("Edit", "edit-note", note.id, "edit-button")
                );

                actions.appendChild(
                    createActionButton("Delete", "delete-note", note.id, "delete-button")
                );

                card.appendChild(actions);
                noteList.appendChild(card);
            });

        } catch (error) {
            showError("Unable to load notes: " + error.message);
        }
    }

    if (noteForm) {
        noteForm.addEventListener("submit", async event => {
            event.preventDefault();

            const id = document.getElementById("noteId").value;
            const title = document.getElementById("noteTitle").value.trim();
            const content = document.getElementById("noteContent").value.trim();

            if (!title || !content) {
                return alert("Please enter both note title and content.");
            }

            const submitButton = document.getElementById("noteSubmitButton");

            try {
                submitButton.disabled = true;

                const result = await apiRequest(
                    id ? `/api/notes/${id}` : "/api/notes",
                    {
                        method: id ? "PUT" : "POST",
                        body: JSON.stringify({ title, content })
                    }
                );

                alert(result.message);

                noteForm.reset();
                document.getElementById("noteId").value = "";
                document.getElementById("noteSubmitButton").textContent = "Add Note";

                const cancelButton = document.getElementById("cancelNoteEdit");
                if (cancelButton) cancelButton.hidden = true;

                await loadNotes();
                await loadDashboard();

            } catch (error) {
                showError(error.message);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (noteList) {
        noteList.addEventListener("click", async event => {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            try {
                if (action === "edit-note") {
                    const notes = await apiRequest("/api/notes");
                    const note = notes.find(item => String(item.id) === id);

                    if (!note) return alert("Note not found.");

                    document.getElementById("noteId").value = note.id;
                    document.getElementById("noteTitle").value = note.title;
                    document.getElementById("noteContent").value = note.content;

                    document.getElementById("noteSubmitButton").textContent = "Update Note";
                    document.getElementById("cancelNoteEdit").hidden = false;

                    noteForm.scrollIntoView({ behavior: "smooth" });
                }

                if (action === "delete-note") {
                    if (!confirm("Are you sure you want to delete this note?")) return;

                    const result = await apiRequest(`/api/notes/${id}`, {
                        method: "DELETE"
                    });

                    alert(result.message);
                    await loadNotes();
                    await loadDashboard();
                }

            } catch (error) {
                showError(error.message);
            }
        });
    }

    document.getElementById("cancelNoteEdit")?.addEventListener("click", () => {
        noteForm.reset();
        document.getElementById("noteId").value = "";
        document.getElementById("noteSubmitButton").textContent = "Add Note";
        document.getElementById("cancelNoteEdit").hidden = true;
    });

    /* =====================================
       5. REMINDER MANAGER
    ===================================== */

    const reminderForm = document.getElementById("reminderForm");
    const reminderList = document.getElementById("reminderList");

/* =====================================
   REMINDER NOTIFICATIONS
===================================== */

const enableNotificationsButton =
    document.getElementById("enableNotifications");

const notifiedReminders = JSON.parse(
    localStorage.getItem("notifiedReminders") || "[]"
);

if (enableNotificationsButton) {
    enableNotificationsButton.addEventListener("click", async () => {

        if (!("Notification" in window)) {
            alert("Your browser does not support notifications.");
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            alert("Notifications enabled successfully! 🔔");
            enableNotificationsButton.textContent = "🔔 Notifications Enabled";
            checkDueReminders();
        } else {
            alert("Notification permission was not granted.");
        }
    });
}

async function checkDueReminders() {

    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
        const reminders = await apiRequest("/api/reminders");
        const now = new Date();

        reminders.forEach(reminder => {

            if (reminder.status !== "pending") return;

            const reminderDate = new Date(
                reminder.reminder_time.replace(" ", "T")
            );

            if (Number.isNaN(reminderDate.getTime())) return;
            if (reminderDate > now) return;

            const notificationKey =
                `${reminder.id}_${reminder.reminder_time}`;

            if (notifiedReminders.includes(notificationKey)) return;

            new Notification("Personal AI Assistant 🔔", {
                body: `Reminder: ${reminder.title}`,
                icon: ""
            });

            notifiedReminders.push(notificationKey);

            localStorage.setItem(
                "notifiedReminders",
                JSON.stringify(notifiedReminders)
            );
        });

    } catch (error) {
        console.error("Reminder notification error:", error.message);
    }
}

// Check immediately and then every 30 seconds.
checkDueReminders();

setInterval(checkDueReminders, 30000);


    async function loadReminders() {
        if (!reminderList) return;

        try {
            const reminders = await apiRequest("/api/reminders");

            reminderList.replaceChildren();

            if (!reminders.length) {
                reminderList.appendChild(
                    createElement("p", "empty-message", "No reminders found. Add your first reminder!")
                );
                return;
            }

            reminders.forEach(reminder => {
                const card = createElement("div", "record-card");

                card.appendChild(
                    createElement("h3", "", reminder.title)
                );

                card.appendChild(
                    createElement(
                        "p",
                        "",
                        reminder.description || "No description"
                    )
                );

                card.appendChild(
                    createElement(
                        "div",
                        "record-meta",
                        `Reminder time: ${reminder.reminder_time}`
                    )
                );

                card.appendChild(
                    createElement(
                        "span",
                        `status-badge ${reminder.status}`,
                        reminder.status
                    )
                );

                const actions = createElement("div", "record-actions");

                actions.appendChild(
                    createActionButton(
                        "Edit",
                        "edit-reminder",
                        reminder.id,
                        "edit-button"
                    )
                );

                if (reminder.status === "pending") {
                    actions.appendChild(
                        createActionButton(
                            "Complete",
                            "complete-reminder",
                            reminder.id,
                            "complete-button"
                        )
                    );
                } else {
                    actions.appendChild(
                        createActionButton(
                            "Mark Pending",
                            "pending-reminder",
                            reminder.id
                        )
                    );
                }

                actions.appendChild(
                    createActionButton(
                        "Delete",
                        "delete-reminder",
                        reminder.id,
                        "delete-button"
                    )
                );

                card.appendChild(actions);
                reminderList.appendChild(card);
            });

        } catch (error) {
            showError("Unable to load reminders: " + error.message);
        }
    }

    if (reminderForm) {
        reminderForm.addEventListener("submit", async event => {
            event.preventDefault();

            const id = document.getElementById("reminderId").value;
            const title = document.getElementById("reminderTitle").value.trim();
            const description = document.getElementById("reminderDescription").value.trim();
            const reminder_time = document.getElementById("reminderTime").value;

            if (!title || !reminder_time) {
                return alert("Please enter a title and reminder date/time.");
            }

            const submitButton = document.getElementById("reminderSubmitButton");

            try {
                submitButton.disabled = true;

                const result = await apiRequest(
                    id ? `/api/reminders/${id}` : "/api/reminders",
                    {
                        method: id ? "PUT" : "POST",
                        body: JSON.stringify({
                            title,
                            description,
                            reminder_time
                        })
                    }
                );

                alert(result.message);

                reminderForm.reset();
                document.getElementById("reminderId").value = "";
                document.getElementById("reminderSubmitButton").textContent = "Add Reminder";

                const cancelButton = document.getElementById("cancelReminderEdit");
                if (cancelButton) cancelButton.hidden = true;

                await loadReminders();
                await loadDashboard();

            } catch (error) {
                showError(error.message);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (reminderList) {
        reminderList.addEventListener("click", async event => {
            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            try {
                if (action === "edit-reminder") {
                    const reminders = await apiRequest("/api/reminders");
                    const reminder = reminders.find(item => String(item.id) === id);

                    if (!reminder) return alert("Reminder not found.");

                    document.getElementById("reminderId").value = reminder.id;
                    document.getElementById("reminderTitle").value = reminder.title;
                    document.getElementById("reminderDescription").value = reminder.description;

                    document.getElementById("reminderTime").value =
                        String(reminder.reminder_time).replace(" ", "T").slice(0, 16);

                    document.getElementById("reminderSubmitButton").textContent = "Update Reminder";
                    document.getElementById("cancelReminderEdit").hidden = false;

                    reminderForm.scrollIntoView({ behavior: "smooth" });
                }

                if (action === "complete-reminder" || action === "pending-reminder") {
                    const status = action === "complete-reminder" ? "completed" : "pending";

                    const result = await apiRequest(
                        `/api/reminders/${id}/status`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({ status })
                        }
                    );

                    alert(result.message);
                    await loadReminders();
                    await loadDashboard();
                }

                if (action === "delete-reminder") {
                    if (!confirm("Are you sure you want to delete this reminder?")) return;

                    const result = await apiRequest(`/api/reminders/${id}`, {
                        method: "DELETE"
                    });

                    alert(result.message);
                    await loadReminders();
                    await loadDashboard();
                }

            } catch (error) {
                showError(error.message);
            }
        });
    }

    document.getElementById("cancelReminderEdit")?.addEventListener("click", () => {
        reminderForm.reset();
        document.getElementById("reminderId").value = "";
        document.getElementById("reminderSubmitButton").textContent = "Add Reminder";
        document.getElementById("cancelReminderEdit").hidden = true;
    });

    /* =====================================
       6. GEMINI AI CHAT
    ===================================== */

    const chatForm = document.getElementById("chatForm");
    const chatArea = document.getElementById("chatArea");
    const chatMessage = document.getElementById("chatMessage");

    function addChatMessage(message, type) {
        if (!chatArea) return;

        const bubble = createElement(
            "div",
            `chat-message ${type}-message`,
            message
        );

        chatArea.appendChild(bubble);
        chatArea.scrollTop = chatArea.scrollHeight;

        return bubble;
    }

    if (chatForm) {
        chatForm.addEventListener("submit", async event => {
            event.preventDefault();

            const message = chatMessage.value.trim();

            if (!message) return;

            const sendButton = document.getElementById("chatSendButton");

            addChatMessage(message, "user");

            chatMessage.value = "";
            sendButton.disabled = true;

            const thinking = addChatMessage("Thinking...", "ai");

            try {
                const result = await apiRequest("/api/chat", {
                    method: "POST",
                    body: JSON.stringify({ message })
                });

                thinking.textContent = result.response || "No response received.";

                // Refresh dashboard after possible AI tool operations.
                await loadDashboard();

            } catch (error) {
                thinking.textContent = "Error: " + error.message;
                thinking.classList.add("error-message");
            } finally {
                sendButton.disabled = false;
                chatMessage.focus();
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        });
    }

    /* =====================================
       7. DASHBOARD STATISTICS
    ===================================== */

    async function loadDashboard() {
        try {
            const [tasks, notes, reminders] = await Promise.all([
                apiRequest("/api/tasks"),
                apiRequest("/api/notes"),
                apiRequest("/api/reminders")
            ]);

            const totalTasks = document.getElementById("totalTasks");
            const totalNotes = document.getElementById("totalNotes");
            const totalReminders = document.getElementById("totalReminders");

            if (totalTasks) totalTasks.textContent = tasks.length;
            if (totalNotes) totalNotes.textContent = notes.length;
            if (totalReminders) totalReminders.textContent = reminders.length;

        } catch (error) {
            console.error("Dashboard loading error:", error.message);
        }
    }

    /* =====================================
       8. 3D CARD TILT
    ===================================== */

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const cards = document.querySelectorAll(".card, .quick-card");

    if (!reduceMotion) {
        cards.forEach(card => {
            card.addEventListener("mousemove", event => {
                const rect = card.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const rotateX =
                    ((y - rect.height / 2) / (rect.height / 2)) * -5;

                const rotateY =
                    ((x - rect.width / 2) / (rect.width / 2)) * 5;

                card.style.transform =
                    `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });
    }

    /* =====================================
       9. BUTTON ANIMATION
    ===================================== */

    document.addEventListener("click", event => {
        const button = event.target.closest("button");

        if (!button) return;

        button.animate(
            [
                { transform: "scale(1)" },
                { transform: "scale(0.94)" },
                { transform: "scale(1)" }
            ],
            {
                duration: 200,
                easing: "ease-out"
            }
        );
    });

    /* =====================================
       10. THREE.JS 3D BACKGROUND
    ===================================== */

    function initThreeBackground() {
        const canvas = document.getElementById("threeBackground");

        if (!canvas || !window.THREE || reduceMotion) {
            console.log("Three.js background skipped.");
            return;
        }

        const THREE = window.THREE;
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
        camera.position.z = 8;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        const particleCount = 100;
        const particles = [];
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: (Math.random() - 0.5) * 16,
                y: (Math.random() - 0.5) * 10,
                z: (Math.random() - 0.5) * 5,
                phase: Math.random() * Math.PI * 2
            };

            particles.push(particle);

            positions[i * 3] = particle.x;
            positions[i * 3 + 1] = particle.y;
            positions[i * 3 + 2] = particle.z;
        }

        const particleGeometry = new THREE.BufferGeometry();

        particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x60a5fa,
            size: 0.07,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        const particleSystem = new THREE.Points(
            particleGeometry,
            particleMaterial
        );

        scene.add(particleSystem);

        const linePositions = new Float32Array(
            particleCount * particleCount * 6
        );

        const lineGeometry = new THREE.BufferGeometry();

        lineGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(linePositions, 3)
        );

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.22
        });

        const lines = new THREE.LineSegments(
            lineGeometry,
            lineMaterial
        );

        scene.add(lines);

        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        document.addEventListener("mousemove", event => {
            const rect = canvas.getBoundingClientRect();

            if (!rect.width || !rect.height) return;

            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;

            targetX = (x - 0.5) * 2;
            targetY = (y - 0.5) * 2;
        });

        function updateColors() {
            const isLight = document.body.classList.contains("light-mode");

            particleMaterial.color.set(
                isLight ? 0x2563eb : 0x60a5fa
            );

            lineMaterial.color.set(
                isLight ? 0x3b82f6 : 0x6366f1
            );

            lineMaterial.opacity = isLight ? 0.16 : 0.22;
        }

        updateColors();

        const themeObserver = new MutationObserver(updateColors);

        themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"]
        });

        function resizeCanvas() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            if (!width || !height) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height, false);
        }

        resizeCanvas();

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas.parentElement);

        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();

            mouseX += (targetX - mouseX) * 0.20;
            mouseY += (targetY - mouseY) * 0.20;

            particles.forEach((particle, i) => {
                positions[i * 3] =
                    particle.x +
                    Math.sin(elapsed * 0.4 + particle.phase) * 0.12;

                positions[i * 3 + 1] =
                    particle.y +
                    Math.cos(elapsed * 0.35 + particle.phase) * 0.12;

                positions[i * 3 + 2] = particle.z;
            });

            particleGeometry.attributes.position.needsUpdate = true;

            let lineIndex = 0;
            const maxDistance = 1.8;

            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = positions[i * 3] - positions[j * 3];
                    const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                    const dz = positions[i * 3 + 2] - positions[j * 3 + 2];

                    const distance = Math.sqrt(
                        dx * dx + dy * dy + dz * dz
                    );

                    if (distance < maxDistance) {
                        linePositions[lineIndex++] = positions[i * 3];
                        linePositions[lineIndex++] = positions[i * 3 + 1];
                        linePositions[lineIndex++] = positions[i * 3 + 2];

                        linePositions[lineIndex++] = positions[j * 3];
                        linePositions[lineIndex++] = positions[j * 3 + 1];
                        linePositions[lineIndex++] = positions[j * 3 + 2];
                    }
                }
            }

            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.setDrawRange(0, lineIndex / 3);

            scene.rotation.y +=
                (mouseX * 0.65 - scene.rotation.y) * 0.22;

            scene.rotation.x +=
                (-mouseY * 0.50 - scene.rotation.x) * 0.22;

            renderer.render(scene, camera);
        }

        animate();

        console.log("Three.js 3D background started successfully!");
    }

    /* =====================================
       11. INITIALIZE APPLICATION
    ===================================== */

    showView("dashboardView");

    loadDashboard();
    initThreeBackground();

    console.log("Personal AI Assistant frontend initialized!");

});
