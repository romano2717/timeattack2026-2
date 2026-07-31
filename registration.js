const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxSzGvWecES5MgRdGv2ieJJwFn2pArtGK2j5VDRA_uBYYRfERIs4ZVvOnJbODj62zPE/exec";

// Change this value when the registration period changes:
// "Early", "Late", or "Walk-in"
const REGISTRATION_TYPE = "Early";

const KIDS_ADDON_PRICE = 100;
const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RECEIPT_DIMENSION = 1600;
const RECEIPT_JPEG_QUALITY = 0.82;

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
  const paymentReceiptInput =
    document.getElementById("paymentReceipt");
  const paymentReceiptPreview =
    document.getElementById("paymentReceiptPreview");
  const registrationTypeInput =
    document.getElementById("registrationType");
  const kidsAddonInput = document.getElementById("kidsAddon");
  const kidsAddonContainer =
    document.getElementById("kidsAddonContainer");
  const kidsCountField =
    document.getElementById("kids-count-field");
  const kidsCountInput = document.getElementById("kidsCount");
  const totalFeeInput = document.getElementById("totalFee");
  const baseFeeDisplay =
    document.getElementById("baseFeeDisplay");
  const kidsAddonLabel =
    document.getElementById("kidsAddonLabel");
  const kidsAddonFeeDisplay =
    document.getElementById("kidsAddonFeeDisplay");
  const totalFeeDisplay =
    document.getElementById("totalFeeDisplay");
  const statusText = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");

  if (
    !form ||
    !categoryInput ||
    !fullNameInput ||
    !shirtSizeInput ||
    !paymentReceiptInput ||
    !paymentReceiptPreview ||
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
    console.error(
      "One or more registration form elements are missing.",
    );
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
            Number.parseInt(kidsCountInput.value || "1", 10) ||
              1,
          )
        : 0;

    const kidsAddonFee =
      numberOfKids * KIDS_ADDON_PRICE;

    const total = baseFee + kidsAddonFee;

    baseFeeDisplay.textContent = formatPeso(baseFee);

    kidsAddonLabel.textContent = kidsAddonInput.checked
      ? `Kids add-on (${numberOfKids} × ${formatPeso(
          KIDS_ADDON_PRICE,
        )})`
      : "Kids add-on";

    kidsAddonFeeDisplay.textContent =
      formatPeso(kidsAddonFee);

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

  function clearReceiptPreview() {
    paymentReceiptPreview.removeAttribute("src");
    paymentReceiptPreview.hidden = true;
  }

  function resetRegistrationForm() {
    form.reset();

    categoryInput.value = "Adult";
    registrationTypeInput.value = REGISTRATION_TYPE;
    shirtSizeInput.selectedIndex = 0;

    kidsAddonInput.checked = false;
    kidsAddonContainer.hidden = false;

    kidsCountInput.value = "";
    kidsCountInput.required = false;
    kidsCountField.hidden = true;

    paymentReceiptInput.value = "";
    clearReceiptPreview();

    updateRegistrationType();
    updateCategoryFields();
    calculateTotalFee();
  }

  function validateReceiptFile(file) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!file) {
      throw new Error(
        "Please upload your GCash payment receipt.",
      );
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "The receipt must be a JPG, PNG, or WebP image.",
      );
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      throw new Error(
        "The receipt image must not exceed 5 MB.",
      );
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(String(reader.result));
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read the selected receipt image.",
          ),
        );
      };

      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            "The selected receipt image could not be processed.",
          ),
        );
      };

      image.src = dataUrl;
    });
  }

  async function prepareReceipt(file) {
    validateReceiptFile(file);

    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(originalDataUrl);

    const scale = Math.min(
      1,
      MAX_RECEIPT_DIMENSION /
        Math.max(image.width, image.height),
    );

    const width = Math.max(
      1,
      Math.round(image.width * scale),
    );

    const height = Math.max(
      1,
      Math.round(image.height * scale),
    );

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Unable to prepare the receipt image.",
      );
    }

    context.drawImage(image, 0, 0, width, height);

    const compressedDataUrl = canvas.toDataURL(
      "image/jpeg",
      RECEIPT_JPEG_QUALITY,
    );

    return {
      base64: compressedDataUrl.split(",")[1],
      mimeType: "image/jpeg",
    };
  }

  function postToAppsScript(data) {
    return new Promise((resolve) => {
      const iframeName =
        `mudfest-submit-${Date.now()}`;

      const iframe = document.createElement("iframe");

      iframe.name = iframeName;
      iframe.hidden = true;

      const postForm = document.createElement("form");

      postForm.method = "POST";
      postForm.action = GOOGLE_SCRIPT_URL;
      postForm.target = iframeName;
      postForm.hidden = true;

      Object.entries(data).forEach(([name, value]) => {
        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = String(value ?? "");

        postForm.appendChild(input);
      });

      let resolved = false;

      const finish = () => {
        if (resolved) {
          return;
        }

        resolved = true;

        setTimeout(() => {
          postForm.remove();
          iframe.remove();
        }, 1000);

        resolve();
      };

      iframe.addEventListener("load", finish, {
        once: true,
      });

      document.body.appendChild(iframe);
      document.body.appendChild(postForm);

      postForm.submit();

      /*
       * The Apps Script response cannot be read because it is
       * cross-origin. This fallback resolves the promise after
       * the browser has had time to submit the hidden form.
       */
      setTimeout(finish, 4000);
    });
  }

  paymentReceiptInput.addEventListener(
    "change",
    async () => {
      clearReceiptPreview();

      statusText.textContent = "";
      statusText.className = "form-status";

      const file = paymentReceiptInput.files?.[0];

      if (!file) {
        return;
      }

      try {
        validateReceiptFile(file);

        paymentReceiptPreview.src =
          await readFileAsDataUrl(file);

        paymentReceiptPreview.hidden = false;
      } catch (error) {
        paymentReceiptInput.value = "";
        clearReceiptPreview();

        statusText.textContent =
          error?.message ||
          "Unable to use the selected receipt.";

        statusText.className = "form-status error";
      }
    },
  );

  categoryInput.addEventListener(
    "change",
    updateCategoryFields,
  );

  kidsAddonInput.addEventListener(
    "change",
    updateKidsAddonFields,
  );

  kidsCountInput.addEventListener("input", () => {
    if (!kidsAddonInput.checked) {
      kidsCountInput.value = "";
      calculateTotalFee();
      return;
    }

    if (kidsCountInput.value !== "") {
      const value = Number.parseInt(
        kidsCountInput.value,
        10,
      );

      if (!Number.isInteger(value) || value < 1) {
        kidsCountInput.value = "1";
      }

      if (value > 10) {
        kidsCountInput.value = "10";
      }
    }

    calculateTotalFee();
  });

  kidsCountInput.addEventListener("blur", () => {
    if (
      kidsAddonInput.checked &&
      kidsCountInput.value === ""
    ) {
      kidsCountInput.value = "1";
    }

    calculateTotalFee();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;

    statusText.textContent =
      "Preparing receipt and submitting registration. PLEASE WAIT...";

    statusText.className = "form-status";

    try {
      calculateTotalFee();

      const receiptFile =
        paymentReceiptInput.files?.[0];

      const receipt =
        await prepareReceipt(receiptFile);

      const registrationId =
        createRegistrationId();

      const submission = {
        action: "submitRegistration",
        registrationId,
        fullName: fullNameInput.value.trim(),
        category: categoryInput.value,
        registrationType:
          registrationTypeInput.value,
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
            : "0",
        totalFee:
          totalFeeInput.dataset.amount || "0",
        receiptMimeType: receipt.mimeType,
        receiptBase64: receipt.base64,
        submittedAt: new Date().toISOString(),
      };

      await postToAppsScript(submission);

      statusText.textContent =
        `Registration ID ${registrationId} was submitted successfully. Screenshot this Registration ID for verification`;

      statusText.className = "form-status success";

      resetRegistrationForm();
    } catch (error) {
      console.error(
        "Registration submission failed:",
        error,
      );

      statusText.textContent =
        error?.message ||
        "Unable to submit the registration. Please try again.";

      statusText.className = "form-status error";
    } finally {
      submitButton.disabled = false;
    }
  });

  updateRegistrationType();
  updateCategoryFields();
});