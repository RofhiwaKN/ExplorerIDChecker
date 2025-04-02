"use strict";

// Configuration
const config = {
  scriptURL:
    "https://script.google.com/macros/s/AKfycbxPo0CiAtIITaLP4mdeIxJDb7PmCN-4JQkkwKsiDRfOE0DuqQk_lnf7B-pJkqZ8le3rXQ/exec",
  minTimeBetweenRequests: 1500,
  requestTimeout: 10000,
};

// DOM Elements
const elements = {
  form: document.getElementById("idLookupForm"),
  email: document.getElementById("userEmail"),
  emailValidation: document.getElementById("emailValidation"),
  submitButton: document.getElementById("fetchID"),
  resultDiv: document.getElementById("result"),
  spinner: document.getElementById("loadingSpinner"),
};

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// State variables
let lastRequestTime = 0;
let isProcessing = false;
let abortController = null;
let validationTimeout;

// Functions
function isValidEmail(email) {
  return email && emailRegex.test(email);
}

function validateEmail() {
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
}

function sanitizeHtml(text) {
  if (!text) return "";
  const tempDiv = document.createElement("div");
  tempDiv.textContent = text;
  return tempDiv.innerHTML;
}

function showError(message, showAlternative = false) {
  const errorHtml = `<p class='error'>${sanitizeHtml(message)}</p>`;
  const alternativeHtml = showAlternative
    ? `<div class='alternative-help'>
        If you cannot find your ID, please double-check your email address or contact support.
       </div>`
    : "";

  elements.resultDiv.innerHTML = errorHtml + alternativeHtml;
}

function displayIds(ids) {
  if (!ids || !ids.length) return;

  const fragment = document.createDocumentFragment();
  const successMsg = document.createElement("p");
  successMsg.className = "success";
  successMsg.textContent = `Here ${
    ids.length > 1 ? "are" : "is"
  } your Explorer ID${ids.length > 1 ? "s" : ""}:`;
  fragment.appendChild(successMsg);

  ids.forEach((id) => {
    const idDiv = document.createElement("div");
    idDiv.className = "highlight-id";
    idDiv.textContent = id;
    fragment.appendChild(idDiv);
  });

  elements.resultDiv.innerHTML = "";
  elements.resultDiv.appendChild(fragment);
}

async function findExplorerID(email) {
  try {
    isProcessing = true;
    lastRequestTime = Date.now();
    elements.submitButton.disabled = true;
    elements.spinner.style.display = "block";
    elements.resultDiv.innerHTML = "";

    // Create a new AbortController for this request
    if (abortController) {
      abortController.abort(); // Cancel any previous ongoing request
    }
    abortController = new AbortController();

    // Set up timeout for the fetch request
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, config.requestTimeout);

    // URL with cache-busting parameter
    const cacheBuster = Date.now();
    const endpoint = `${config.scriptURL}?email=${encodeURIComponent(
      email
    )}&_cb=${cacheBuster}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store",
      },
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.text();
    const result = JSON.parse(data);

    if (Array.isArray(result)) {
      handleArrayResponse(result);
    } else if (typeof result === "object") {
      handleObjectResponse(result);
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      showError("Request timed out. Please try again.", true);
    } else if (error.name === "SyntaxError") {
      showError(
        "Error processing server response. Please try again later.",
        true
      );
    } else {
      showError(
        `Connection problem: ${error.message}. Please try again later.`,
        true
      );
    }
    console.error("Error fetching data:", error);
  } finally {
    isProcessing = false;
    elements.spinner.style.display = "none";
    elements.submitButton.disabled = false;
    abortController = null;
  }
}

function handleArrayResponse(result) {
  if (result[0] === "not_found") {
    showError(
      "No ID found for this email. Please use the email you registered with Nobel.",
      true
    );
  } else if (result[0] === "invalid_request") {
    showError("Invalid request. Please check your input and try again.", true);
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
}

function handleObjectResponse(result) {
  if (result.status === "error") {
    showError(result.message || "An error occurred", true);
  } else if (result.status === "success" && result.ids) {
    displayIds(result.ids);
  } else {
    showError("Unexpected response format. Please try again later.", true);
  }
}

// Event Listeners
elements.email.addEventListener("input", function () {
  clearTimeout(validationTimeout);
  validationTimeout = setTimeout(validateEmail, 300);
});

elements.form.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = elements.email.value.trim();
  const now = Date.now();

  if (!email || isProcessing) {
    if (!email) {
      showError("Email is required.");
    }
    return;
  }

  if (now - lastRequestTime < config.minTimeBetweenRequests) {
    showError(
      `Please wait ${Math.ceil(
        (config.minTimeBetweenRequests - (now - lastRequestTime)) / 1000
      )} second(s) before trying again.`
    );
    return;
  }

  if (!isValidEmail(email)) {
    elements.email.classList.add("invalid");
    elements.emailValidation.style.display = "block";
    return;
  }

  findExplorerID(email);
});

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
  // Reset the form state on page load
  elements.email.value = "";
  elements.resultDiv.innerHTML = "";
  validateEmail();
});
