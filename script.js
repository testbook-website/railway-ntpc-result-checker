/**
 * RRB NTPC Result Checker - Client Logic
 */

// CONFIGURATION: Set your Google Apps Script Deployment ID here
// Example ID: AKfycbw5Xy9V2...
const APPS_SCRIPT_DEPLOYMENT_ID = "AKfycbwab5w_iE8zRH_0Eo8nlXthGPf5ALNHr1quqRRogPy211d4eqV2G2YOL2htm483LaLd"; 

// List of available zones
const ZONES = [
  { id: "ahmedabad", name: "Ahmedabad", active: true },
  { id: "bhopal", name: "Bhopal", active: true },
  { id: "bhubaneshwar", name: "Bhubaneshwar", active: true },
  { id: "bilaspur", name: "Bilaspur", active: true },
  { id: "chandigarh", name: "Chandigarh", active: true },
  { id: "gorakhpur", name: "Gorakhpur", active: true },
  { id: "guwahati", name: "Guwahati", active: true },
  { id: "malda", name: "Malda", active: true },
  { id: "mumbai", name: "Mumbai", active: true },
  { id: "muzaffarpur", name: "Muzaffarpur", active: true },
  { id: "ranchi", name: "Ranchi", active: true },
  { id: "silguri", name: "Silguri", active: true },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram", active: true },
];

// In-memory cache for loaded zone data (Sets of roll numbers for O(1) lookup)
const loadedZones = {};

document.addEventListener("DOMContentLoaded", () => {
  initDropdown();
  setupFormListeners();
});

// Populate the Zone dropdown
function initDropdown() {
  const zoneSelect = document.getElementById("zone-select");
  if (!zoneSelect) return;

  // Clear existing options
  zoneSelect.innerHTML = '<option value="">Select Zone</option>';

  ZONES.forEach(zone => {
    const option = document.createElement("option");
    option.value = zone.id;
    option.textContent = zone.name + (zone.active ? "" : " (Coming Soon)");
    if (!zone.active) {
      option.disabled = true;
    }
    zoneSelect.appendChild(option);
  });
}

// Setup Event Listeners for Validation and Submission
function setupFormListeners() {
  const form = document.getElementById("checker-form");
  const inputs = ["name-input", "mobile-input", "roll-input", "zone-select"];

  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    // Remove error class on focus or input
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      const errorMsg = document.getElementById(`${id}-error`);
      if (errorMsg) errorMsg.style.display = "none";
    });
    
    if (input.tagName === "SELECT") {
      input.addEventListener("change", () => {
        input.classList.remove("input-error");
        const errorMsg = document.getElementById(`${id}-error`);
        if (errorMsg) errorMsg.style.display = "none";
      });
    }
  });

  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Back button in result views
  const backButtons = document.querySelectorAll(".back-btn");
  backButtons.forEach(btn => {
    btn.addEventListener("click", resetWidgetForm);
  });
}

// Form Submission Handler
async function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("name-input");
  const mobileInput = document.getElementById("mobile-input");
  const rollInput = document.getElementById("roll-input");
  const zoneSelect = document.getElementById("zone-select");

  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();
  const roll = rollInput.value.trim();
  const zone = zoneSelect.value;

  // Validate form
  let isValid = true;

  if (!name || name.length < 2) {
    showError("name-input", "Please enter your full name (min 2 characters)");
    isValid = false;
  }

  if (!/^\d{10}$/.test(mobile)) {
    showError("mobile-input", "Please enter a valid 10-digit mobile number");
    isValid = false;
  }

  // RRB Roll numbers are 15 digits
  if (!/^\d{15}$/.test(roll)) {
    showError("roll-input", "Please enter a valid 15-digit Roll Number");
    isValid = false;
  }

  if (!zone) {
    showError("zone-select", "Please select a zone");
    isValid = false;
  }

  if (!isValid) return;

  // Show loading spinner
  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const spinner = document.getElementById("submit-spinner");
  
  if (submitBtn && btnText && spinner) {
    submitBtn.disabled = true;
    btnText.style.display = "none";
    spinner.style.display = "block";
  }

  try {
    // 1. Fetch Roll Numbers for the selected Zone if not already cached
    const isQualified = await checkRollQualification(zone, roll);

    // 2. Log details to Google Sheet in background (non-blocking)
    logToGoogleSheet(name, roll, mobile, zone, isQualified);

    // 3. Render result view
    showResult(name, roll, zone, isQualified);

  } catch (error) {
    console.error("Error during check:", error);
    alert("Something went wrong. Please check your internet connection and try again.");
  } finally {
    // Reset button state
    if (submitBtn && btnText && spinner) {
      submitBtn.disabled = false;
      btnText.style.display = "block";
      spinner.style.display = "none";
    }
  }
}

// Show validation error helper
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorMsg = document.getElementById(`${inputId}-error`);
  if (input) input.classList.add("input-error");
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
  }
}

// Check Qualification Logic
async function checkRollQualification(zoneId, rollNumber) {
  // Load zone data if not cached
  if (!loadedZones[zoneId]) {
    await new Promise((resolve, reject) => {
      const globalVarName = `rrb_${zoneId}`;
      
      // If variable is somehow already defined, use it directly
      if (window[globalVarName]) {
        loadedZones[zoneId] = new Set(window[globalVarName]);
        resolve();
        return;
      }

      // Create a script element to load the zone data dynamically
      const script = document.createElement("script");
      script.src = `data/${zoneId}.js`;
      script.async = true;

      script.onload = () => {
        const data = window[globalVarName];
        if (data) {
          loadedZones[zoneId] = new Set(data);
          script.remove(); // Keep DOM clean
          resolve();
        } else {
          script.remove();
          reject(new Error(`Failed to parse zone data variable window.${globalVarName}`));
        }
      };

      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load data script for zone: ${zoneId}`));
      };

      document.body.appendChild(script);
    });
  }

  // Check if roll number is in the qualified set
  return loadedZones[zoneId].has(rollNumber);
}

// Log student inquiry details to Google Sheet Apps Script backend
function logToGoogleSheet(name, roll, mobile, zone, isQualified) {
  const statusStr = isQualified ? "Qualified" : "Not Qualified";
  const zoneName = ZONES.find(z => z.id === zone)?.name || zone;
  
  if (!APPS_SCRIPT_DEPLOYMENT_ID) {
    console.warn("Google Apps Script Deployment ID is not set. Data logging is disabled. Details:", {
      name, roll, mobile, zone: zoneName, status: statusStr
    });
    return;
  }

  const webAppUrl = `https://script.google.com/macros/s/${APPS_SCRIPT_DEPLOYMENT_ID}/exec`;

  // Build query string for GET request (prevents CORS preflight issues)
  const queryParams = new URLSearchParams({
    name: name,
    rollNumber: roll,
    mobile: mobile,
    zone: zoneName,
    status: statusStr
  });

  // Execute fire-and-forget request with mode: 'no-cors' so redirect doesn't fail
  fetch(`${webAppUrl}?${queryParams.toString()}`, {
    method: "GET",
    mode: "no-cors",
    cache: "no-cache"
  })
  .then(() => {
    console.log("Logged student check successfully to Google Sheet");
  })
  .catch(err => {
    console.error("Failed to log entry to Google Sheet:", err);
  });
}

// Switch UI View to Result screen
function showResult(name, roll, zone, isQualified) {
  const formPanel = document.getElementById("form-panel");
  const qualifiedPanel = document.getElementById("qualified-panel");
  const notQualifiedPanel = document.getElementById("not-qualified-panel");

  if (formPanel) formPanel.classList.add("hidden");

  const zoneName = ZONES.find(z => z.id === zone)?.name || zone;

  if (isQualified) {
    // Populate Qualified details
    document.getElementById("q-name").textContent = name;
    document.getElementById("q-roll").textContent = roll;
    document.getElementById("q-zone").textContent = zoneName;
    
    if (qualifiedPanel) qualifiedPanel.classList.remove("hidden");
  } else {
    // Populate Not Qualified details
    document.getElementById("nq-name").textContent = name;
    document.getElementById("nq-roll").textContent = roll;
    document.getElementById("nq-zone").textContent = zoneName;

    if (notQualifiedPanel) notQualifiedPanel.classList.remove("hidden");
  }
}

// Reset form and return to input view
function resetWidgetForm() {
  const formPanel = document.getElementById("form-panel");
  const qualifiedPanel = document.getElementById("qualified-panel");
  const notQualifiedPanel = document.getElementById("not-qualified-panel");
  const form = document.getElementById("checker-form");

  if (qualifiedPanel) qualifiedPanel.classList.add("hidden");
  if (notQualifiedPanel) notQualifiedPanel.classList.add("hidden");
  if (formPanel) formPanel.classList.remove("hidden");
  
  if (form) {
    form.reset();
  }
}
