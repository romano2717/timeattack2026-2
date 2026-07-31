const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwBCCH34xXjjYsbifahTZqONDTSk8ue9F1IXdMytkkCXGyRtG5XpFIDFm4nCmDf_x9E/exec";

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
  const fullNameInput = document.getElementById("fullName");
  const shirtSizeInput = document.getElementById("shirtSize");
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

  function createRegistrationId() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    const random = Math.floor(1000 + Math.random() * 9000);

    return `MUD-${yyyy}${mm}${dd}-${hh}${min}${ss}-${random}`;
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

  submitButton.disabled = true;
  statusText.textContent = "Submitting registration...";
  statusText.className = "form-status";

  try {
    calculateTotalFee();

    const formData = {
      registrationId: createRegistrationId(),
      fullName: fullNameInput.value.trim(),
      category: categoryInput.value,
      registrationType: registrationTypeInput.value,
      shirtSize: shirtSizeInput.value,
      kidsAddon:
        categoryInput.value === "Adult" &&
        kidsAddonInput.checked
          ? "Yes"
          : "No",
      kidsCount:
        categoryInput.value === "Adult" &&
        kidsAddonInput.checked
          ? kidsCountInput.value
          : "",
      totalFee: totalFeeInput.dataset.amount,
      paymentReference:
        paymentReferenceInput.value.trim(),
      submittedAt: new Date().toISOString(),
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(formData).toString(),
    });

    statusText.textContent =
      "Registration submitted. Please keep your GCash payment reference for verification.";

    statusText.className = "form-status success";

    registrationForm.reset();

    kidsAddonInput.checked = false;
    kidsCountInput.value = "";
    kidsCountField.hidden = true;
    kidsCountInput.required = false;

    updateRegistrationType();
    updateCategoryFields();
  } catch (error) {
    console.error(
      "Registration submission failed:",
      error,
    );

    statusText.textContent =
      "Unable to submit the registration. Please check your internet connection and try again.";

    statusText.className = "form-status error";
  } finally {
    submitButton.disabled = false;
  }
});

  updateRegistrationType();
  updateCategoryFields();
});
