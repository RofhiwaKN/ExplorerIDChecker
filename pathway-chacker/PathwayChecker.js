document.addEventListener("DOMContentLoaded",function(){const explorerIdInput=document.getElementById("explorer-id-input");const loadingElement=document.getElementById("loading");const errorElement=document.getElementById("error-message");const errorTextElement=document.getElementById("error-text");const dashboardContainer=document.getElementById("dashboard-container");const SCRIPT_URL="https://script.google.com/macros/s/AKfycbzJ7f1G7UKccEJvoFEOyVcNEDIIwzFfZDu3PyFdXtWYJIUU0uwje0ZNOTrxMqjfytWQpQ/exec";function getExplorerIdFromHash(){try{return window.location.hash?decodeURIComponent(window.location.hash.substring(1)):null}catch(e){console.error("Error decoding hash:",e);return null}}
function showLoading(){loadingElement.style.display="block";errorElement.style.display="none";dashboardContainer.style.display="none"}
function showError(message){loadingElement.style.display="none";errorElement.style.display="block";dashboardContainer.style.display="none";errorTextElement.textContent=message}
function showDashboard(){loadingElement.style.display="none";errorElement.style.display="none";dashboardContainer.style.display="block"}
function setProgressRing(ringId,textId,percentage){const progressRing=document.getElementById(ringId);const progressText=document.getElementById(textId);progressText.textContent=`${percentage}%`;const rotation=225+(percentage/100)*360;progressRing.style.transform=`rotate(${rotation}deg)`}
function generateCourseList(courses,elementId){const coursesList=document.getElementById(elementId);coursesList.innerHTML="";Object.entries(courses).forEach(([code,course])=>{const li=document.createElement("li");li.className="course-item";const statusClass=course.completed?"status-complete-badge":"status-incomplete-badge";const statusText=course.completed?"Mastered":"In Progress";li.innerHTML=`
      <div class="course-info">
        <div class="course-name">${course.title}</div>
        <div class="course-code">${code}</div>
      </div>
      <div class="course-status">
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
    `;coursesList.appendChild(li)})}
function populateCompletedMissions(completedMissions){const missionsContainer=document.getElementById("completed-missions-list");missionsContainer.innerHTML="";if(completedMissions.length===0){const emptyMessage=document.createElement("div");emptyMessage.className="mission-item";emptyMessage.innerHTML=`
      <div class="mission-status status-incomplete"></div>
      <div class="mission-text">No courses completed yet</div>
    `;missionsContainer.appendChild(emptyMessage);return}
const displayMissions=completedMissions.slice(0,5);displayMissions.forEach((mission)=>{const missionItem=document.createElement("div");missionItem.className="mission-item";missionItem.innerHTML=`
      <div class="mission-status status-complete">
        <i class="fas fa-check"></i>
      </div>
      <div class="mission-text mission-complete">${mission}</div>
    `;missionsContainer.appendChild(missionItem)});if(completedMissions.length>5){const moreItem=document.createElement("div");moreItem.className="mission-item";moreItem.innerHTML=`
      <div class="mission-status" style="background-color: transparent;"></div>
      <div class="mission-text" style="color: #28a745; font-style: italic;">
        + ${completedMissions.length - 5} more completed
      </div>
    `;missionsContainer.appendChild(moreItem)}}
function calculateCategoryProgress(courses){const total=Object.keys(courses).length;if(total===0)return 0;const completed=Object.values(courses).filter((course)=>course.completed).length;return Math.round((completed/total)*100)}
function formatNextObjective(text){const linkedText=text.replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank">$1</a>');return linkedText.replace(/\n/g,"<br>")}
function fetchExplorerData(explorerId){showLoading();fetch(`${SCRIPT_URL}?id=${encodeURIComponent(explorerId)}`).then((response)=>{if(!response.ok){throw new Error("Network response was not ok")}
return response.json()}).then((data)=>{if(data.status==="error"){showError(data.message);return}
displayExplorerData(data)}).catch((error)=>{showError(`Error fetching data: ${error.message}`)})}
function displayExplorerData(data){document.getElementById("explorer-name").textContent=data.explorer.name;document.getElementById("explorer-id").textContent=`ID: ${data.explorer.explorerId}`;document.getElementById("clearance-progress").style.width=`${data.progress.percentage}%`;document.getElementById("progress-percentage").textContent=`${data.progress.percentage}%`;document.getElementById("current-stage").textContent=data.progress.currentStage;document.getElementById("current-focus").textContent=data.progress.currentMission;document.getElementById("next-objective-text").innerHTML=formatNextObjective(data.progress.nextObjective);populateCompletedMissions(data.progress.completedMissions);const introProgress=calculateCategoryProgress(data.progress.courses.introCourses);const leadershipProgress=calculateCategoryProgress(data.progress.courses.leadershipCourses);const eqProgress=calculateCategoryProgress(data.progress.courses.eqCourses);const capstoneProgress=data.progress.courses.capstone.completed?100:0;setProgressRing("intro-ring-progress","intro-progress-text",introProgress);setProgressRing("leadership-ring-progress","leadership-progress-text",leadershipProgress);setProgressRing("eq-ring-progress","eq-progress-text",eqProgress);setProgressRing("capstone-ring-progress","capstone-progress-text",capstoneProgress);generateCourseList(data.progress.courses.introCourses,"intro-courses-list");generateCourseList(data.progress.courses.leadershipCourses,"leadership-courses-list");generateCourseList(data.progress.courses.eqCourses,"eq-courses-list");const capstoneList=document.getElementById("capstone-courses-list");capstoneList.innerHTML="";const capstone=data.progress.courses.capstone;const li=document.createElement("li");li.className="course-item";const statusClass=capstone.completed?"status-complete-badge":"status-incomplete-badge";const statusText=capstone.completed?"Mastered":"In Progress";li.innerHTML=`
    <div class="course-info">
      <div class="course-name">${capstone.title}</div>
      <div class="course-code">PSC</div>
    </div>
    <div class="course-status">
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
  `;capstoneList.appendChild(li);showDashboard()}
explorerIdInput.addEventListener("keydown",function(event){if(event.key==="Enter"){const explorerId=this.value.trim();if(explorerId){window.location.hash=encodeURIComponent(explorerId);fetchExplorerData(explorerId)}else{showError("Please enter a valid Explorer ID")}}});const explorerId=getExplorerIdFromHash();if(explorerId){explorerIdInput.value=explorerId;fetchExplorerData(explorerId)}
window.addEventListener("load",function(){if(window.location.hash){history.replaceState(null,null," ")}})})
