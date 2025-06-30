class ExplorerDashboard {
  constructor() {
    this.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_DxD20Exi62uqA1RiYRrT53rtaUatb_v3t2sAq5FeUlsoyHjoZgrpLgh9n63R3b_1SQ/exec";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.initializeElements();
    this.bindEvents();
    this.handleInitialLoad();
  }

  initializeElements() {
    this.elements = {
      explorerIdInput: document.getElementById("explorer-id-input"),
      loadingElement: document.getElementById("loading"),
      errorElement: document.getElementById("error-message"),
      errorTextElement: document.getElementById("error-text"),
      dashboardContainer: document.getElementById("dashboard-container"),
      explorerName: document.getElementById("explorer-name"),
      explorerId: document.getElementById("explorer-id"),
      clearanceProgress: document.getElementById("clearance-progress"),
      progressPercentage: document.getElementById("progress-percentage"),
      currentStage: document.getElementById("current-stage"),
      currentFocus: document.getElementById("current-focus"),
      nextObjectiveText: document.getElementById("next-objective-text"),
      completedMissionsList: document.getElementById("completed-missions-list")
    };

    // Validate all required elements exist
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.warn(`Missing element: ${key}`);
      }
    }
  }

  bindEvents() {
    // Enhanced input handling with debouncing
    if (this.elements.explorerIdInput) {
      this.elements.explorerIdInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.handleExplorerIdSubmit();
        }
      });

      // Optional: Add real-time validation
      this.elements.explorerIdInput.addEventListener("input", (event) => {
        this.validateExplorerIdInput(event.target.value);
      });
    }

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.handleInitialLoad();
    });

    // Clear hash on load to prevent persistence
    window.addEventListener("load", () => {
      if (window.location.hash) {
        history.replaceState(null, null, " ");
      }
    });
  }

  validateExplorerIdInput(value) {
    // Basic validation - you can enhance this
    const isValid = value.trim().length > 0;
    if (this.elements.explorerIdInput) {
      this.elements.explorerIdInput.style.borderColor = isValid ? "" : "#e74c3c";
    }
    return isValid;
  }

  handleExplorerIdSubmit() {
    const explorerId = this.elements.explorerIdInput?.value.trim();
    
    if (!explorerId) {
      this.showError("Please enter a valid Explorer ID");
      return;
    }

    if (!this.validateExplorerIdInput(explorerId)) {
      this.showError("Explorer ID format is invalid");
      return;
    }

    // Update URL hash for bookmarking
    window.location.hash = encodeURIComponent(explorerId);
    this.fetchExplorerData(explorerId);
  }

  getExplorerIdFromHash() {
    try {
      return window.location.hash ? decodeURIComponent(window.location.hash.substring(1)) : null;
    } catch (e) {
      console.error("Error decoding hash:", e);
      return null;
    }
  }

  handleInitialLoad() {
    const explorerId = this.getExplorerIdFromHash();
    if (explorerId && this.elements.explorerIdInput) {
      this.elements.explorerIdInput.value = explorerId;
      this.fetchExplorerData(explorerId);
    }
  }

  showLoading() {
    this.elements.loadingElement?.style.setProperty("display", "block");
    this.elements.errorElement?.style.setProperty("display", "none");
    this.elements.dashboardContainer?.style.setProperty("display", "none");
  }

  showError(message) {
    this.elements.loadingElement?.style.setProperty("display", "none");
    this.elements.errorElement?.style.setProperty("display", "block");
    this.elements.dashboardContainer?.style.setProperty("display", "none");
    
    if (this.elements.errorTextElement) {
      this.elements.errorTextElement.textContent = message;
    }
  }

  showDashboard() {
    this.elements.loadingElement?.style.setProperty("display", "none");
    this.elements.errorElement?.style.setProperty("display", "none");
    this.elements.dashboardContainer?.style.setProperty("display", "block");
  }

  getCachedData(explorerId) {
    const cached = this.cache.get(explorerId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(explorerId, data) {
    this.cache.set(explorerId, {
      data: data,
      timestamp: Date.now()
    });
  }

  async fetchExplorerData(explorerId) {
    // Check cache first
    const cachedData = this.getCachedData(explorerId);
    if (cachedData) {
      this.displayExplorerData(cachedData);
      return;
    }

    this.showLoading();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${this.SCRIPT_URL}?id=${encodeURIComponent(explorerId)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "error") {
        this.showError(data.message || "Unknown error occurred");
        return;
      }

      // Cache successful response
      this.setCachedData(explorerId, data);
      this.displayExplorerData(data);

    } catch (error) {
      if (error.name === 'AbortError') {
        this.showError("Request timed out. Please try again.");
      } else if (error.message.includes('Failed to fetch')) {
        this.showError("Network error. Please check your connection and try again.");
      } else {
        this.showError(`Error fetching data: ${error.message}`);
      }
      console.error("Fetch error:", error);
    }
  }

  displayExplorerData(data) {
    try {
      // Update basic info
      if (this.elements.explorerName) {
        this.elements.explorerName.textContent = data.explorer.name || "Unknown Explorer";
      }
      
      if (this.elements.explorerId) {
        this.elements.explorerId.textContent = `ID: ${data.explorer.explorerId || "N/A"}`;
      }

      // Update progress bar
      const percentage = data.progress.percentage || 0;
      if (this.elements.clearanceProgress) {
        this.elements.clearanceProgress.style.width = `${percentage}%`;
      }
      
      if (this.elements.progressPercentage) {
        this.elements.progressPercentage.textContent = `${percentage}%`;
      }

      // Update status info
      if (this.elements.currentStage) {
        this.elements.currentStage.textContent = data.progress.currentStage || "Unknown";
      }
      
      if (this.elements.currentFocus) {
        this.elements.currentFocus.textContent = data.progress.currentMission || "No current mission";
      }

      // Update next objective with link formatting
      if (this.elements.nextObjectiveText) {
        this.elements.nextObjectiveText.innerHTML = this.formatNextObjective(data.progress.nextObjective || "");
      }

      // Update completed missions
      this.populateCompletedMissions(data.progress.completedMissions || []);

      // Update course progress rings and lists
      this.updateCourseProgress(data.progress.courses);

      this.showDashboard();

    } catch (error) {
      console.error("Error displaying data:", error);
      this.showError("Error displaying explorer data");
    }
  }

  updateCourseProgress(courses) {
    if (!courses) return;

    // Calculate and update progress rings
    const categories = [
      { courses: courses.introCourses, ringId: "intro-ring-progress", textId: "intro-progress-text", listId: "intro-courses-list" },
      { courses: courses.leadershipCourses, ringId: "leadership-ring-progress", textId: "leadership-progress-text", listId: "leadership-courses-list" },
      { courses: courses.eqCourses, ringId: "eq-ring-progress", textId: "eq-progress-text", listId: "eq-courses-list" }
    ];

    categories.forEach(category => {
      const progress = this.calculateCategoryProgress(category.courses);
      this.setProgressRing(category.ringId, category.textId, progress);
      this.generateCourseList(category.courses, category.listId);
    });

    // Handle capstone separately
    if (courses.capstone) {
      const capstoneProgress = courses.capstone.completed ? 100 : 0;
      this.setProgressRing("capstone-ring-progress", "capstone-progress-text", capstoneProgress);
      this.generateCapstoneList(courses.capstone);
    }
  }

  setProgressRing(ringId, textId, percentage) {
    const progressRing = document.getElementById(ringId);
    const progressText = document.getElementById(textId);
    
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }
    
    if (progressRing) {
      const rotation = 225 + (percentage / 100) * 360;
      progressRing.style.transform = `rotate(${rotation}deg)`;
    }
  }

  calculateCategoryProgress(courses) {
    if (!courses || typeof courses !== 'object') return 0;
    
    const total = Object.keys(courses).length;
    if (total === 0) return 0;
    
    const completed = Object.values(courses).filter(course => course && course.completed).length;
    return Math.round((completed / total) * 100);
  }

  generateCourseList(courses, elementId) {
    const coursesList = document.getElementById(elementId);
    if (!coursesList || !courses) return;

    coursesList.innerHTML = "";

    Object.entries(courses).forEach(([code, course]) => {
      if (!course) return;

      const li = document.createElement("li");
      li.className = "course-item";
      
      const statusClass = course.completed ? "status-complete-badge" : "status-incomplete-badge";
      const statusText = course.completed ? "Mastered" : "In Progress";
      
      li.innerHTML = `
        <div class="course-info">
          <div class="course-name">${this.escapeHtml(course.title || "Unknown Course")}</div>
          <div class="course-code">${this.escapeHtml(code)}</div>
        </div>
        <div class="course-status">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
      `;
      
      coursesList.appendChild(li);
    });
  }

  generateCapstoneList(capstone) {
    const capstoneList = document.getElementById("capstone-courses-list");
    if (!capstoneList || !capstone) return;

    capstoneList.innerHTML = "";
    
    const li = document.createElement("li");
    li.className = "course-item";
    
    const statusClass = capstone.completed ? "status-complete-badge" : "status-incomplete-badge";
    const statusText = capstone.completed ? "Mastered" : "In Progress";
    
    li.innerHTML = `
      <div class="course-info">
        <div class="course-name">${this.escapeHtml(capstone.title || "Public Speaking Capstone")}</div>
        <div class="course-code">PSC</div>
      </div>
      <div class="course-status">
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    `;
    
    capstoneList.appendChild(li);
  }

  populateCompletedMissions(completedMissions) {
    const missionsContainer = this.elements.completedMissionsList;
    if (!missionsContainer) return;

    missionsContainer.innerHTML = "";

    if (!completedMissions || completedMissions.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "mission-item";
      emptyMessage.innerHTML = `
        <div class="mission-status status-incomplete"></div>
        <div class="mission-text">No courses completed yet</div>
      `;
      missionsContainer.appendChild(emptyMessage);
      return;
    }

    const displayMissions = completedMissions.slice(0, 5);
    
    displayMissions.forEach((mission) => {
      const missionItem = document.createElement("div");
      missionItem.className = "mission-item";
      missionItem.innerHTML = `
        <div class="mission-status status-complete">
          <i class="fas fa-check"></i>
        </div>
        <div class="mission-text mission-complete">${this.escapeHtml(mission)}</div>
      `;
      missionsContainer.appendChild(missionItem);
    });

    if (completedMissions.length > 5) {
      const moreItem = document.createElement("div");
      moreItem.className = "mission-item";
      moreItem.innerHTML = `
        <div class="mission-status" style="background-color: transparent;"></div>
        <div class="mission-text" style="color: #28a745; font-style: italic;">
          + ${completedMissions.length - 5} more completed
        </div>
      `;
      missionsContainer.appendChild(moreItem);
    }
  }

  formatNextObjective(text) {
    if (!text) return "";
    
    // Convert URLs to clickable links
    const linkedText = text.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert line breaks to HTML
    return linkedText.replace(/\n/g, "<br>");
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public method to clear cache
  clearCache() {
    this.cache.clear();
  }

  // Public method to refresh current explorer data
  refreshCurrentData() {
    const explorerId = this.getExplorerIdFromHash();
    if (explorerId) {
      this.cache.delete(explorerId);
      this.fetchExplorerData(explorerId);
    }
  }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  try {
    window.explorerDashboard = new ExplorerDashboard();
  } catch (error) {
    console.error("Failed to initialize Explorer Dashboard:", error);
    // Fallback error display
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center;">
        <h3>Dashboard Error</h3>
        <p>Failed to initialize the dashboard. Please refresh the page.</p>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
});
