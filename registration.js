const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxdsuMwyvYnad4VKe3SwgWF02br9ZFJTTkOf4yHvKil4GmsJu9y7wuxaTY5m_R3fJVJ/exec";

// Change this one value when the registration period changes:
// "Early", "Late", or "Walk-in"
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registration-form");
  const categoryInput = document.getElementById("category");
  const registrationTypeInput =
    document.getElementById("registrationType");
  const kidsAddonInput = document.getElementById("kidsAddon");
  const kidsAddonContainer = document.getElementById("kidsAddonContainer");
  const kidsCountField =
    document.getElementById("kids-count-field");
  const kidsCountInput = document.getElementById("kidsCount");
  const totalFeeInput = document.getElementById("totalFee");
  const baseFeeDisplay = document.getElementById("baseFeeDisplay");
  const kidsAddonLabel = document.getElementById("kidsAddonLabel");
  const kidsAddonFeeDisplay =
    document.getElementById("kidsAddonFeeDisplay");
  const totalFeeDisplay = document.getElementById("totalFeeDisplay");
  const statusText = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");

  if (
    !form ||
    !categoryInput ||
    !registrationTypeInput ||
    !kidsAddonInput ||
    !kidsAddonContainer ||
    !kidsCountField ||
    !kidsCountInput ||
    !totalFeeInput ||
    !baseFeeDisplay ||
    !kidsAddonLabel ||
    !kidsAddonFeeDisplay ||
    !totalFeeDisplay ||
    !statusText ||
    !submitButton
  ) {
    console.error("One or more registration form elements are missing.");
    return;
  }

  function updateRegistrationType() {
    // readonly only blocks user typing; JavaScript can still update .value
    registrationTypeInput.value = REGISTRATION_TYPE;
  }

  function formatPeso(amount) {
    return `₱${amount.toLocaleString("en-PH")}`;
  }

  function calculateTotalFee() {
    const category = categoryInput.value;

    const baseFee =
      REGISTRATION_FEES[category]?.[REGISTRATION_TYPE] ?? 0;

    const numberOfKids =
      category === "Adult" && kidsAddonInput.checked
      ? Math.max(
          1,
          Number.parseInt(kidsCountInput.value || "1", 10) || 1,
        )
      : 0;

    const kidsAddonFee = numberOfKids * KIDS_ADDON_PRICE;
    const total = baseFee + kidsAddonFee;

    baseFeeDisplay.textContent = formatPeso(baseFee);
    kidsAddonLabel.textContent = kidsAddonInput.checked
      ? `Kids add-on (${numberOfKids} × ${formatPeso(KIDS_ADDON_PRICE)})`
      : "Kids add-on";
    kidsAddonFeeDisplay.textContent = formatPeso(kidsAddonFee);
    totalFeeDisplay.textContent = formatPeso(total);

    totalFeeInput.value = formatPeso(total);
    totalFeeInput.dataset.amount = String(total);
  }


  function updateCategoryFields() {
    updateRegistrationType();

    const isAdult = categoryInput.value === "Adult";

    kidsAddonContainer.hidden = !isAdult;

    if (!isAdult) {
      kidsAddonInput.checked = false;
      kidsCountField.hidden = true;
      kidsCountInput.required = false;
      kidsCountInput.value = "";
    } else {
      updateKidsAddonFields();
    }

    calculateTotalFee();
  }

  function updateKidsAddonFields() {
    if (categoryInput.value !== "Adult") {
      kidsAddonInput.checked = false;
      kidsCountField.hidden = true;
      kidsCountInput.required = false;
      kidsCountInput.value = "";
      calculateTotalFee();
      return;
    }

    if (kidsAddonInput.checked) {
      kidsCountField.hidden = false;
      kidsCountInput.required = true;

      if (
        kidsCountInput.value === "" ||
        Number(kidsCountInput.value) < 1
      ) {
        kidsCountInput.value = "1";
      }
    } else {
      kidsCountField.hidden = true;
      kidsCountInput.required = false;
      kidsCountInput.value = "";
    }

    calculateTotalFee();
  }

  categoryInput.addEventListener("change", updateCategoryFields);
  kidsAddonInput.addEventListener("change", updateKidsAddonFields);
  kidsCountInput.addEventListener("input", () => {
    if (!kidsAddonInput.checked) {
      kidsCountInput.value = "";
      calculateTotalFee();
      return;
    }

    if (kidsCountInput.value !== "") {
      const parsedValue = Number.parseInt(kidsCountInput.value, 10);

      if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        kidsCountInput.value = "1";
      }
    }

    calculateTotalFee();
  });

  kidsCountInput.addEventListener("blur", () => {
    if (kidsAddonInput.checked && kidsCountInput.value === "") {
      kidsCountInput.value = "1";
    }

    calculateTotalFee();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    calculateTotalFee();

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
      fullName: form.elements.fullName.value.trim(),
      category: categoryInput.value,
      registrationType: REGISTRATION_TYPE,
      shirtSize: form.elements.shirtSize.value,
      kidsAddon: kidsAddonInput.checked ? "Yes" : "No",
      kidsCount: kidsAddonInput.checked
        ? kidsCountInput.value
        : "0",
      totalFee: totalFeeInput.dataset.amount || "0",
      paymentReference:
        form.elements.paymentReference.value.trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}.`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Google Sheets rejected the submission.");
      }

      form.reset();

      // Restore controlled/read-only values after reset.
      categoryInput.value = "Adult";
      kidsCountInput.value = "";
      kidsCountField.hidden = true;
      kidsCountInput.required = false;

      updateRegistrationType();
      updateCategoryFields();

      statusText.textContent = result.registrationId
        ? `Registration submitted successfully. Registration ID: ${result.registrationId}`
        : "Registration submitted successfully. Please wait for payment verification.";
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

  updateRegistrationType();
  updateCategoryFields();
});
