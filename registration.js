const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const form = document.getElementById("registration-form");
const kidsAddon = document.getElementById("kidsAddon");
const kidsCountField = document.getElementById("kids-count-field");
const kidsCount = document.getElementById("kidsCount");
const statusText = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");

kidsAddon.addEventListener("change", () => {
  kidsCountField.hidden = !kidsAddon.checked;
  kidsCount.required = kidsAddon.checked;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    statusText.textContent = "Google Sheets connection is not configured yet.";
    statusText.className = "form-status error";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  statusText.textContent = "";

  const payload = {
    fullName: form.fullName.value.trim(),
    category: form.category.value,
    shirtSize: form.shirtSize.value,
    kidsAddon: form.kidsAddon.checked ? "Yes" : "No",
    kidsCount: form.kidsAddon.checked ? form.kidsCount.value : "0",
    paymentReference: form.paymentReference.value.trim(),
    submittedAt: new Date().toISOString(),
  };

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    form.reset();
    kidsCountField.hidden = true;
    kidsCount.required = false;
    statusText.textContent = "Registration submitted successfully. Please wait for payment verification.";
    statusText.className = "form-status success";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Unable to submit the registration. Please try again.";
    statusText.className = "form-status error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Registration";
  }
});
