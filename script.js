// === THEME TOGGLER ===
document.addEventListener("DOMContentLoaded", () => {
    const themeToggleButton = document.getElementById("theme-toggle");
    const body = document.body;

    const savedTheme = localStorage.getItem("theme") || "light";
    body.setAttribute("data-theme", savedTheme);
    updateToggleButtonText(savedTheme);

    themeToggleButton.addEventListener("click", () => {
        const currentTheme = body.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        body.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateToggleButtonText(newTheme);
    });

    function updateToggleButtonText(theme) {
        themeToggleButton.textContent =
            theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";
    }

    updateTimeDisplay();
    renderTasks();
    updateCharts();
});
  
// === ACTIVITY TRACKER ===
const activityForm = document.getElementById("activity-form");
const dateInput = document.getElementById("date");
const today = new Date();
today.setHours(today.getHours() + 5);
today.setMinutes(today.getMinutes() + 30);
const formattedToday = formatDate(today);
dateInput.value = formattedToday;
const activities = JSON.parse(localStorage.getItem("activities")) || [];

if (activityForm) {
    activityForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const activity = e.target.activity.value;
        const duration = parseInt(e.target.duration.value);
        const date = e.target.date.value;

        activities.push({ activity, duration, date });
        localStorage.setItem("activities", JSON.stringify(activities));

        e.target.reset();
        dateInput.value = formattedToday;
        updateCharts();
    });
}

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

function groupByActivity(data) {
    return data.reduce((acc, item) => {
        acc[item.activity] = (acc[item.activity] || 0) + item.duration;
        return acc;
    }, {});
}

function createCharts(contextPie, contextBar, title, data) {
    new Chart(contextPie, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [{ data: Object.values(data), backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#c9cbcf"] }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: "top" },
                datalabels: {
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return ((value / total) * 100).toFixed(2) + "%";
                    },
                    color: "#fff",
                    font: { weight: "bold" }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    new Chart(contextBar, {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [{ label: title, data: Object.values(data), backgroundColor: "#36a2eb" }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateCharts() {
    updateDailyChart();
    updateWeeklyChart();
    updateMonthlyChart();
    updateYearlyChart();
}

function updateDailyChart() {
    document.getElementById("daily-date").textContent = formattedToday;
    const todayData = activities.filter(a => a.date === formattedToday);
    const activityData = groupByActivity(todayData);

    createCharts(
        document.getElementById("dailyPieChart").getContext("2d"),
        document.getElementById("dailyBarChart").getContext("2d"),
        "Daily Activity", activityData
    );
}

function updateWeeklyChart() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    document.getElementById("week-start").textContent = formatDate(weekStart);
    document.getElementById("week-end").textContent = formatDate(weekEnd);

    const weeklyData = activities.filter(item => {
        const d = new Date(item.date);
        return d >= weekStart && d <= weekEnd;
    });

    const activityData = groupByActivity(weeklyData);

    createCharts(
        document.getElementById("weeklyPieChart").getContext("2d"),
        document.getElementById("weeklyBarChart").getContext("2d"),
        "Weekly Activity", activityData
    );
}

function updateMonthlyChart() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById("month-start").textContent = formatDate(monthStart);
    document.getElementById("month-end").textContent = formatDate(monthEnd);

    const monthlyData = activities.filter(item => {
        const d = new Date(item.date);
        return d >= monthStart && d <= monthEnd;
    });

    const activityData = groupByActivity(monthlyData);

    createCharts(
        document.getElementById("monthlyPieChart").getContext("2d"),
        document.getElementById("monthlyBarChart").getContext("2d"),
        "Monthly Activity", activityData
    );
}

function updateYearlyChart() {
    const year = new Date().getFullYear();
    const yearlyData = activities.filter(item => item.date.startsWith(year.toString()));
    const activityData = groupByActivity(yearlyData);

    createCharts(
        document.getElementById("yearlyPieChart").getContext("2d"),
        document.getElementById("yearlyBarChart").getContext("2d"),
        "Yearly Activity", activityData
    );
}

document.getElementById("print-weekly")?.addEventListener("click", () => {
    const weeklyReport = document.getElementById("weekly-report").innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
        <html><head><title>Weekly Report</title></head><body>
        <h1>Weekly Report</h1>${weeklyReport}
        </body></html>
    `);
    win.document.close();
    win.print();
});

// === TASK MANAGER ===
function getCurrentDateString() {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "short", day: "numeric"
    });
}

function addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();
    if (!taskText) {
        alert("Please enter a task.");
        return;
    }

    const dateStr = getCurrentDateString();
    const task = { text: taskText, date: dateStr, completed: false };
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    if (!tasks[dateStr]) tasks[dateStr] = [];
    tasks[dateStr].push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    taskInput.value = "";
}

function toggleTask(date, index) {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    if (tasks[date]) {
        tasks[date][index].completed = !tasks[date][index].completed;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
    }
}

function deleteTask(date, index) {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    if (tasks[date]) {
        tasks[date].splice(index, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
    }
}

function renderTasks() {
    const incompleteList = document.getElementById("incompleteTasks");
    const completedList = document.getElementById("completedTasks");
    incompleteList.innerHTML = "";
    completedList.innerHTML = "";

    const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
    const today = getCurrentDateString();
    const todayTasks = tasks[today] || [];

    todayTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.className = task.completed ? "completed" : "";
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask('${today}', ${index})">
            <span class="task-label">${task.text}</span>
            <span class="task-date">${task.date}</span>
            <button onclick="deleteTask('${today}', ${index})">🗑</button>
        `;
        (task.completed ? completedList : incompleteList).appendChild(li);
    });
}



// === STOPWATCH ===
let stopwatchInterval;
let elapsedSeconds = 0;

function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
}

function updateTimeDisplay() {
    const display = document.getElementById("timeDisplay");
    if (display) {
        display.textContent = formatTime(elapsedSeconds);
    }
}

function startTimer() {
    if (!stopwatchInterval) {
        stopwatchInterval = setInterval(() => {
            elapsedSeconds++;
            updateTimeDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
}

function resetTimer() {
    pauseTimer();
    elapsedSeconds = 0;
    updateTimeDisplay();
}

// extra code
const weeklyReport = document.getElementById("weekly-report").innerHTML;
document.getElementById("print-weekly")?.addEventListener("click", () => {
    const pieCanvas = document.getElementById("weeklyPieChart");
    const barCanvas = document.getElementById("weeklyBarChart");

    const pieImage = pieCanvas.toDataURL("image/png");
    const barImage = barCanvas.toDataURL("image/png");

    const win = window.open("", "_blank");
    win.document.write(`
        <html><head><title>Weekly Report</title></head><body>
        <h1>Weekly Report</h1>
        <img src="${pieImage}" style="width: 100%; max-width: 600px;" />
        <img src="${barImage}" style="width: 100%; max-width: 600px;" />
        </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
});

