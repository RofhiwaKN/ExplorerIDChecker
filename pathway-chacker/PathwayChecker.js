document.addEventListener("DOMContentLoaded", function () {
  const explorerIdInput = document.getElementById("explorer-id-input");
  const loadingElement = document.getElementById("loading");
  const errorElement = document.getElementById("error-message");
  const errorTextElement = document.getElementById("error-text");
  const dashboardContainer = document.getElementById("dashboard-container");
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyPyxkQrwEcj7RVOGTFN_Fy6cfSWr5kmmM3x362GL5XpZ2AQZkoYSkJ7Mmhsn8bJB3s/exec";

  function getExplorerIdFromHash() {
    try {
      return window.location.hash
        ? decodeURIComponent(window.location.hash.substring(1))
        : null;
    } catch (e) {
      console.error("Error decoding hash:", e);
      return null;
    }
  }

  function showLoading() {
    loadingElement.style.display = "block";
    errorElement.style.display = "none";
    dashboardContainer.style.display = "none";
  }

  function showError(message) {
    loadingElement.style.display = "none";
    errorElement.style.display = "block";
    dashboardContainer.style.display = "none";
    errorTextElement.textContent = message;
  }

  function showDashboard() {
    loadingElement.style.display = "none";
    errorElement.style.display = "none";
    dashboardContainer.style.display = "block";
  }

  function generateCourseList(courses, elementId) {
    const coursesList = document.getElementById(elementId);
    coursesList.innerHTML = "";
    Object.entries(courses).forEach(([code, course]) => {
      const li = document.createElement("li");
      li.className = "course-item";
      const statusClass = course.completed
        ? "status-complete-badge"
        : "status-incomplete-badge";
      const statusText = course.completed ? "Mastered" : "Not Mastered yet";
      li.innerHTML = `
          <div class="course-info">
            <div class="course-name">${course.title}</div>
            <div class="course-code">${code}</div>
          </div>
          <div class="course-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        `;
      coursesList.appendChild(li);
    });
  }

  function populateCompletedMissions(completedMissions) {
    const missionsContainer = document.getElementById(
      "completed-missions-list"
    );
    missionsContainer.innerHTML = "";
    if (completedMissions.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "mission-item";
      emptyMessage.innerHTML = `
          <div class="mission-status status-incomplete"></div>
          <div class="mission-text">No courses completed yet</div>
        `;
      missionsContainer.appendChild(emptyMessage);
      return;
    }

    completedMissions.forEach((mission) => {
      const missionItem = document.createElement("div");
      missionItem.className = "mission-item";
      missionItem.innerHTML = `
          <div class="mission-status status-complete">
            <i class="fas fa-check"></i>
          </div>
          <div class="mission-text mission-complete">${mission}</div>
        `;
      missionsContainer.appendChild(missionItem);
    });
  }

  function formatNextObjective(text) {
    const linkedText = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );
    return linkedText.replace(/\n/g, "<br>");
  }

  function fetchExplorerData(explorerId) {
    showLoading();
    fetch(`${SCRIPT_URL}?explorerId=${encodeURIComponent(explorerId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === "error") {
          showError(data.message);
          return;
        }
        displayExplorerData(data);
      })
      .catch((error) => {
        showError(`Error fetching data: ${error.message}`);
      });
  }

  function displayExplorerData(data) {
    document.getElementById("explorer-name").textContent =
      data.data.explorer.name;
    document.getElementById(
      "explorer-id"
    ).textContent = `ID: ${data.data.explorer.explorerId}`;

    document.getElementById("current-stage").textContent =
      data.data.progress.currentStage;
    document.getElementById("current-focus").textContent =
      data.data.progress.currentMission;
    document.getElementById("next-objective-text").innerHTML =
      formatNextObjective(data.data.progress.nextObjective);

    populateCompletedMissions(data.data.progress.completedMissions);

    generateCourseList(
      data.data.progress.courses.introCourses,
      "intro-courses-list"
    );
    generateCourseList(
      data.data.progress.courses.leadershipCourses,
      "leadership-courses-list"
    );
    generateCourseList(data.data.progress.courses.eqCourses, "eq-courses-list");

    const capstoneList = document.getElementById("capstone-courses-list");
    capstoneList.innerHTML = "";
    const capstone = data.data.progress.courses.capstone;
    if (capstone) {
      const li = document.createElement("li");
      li.className = "course-item";
      const statusClass = capstone.completed
        ? "status-complete-badge"
        : "status-incomplete-badge";
      const statusText = capstone.completed ? "Mastered" : "Not Mastered yet";
      li.innerHTML = `
          <div class="course-info">
            <div class="course-name">${capstone.title}</div>
            <div class="course-code">PSC</div>
          </div>
          <div class="course-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        `;
      capstoneList.appendChild(li);
    }

    showDashboard();
  }

  explorerIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const explorerId = this.value.trim();
      if (explorerId) {
        window.location.hash = encodeURIComponent(explorerId);
        fetchExplorerData(explorerId);
      } else {
        showError("Please enter a valid Explorer ID");
      }
    }
  });

  const explorerId = getExplorerIdFromHash();
  if (explorerId) {
    explorerIdInput.value = explorerId;
    fetchExplorerData(explorerId);
  }

  window.addEventListener("load", function () {
    if (window.location.hash) {
      history.replaceState(null, null, " ");
    }
  });
});
