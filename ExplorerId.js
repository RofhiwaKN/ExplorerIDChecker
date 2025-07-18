"use strict";

const config = {
  scriptURL:
    "https://script.google.com/macros/s/AKfycby_kRlp12-OMQVx8TbdA29CCBqW_rDahCWplQDVNVCVi_vkgHLUPrBYE3V02KIfNco3/exec",
  minTimeBetweenRequests: 1000,
};

const elements = {
  form: document.getElementById("idLookupForm"),
  email: document.getElementById("userEmail"),
  emailValidation: document.getElementById("emailValidation"),
  submitButton: document.getElementById("fetchID"),
  resultDiv: document.getElementById("result"),
  spinner: document.getElementById("loadingSpinner"),
 searchSection: document.getElementById("searchSection"),
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let lastRequestTime = 0;
let isProcessing = false;

function isValidEmail(email) {
  return emailRegex.test(email);
}

let validationTimeout;
elements.email.addEventListener("input", function () {
  clearTimeout(validationTimeout);

  validationTimeout = setTimeout(() => {
    const email = elements.email.value.trim();

    if (email && !isValidEmail(email)) {
      elements.email.classList.add("invalid");
      elements.emailValidation.style.display = "block";
    } else {
      elements.email.classList.remove("invalid");
      elements.emailValidation.style.display = "none";
    }

    elements.submitButton.disabled =
      !email || (email && !isValidEmail(email)) || isProcessing;
  }, 200);
});

elements.form.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = elements.email.value.trim();
  const now = Date.now();

  if (
    !email ||
    isProcessing ||
    now - lastRequestTime < config.minTimeBetweenRequests
  ) {
    if (now - lastRequestTime < config.minTimeBetweenRequests) {
      showError("Please wait a moment before trying again.");
    } else if (!email) {
      showError("Email is required.");
    }
    return;
  }

  if (!isValidEmail(email)) {
    elements.email.classList.add("invalid");
    elements.emailValidation.style.display = "block";
    return;
  }

  findExplorerID(email);
});

function findExplorerID(email) {
  isProcessing = true;
  lastRequestTime = Date.now();
  elements.submitButton.disabled = true;

  elements.spinner.style.display = "block";
  elements.resultDiv.innerHTML = "";

  fetch(`${config.scriptURL}?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then((data) => {
      try {
        const result = JSON.parse(data);

        if (Array.isArray(result)) {
          if (result[0] === "not_found") {
            showError(
              "No ID found for this email. Please use the email you registered with Nobel.",
              true
            );
          } else if (result[0] === "invalid_request") {
            showError("Something went wrong. Please try again.", true);
          } else if (result[0] === "rate_limited") {
            showError(
              "Too many requests. Please wait a moment before trying again.",
              true
            );
          } else if (result[0] === "error") {
            showError("An error occurred while processing your request.", true);
          } else {
            displayIds(result);
          }
        } else if (typeof result === "object") {
          if (result.status === "error") {
            showError(result.message || "An error occurred", true);
          } else if (result.status === "success" && result.ids) {
            displayIds(result.ids);
          } else {
            showError(
              "Unexpected response format. Please try again later.",
              true
            );
          }
        } else {
          console.error("Unexpected response format:", result);
          showError("Unexpected response. Please try again later.", true);
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
        showError(
          "Error processing server response. Please try again later.",
          true
        );
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      showError("Connection problem. Please try again later.", true);
    })
    .finally(() => {
      isProcessing = false;
      elements.spinner.style.display = "none";
      elements.submitButton.disabled = false;
    });
}

const sanitizerTemplate = document.createElement("template");
function sanitizeHtml(text) {
  if (!text) return "";
  sanitizerTemplate.innerHTML = "";
  sanitizerTemplate.textContent = text;
  return sanitizerTemplate.innerHTML;
}

function copyToClipboard(text, buttonElement) {
  navigator.clipboard.writeText(text).then(function() {
    // Success feedback
    const originalText = buttonElement.textContent || buttonElement.innerHTML;
    const isButton = buttonElement.tagName === 'BUTTON';
    
    if (isButton) {
      buttonElement.textContent = "Copied!";
      buttonElement.classList.add("copied");
    } else {
      buttonElement.innerHTML = "✅";
      buttonElement.title = "Copied!";
    }
    
    setTimeout(() => {
      if (isButton) {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove("copied");
      } else {
        buttonElement.innerHTML = "📋";
        buttonElement.title = "Copy to clipboard";
      }
    }, 2000);
  }).catch(function(err) {
    console.error('Failed to copy text: ', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      // Same success feedback as above
      const originalText = buttonElement.textContent || buttonElement.innerHTML;
      const isButton = buttonElement.tagName === 'BUTTON';
      
      if (isButton) {
        buttonElement.textContent = "Copied!";
        buttonElement.classList.add("copied");
      } else {
        buttonElement.innerHTML = "✅";
        buttonElement.title = "Copied!";
      }
      
      setTimeout(() => {
        if (isButton) {
          buttonElement.textContent = originalText;
          buttonElement.classList.remove("copied");
        } else {
          buttonElement.innerHTML = "📋";
          buttonElement.title = "Copy to clipboard";
        }
      }, 2000);
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    document.body.removeChild(textArea);
  });
}

function showError(message, showAlternative = false) {
  const errorHtml = `<p class='error'>${sanitizeHtml(message)}</p>`;
  const alternativeHtml = showAlternative
    ? `<div class='alternative-help'>
       No ID found for this email. Please use the email you registered with Nobel.
       </div>`
    : "";
   elements.searchSection.classList.remove("hidden");
  elements.resultDiv.innerHTML =alternativeHtml;
 
}

function displayIds(ids) {
  if (!ids || !ids.length) return;

  const resultCard = document.createElement("div");
  resultCard.className = "id-result-card";
  elements.searchSection.classList.add("hidden");
  
  if (ids.length === 1) {
    // For single ID, display it directly in the success message
    const successMsg = document.createElement("p");
    successMsg.className = "success";
    successMsg.innerHTML = `Your Explorer ID: <span class="id-highlight">${ids[0]}</span>`;
    resultCard.appendChild(successMsg);

    // Add copy button
    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.textContent = "Copy ID";
    copyButton.addEventListener("click", function() {
      copyToClipboard(ids[0], this);
    });
    
    // Add coming soon message
    const comingSoonMsg = document.createElement("p");
    comingSoonMsg.className = "coming-soon";
    comingSoonMsg.textContent = "The course dashboard is under maintenance and will be unavailable for a few weeks. Thanks for your patience!";
    
    // Add back button
    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "Back to Search";
    backButton.addEventListener("click", function() {
      elements.searchSection.classList.remove("hidden");
      elements.resultDiv.innerHTML = "";
    });
    
    resultCard.appendChild(copyButton);
    resultCard.appendChild(comingSoonMsg);
    resultCard.appendChild(backButton);
  } else {
    // For multiple IDs, keep the selection interface
    const successMsg = document.createElement("p");
    successMsg.className = "success";
    successMsg.textContent = `Here are your Explorer IDs:`;
    resultCard.appendChild(successMsg);

    ids.forEach((id) => {
      const idContainer = document.createElement("div");
      idContainer.className = "id-container";

      const idDiv = document.createElement("div");
      idDiv.className = "highlight-id clickable-id";
      idDiv.textContent = id;
      idDiv.dataset.id = id;

      const copyIcon = document.createElement("span");
      copyIcon.className = "copy-icon";
      copyIcon.innerHTML = "📋";
      copyIcon.title = "Copy to clipboard";
      copyIcon.addEventListener("click", function(e) {
        e.stopPropagation();
        copyToClipboard(id, this);
      });

      idContainer.appendChild(idDiv);
      idContainer.appendChild(copyIcon);
      resultCard.appendChild(idContainer);
    });

    // Add coming soon message
    const comingSoonMsg = document.createElement("p");
    comingSoonMsg.className = "coming-soon";
    comingSoonMsg.textContent = "Course Dashboard coming soon!";
    
    // Add back button for multiple IDs case
    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "Back to Search";
    backButton.addEventListener("click", function() {
      elements.searchSection.classList.remove("hidden");
      elements.resultDiv.innerHTML = "";
    });
    
    resultCard.appendChild(comingSoonMsg);
    resultCard.appendChild(backButton);
  }

  elements.resultDiv.innerHTML = "";
  elements.resultDiv.appendChild(resultCard);

  document.querySelectorAll(".clickable-id").forEach((element) => {
    element.addEventListener("click", function () {
      const explorerId = this.dataset.id;

      document.querySelectorAll(".clickable-id").forEach((el) => {
        el.classList.remove("clicked");
      });
      this.classList.add("clicked");
    });
  });
}
