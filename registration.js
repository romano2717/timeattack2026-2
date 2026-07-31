const GOOGLE_SCRIPT_URL =
  "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// ======================================
// EVENT CONFIGURATION
// Change REGISTRATION_TYPE to:
// "Early", "Late", or "Walk-in"
// ======================================
const REGISTRATION_TYPE = "Early";
const KIDS_ADDON_PRICE = 100;

const REGISTRATION_FEES = {
  Adult: {
    Early: 400,
    Late: 500,
    "Walk-in": 300,
  },
  Kid: {
    Early: 400,
    Late: 500,
    "Walk-in": 100,
  },
};

const form = document.getElementById("registration-form");
const category = document.getElementById("category");
const registrationType = document.getElementById("registrationType");
const kidsAddon = document.getElementById("kidsAddon");
const kidsCountField = document.getElementById("kids-count-field");
const kidsCount = document.getElementById("kidsCount");
const totalFee = document.getElementById("totalFee");
const statusText = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");

function setRegistrationType() {
  registrationType.value = REGISTRATION_TYPE;
}

function calculateTotalFee() {
  const baseFee =
    REGISTRATION_FEES[category.value]?.[REGISTRATION_TYPE] ?? 0;

  const addonCount = kidsAddon.checked
    ? Math.max(1, Number.parseInt(kidsCount.value, 10) || 1)
    : 0;

  const amount = baseFee + addonCount * KIDS_ADDON_PRICE;

  totalFee.value = `₱${amount.toLocaleString("en-PH")}`;
  totalFee.dataset.amount = String(amount);
}

kidsAddon.addEventListener("change", () => {
  kidsCountField.hidden = !kidsAddon.checked;
  kidsCount.required = kidsAddon.checked;

  if (!kidsAddon.checked) {
    kidsCount.value = "1";
  }

  calculateTotalFee();
});

category.addEventListener("change", calculateTotalFee);
kidsCount.addEventListener("input", calculateTotalFee);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    statusText.textContent =
      "Google Sheets connection is not configured yet.";
    statusText.className = "form-status error";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  statusText.textContent = "";
  statusText.className = "form-status";

  const payload = {
    fullName: form.fullName.value.trim(),
    category: form.category.value,
    registrationType: REGISTRATION_TYPE,
    shirtSize: form.shirtSize.value,
    kidsAddon: form.kidsAddon.checked ? "Yes" : "No",
    kidsCount: form.kidsAddon.checked ? form.kidsCount.value : "0",
    totalFee: totalFee.dataset.amount || "0",
    paymentReference: form.paymentReference.value.trim(),
    submittedAt: new Date().toISOString(),
  };

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    form.reset();
    setRegistrationType();
    kidsCountField.hidden = true;
    kidsCount.required = false;
    kidsCount.value = "1";
    calculateTotalFee();

    statusText.textContent =
      "Registration submitted successfully. Please wait for payment verification.";
    statusText.className = "form-status success";
  } catch (error) {
    console.error("Registration submission failed:", error);

    statusText.textContent =
      "Unable to submit the registration. Please try again.";
    statusText.className = "form-status error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Registration";
  }
});

setRegistrationType();
calculateTotalFee();
