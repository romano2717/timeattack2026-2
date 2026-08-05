const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxSzGvWecES5MgRdGv2ieJJwFn2pArtGK2j5VDRA_uBYYRfERIs4ZVvOnJbODj62zPE/exec";

// Change this value when the registration period changes:
// "Early", "Late", or "Walk-in"
const REGISTRATION_TYPE = "Early";

const KIDS_ADDON_PRICE = 100;
const ADDITIONAL_TRUCK_PRICE = 200;
const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RECEIPT_DIMENSION = 1600;
const RECEIPT_JPEG_QUALITY = 0.75;

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
  const registrationFormCard = document.getElementById("registrationFormCard");
  const categoryInput = document.getElementById("category");
  const fullNameInput = document.getElementById("fullName");
  const shirtSizeInput = document.getElementById("shirtSize");
  const paymentReceiptInput = document.getElementById("paymentReceipt");
  const paymentReceiptPreview = document.getElementById(
    "paymentReceiptPreview",
  );
  const registrationTypeBadge = document.getElementById(
    "registrationTypeBadge",
  );
  const registrationTypeBadgeLabel = document.getElementById(
    "registrationTypeBadgeLabel",
  );
  const registrationTypeBadgeFee = document.getElementById(
    "registrationTypeBadgeFee",
  );
  const kidsAddonInput = document.getElementById("kidsAddon");
  const adultAddonsContainer = document.getElementById("adultAddonsContainer");
  const kidsCountField = document.getElementById("kids-count-field");
  const kidsCountInput = document.getElementById("kidsCount");
  const additionalTruckInput = document.getElementById("additionalTruck");
  const additionalTruckCountField = document.getElementById(
    "additional-truck-count-field",
  );
  const additionalTruckCountInput = document.getElementById(
    "additionalTruckCount",
  );
  const totalFeeInput = document.getElementById("totalFee");
  const baseFeeDisplay = document.getElementById("baseFeeDisplay");
  const kidsAddonLabel = document.getElementById("kidsAddonLabel");
  const kidsAddonFeeDisplay = document.getElementById("kidsAddonFeeDisplay");
  const additionalTruckLabel = document.getElementById("additionalTruckLabel");
  const additionalTruckFeeDisplay = document.getElementById(
    "additionalTruckFeeDisplay",
  );
  const totalFeeDisplay = document.getElementById("totalFeeDisplay");
  const statusText = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");
  const generatedReceiptSection = document.getElementById(
    "generatedReceiptSection",
  );
  const generatedReceiptPreview = document.getElementById(
    "generatedReceiptPreview",
  );
  const registerAnotherButton = document.getElementById(
    "registerAnotherButton",
  );

  if (
    !form ||
    !registrationFormCard ||
    !categoryInput ||
    !fullNameInput ||
    !shirtSizeInput ||
    !paymentReceiptInput ||
    !paymentReceiptPreview ||
    !registrationTypeBadge ||
    !registrationTypeBadgeLabel ||
    !registrationTypeBadgeFee ||
    !kidsAddonInput ||
    !adultAddonsContainer ||
    !kidsCountField ||
    !kidsCountInput ||
    !additionalTruckInput ||
    !additionalTruckCountField ||
    !additionalTruckCountInput ||
    !totalFeeInput ||
    !baseFeeDisplay ||
    !kidsAddonLabel ||
    !kidsAddonFeeDisplay ||
    !additionalTruckLabel ||
    !additionalTruckFeeDisplay ||
    !totalFeeDisplay ||
    !statusText ||
    !submitButton ||
    !generatedReceiptSection ||
    !generatedReceiptPreview ||
    !registerAnotherButton
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

  function updateRegistrationTypeBadge() {
    const category = categoryInput.value || "Adult";
    const baseFee = REGISTRATION_FEES[category]?.[REGISTRATION_TYPE] ?? 0;

    registrationTypeBadgeLabel.textContent = REGISTRATION_TYPE.toUpperCase();

    registrationTypeBadgeFee.textContent = `${formatPeso(baseFee)} ENTRY`;

    registrationTypeBadge.setAttribute(
      "aria-label",
      `${REGISTRATION_TYPE} registration, ${formatPeso(baseFee)} base fee`,
    );
  }

  function formatPeso(amount) {
    return `₱${amount.toLocaleString("en-PH")}`;
  }

  function calculateTotalFee() {
    const category = categoryInput.value;

    const baseFee = REGISTRATION_FEES[category]?.[REGISTRATION_TYPE] ?? 0;

    const numberOfKids =
      category === "Adult" && kidsAddonInput.checked
        ? Math.max(1, Number.parseInt(kidsCountInput.value || "1", 10) || 1)
        : 0;

    const numberOfAdditionalTrucks =
      category === "Adult" && additionalTruckInput.checked
        ? Math.max(
            1,
            Number.parseInt(additionalTruckCountInput.value || "1", 10) || 1,
          )
        : 0;

    const kidsAddonFee = numberOfKids * KIDS_ADDON_PRICE;

    const additionalTruckFee =
      numberOfAdditionalTrucks * ADDITIONAL_TRUCK_PRICE;

    const total = baseFee + kidsAddonFee + additionalTruckFee;

    baseFeeDisplay.textContent = formatPeso(baseFee);

    kidsAddonLabel.textContent = kidsAddonInput.checked
      ? `Kids add-on (${numberOfKids} × ${formatPeso(KIDS_ADDON_PRICE)})`
      : "Kids add-on";

    kidsAddonFeeDisplay.textContent = formatPeso(kidsAddonFee);

    additionalTruckLabel.textContent = additionalTruckInput.checked
      ? `Additional Truck (${numberOfAdditionalTrucks} × ${formatPeso(
          ADDITIONAL_TRUCK_PRICE,
        )})`
      : "Additional Truck";

    additionalTruckFeeDisplay.textContent = formatPeso(additionalTruckFee);

    totalFeeDisplay.textContent = formatPeso(total);

    totalFeeInput.value = formatPeso(total);

    totalFeeInput.dataset.amount = String(total);
  }

  function updateCategoryFields() {
    updateRegistrationTypeBadge();

    const isAdult = categoryInput.value === "Adult";
    adultAddonsContainer.hidden = !isAdult;

    if (!isAdult) {
      kidsAddonInput.checked = false;
      kidsCountField.hidden = true;
      kidsCountInput.required = false;
      kidsCountInput.value = "";

      additionalTruckInput.checked = false;
      additionalTruckCountField.hidden = true;
      additionalTruckCountInput.required = false;
      additionalTruckCountInput.value = "";
    } else {
      updateKidsAddonFields();
      updateAdditionalTruckFields();
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

      kidsCountInput.value = "1";
    } else {
      kidsCountField.hidden = true;
      kidsCountInput.required = false;
      kidsCountInput.value = "";
    }

    calculateTotalFee();
  }

  function updateAdditionalTruckFields() {
    if (categoryInput.value !== "Adult") {
      additionalTruckInput.checked = false;
      additionalTruckCountField.hidden = true;
      additionalTruckCountInput.required = false;
      additionalTruckCountInput.value = "";
      calculateTotalFee();
      return;
    }

    if (additionalTruckInput.checked) {
      additionalTruckCountField.hidden = false;
      additionalTruckCountInput.required = true;

      additionalTruckCountInput.value = "1";
    } else {
      additionalTruckCountField.hidden = true;
      additionalTruckCountInput.required = false;
      additionalTruckCountInput.value = "";
    }

    calculateTotalFee();
  }

  function clearReceiptPreview() {
    paymentReceiptPreview.removeAttribute("src");
    paymentReceiptPreview.hidden = true;
  }

  function validateReceiptFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!file) {
      throw new Error("Please upload your GCash payment receipt.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("The receipt must be a JPG, PNG, or WebP image.");
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      throw new Error("The receipt image must not exceed 5 MB.");
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(new Error("Unable to read the selected receipt image."));

      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("The selected receipt image could not be processed."));

      image.src = dataUrl;
    });
  }

  async function prepareReceipt(file) {
    validateReceiptFile(file);

    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(originalDataUrl);
    const scale = Math.min(
      1,
      MAX_RECEIPT_DIMENSION / Math.max(image.width, image.height),
    );

    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to prepare the receipt image.");
    }

    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", RECEIPT_JPEG_QUALITY);

    return {
      dataUrl,
      base64: dataUrl.split(",")[1],
      mimeType: "image/jpeg",
    };
  }

  function loadCanvasImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load receipt image."));
      image.src = source;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Unable to create the downloadable receipt."));
          }
        },
        "image/png",
        RECEIPT_JPEG_QUALITY,
      );
    });
  }

  function drawRoundedRect(
    context,
    x,
    y,
    width,
    height,
    radius,
    fillStyle,
    strokeStyle = null,
  ) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fillStyle;
    context.fill();

    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  function drawLabelValue(context, label, value, x, y, width) {
    context.fillStyle = "#a84a13";
    context.font = "700 24px Arial, sans-serif";
    context.fillText(label.toUpperCase(), x, y);

    context.fillStyle = "#21170f";
    context.font = "700 30px Arial, sans-serif";

    const text = String(value || "—");
    const words = text.split(/\s+/);
    let line = "";
    let currentY = y + 40;

    words.forEach((word, index) => {
      const testLine = line ? `${line} ${word}` : word;

      if (context.measureText(testLine).width > width && line) {
        context.fillText(line, x, currentY);
        line = word;
        currentY += 34;
      } else {
        line = testLine;
      }

      if (index === words.length - 1 && line) {
        context.fillText(line, x, currentY);
      }
    });

    context.strokeStyle = "rgba(42,26,16,.14)";
    context.beginPath();
    context.moveTo(x, y + 92);
    context.lineTo(x + width, y + 92);
    context.stroke();
  }

  async function generatePremiumReceipt(submission, paymentReceiptDataUrl) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 2860;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Your browser cannot generate the receipt image.");
    }

    const orange = "#ef6c22";
    const orangeDark = "#b4470b";
    const ink = "#15110d";
    const mudDark = "#2a1a10";
    const cream = "#fff8e8";

    context.fillStyle = ink;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const headerGradient = context.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, "#130f0b");
    headerGradient.addColorStop(0.55, "#26170d");
    headerGradient.addColorStop(1, "#130f0b");
    context.fillStyle = headerGradient;
    context.fillRect(0, 0, canvas.width, 255);

    context.globalAlpha = 0.25;
    for (let index = 0; index < 90; index += 1) {
      const radius = 3 + Math.random() * 22;
      const x = index < 45 ? Math.random() * 220 : 860 + Math.random() * 220;
      const y = Math.random() * 300;

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = orange;
      context.fill();
    }
    context.globalAlpha = 1;

    context.save();
    context.translate(58, 55);
    context.rotate(-0.06);
    context.strokeStyle = orange;
    context.lineWidth = 8;
    context.strokeRect(0, 0, 125, 125);
    context.fillStyle = orange;
    context.font = "700 68px Arial Black, Arial";
    context.fillText("MF", 14, 88);
    context.restore();

    context.fillStyle = cream;
    context.font = "700 76px Arial Black, Arial";
    context.fillText("MUDFEST", 220, 115);

    context.fillStyle = orange;
    context.font = "700 76px Arial Black, Arial";
    context.fillText("RECEIPT", 620, 115);

    context.fillStyle = "#d2c3ad";
    context.font = "600 24px Arial, sans-serif";
    context.fillText("SOUTHSIDE CEBU RC", 224, 158);

    context.fillStyle = orange;
    context.font = "700 26px Arial, sans-serif";
    context.fillText("OFFICIAL REGISTRATION COPY", 619, 158);

    drawRoundedRect(context, 30, 225, 1020, 2505, 8, cream, "#5b2d16");

    // Registration ID and timestamp stacked vertically.
    drawRoundedRect(context, 60, 265, 960, 175, 14, mudDark);

    context.fillStyle = orange;
    context.font = "700 24px Arial, sans-serif";
    context.fillText("REGISTRATION ID", 90, 310);

    context.fillStyle = cream;
    context.font = "700 39px Arial, sans-serif";
    context.fillText(submission.registrationId, 90, 360);

    const submittedDate = new Date(submission.submittedAt);

    context.fillStyle = "#d8c8b2";
    context.font = "600 24px Arial, sans-serif";
    context.fillText(
      submittedDate.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      90,
      408,
    );

    context.fillStyle = orangeDark;
    context.font = "700 34px Arial Black, Arial";
    context.fillText("REGISTRATION DETAILS", 70, 500);

    drawRoundedRect(
      context,
      60,
      530,
      960,
      500,
      12,
      "#fffdf7",
      "rgba(42,26,16,.18)",
    );

    const leftX = 88;
    const rightX = 555;
    const detailWidth = 390;

    drawLabelValue(
      context,
      "Full Name",
      submission.fullName,
      leftX,
      585,
      detailWidth,
    );
    drawLabelValue(
      context,
      "Category",
      submission.category,
      leftX,
      700,
      detailWidth,
    );
    drawLabelValue(
      context,
      "Registration Type",
      submission.registrationType,
      leftX,
      815,
      detailWidth,
    );
    drawLabelValue(
      context,
      "T-shirt Size",
      submission.shirtSize,
      leftX,
      930,
      detailWidth,
    );

    drawLabelValue(
      context,
      "Kids Add-on",
      submission.kidsAddon === "Yes"
        ? `Yes — ${submission.kidsCount} kid(s)`
        : "No",
      rightX,
      585,
      detailWidth,
    );
    drawLabelValue(
      context,
      "Additional Truck",
      submission.additionalTruck === "Yes"
        ? `Yes — ${submission.additionalTruckCount} truck(s)`
        : "No",
      rightX,
      700,
      detailWidth,
    );
    drawLabelValue(
      context,
      "Event Date",
      "September 19, 2026 — 9:00 AM",
      rightX,
      815,
      detailWidth,
    );
    drawLabelValue(
      context,
      "Venue",
      "Southern Hills, Minglanilla, Cebu",
      rightX,
      930,
      detailWidth,
    );

    context.fillStyle = orangeDark;
    context.font = "700 34px Arial Black, Arial";
    context.fillText("FEE BREAKDOWN", 70, 1090);

    drawRoundedRect(
      context,
      60,
      1120,
      960,
      305,
      12,
      "#f4ead8",
      "rgba(42,26,16,.18)",
    );

    const baseFee =
      REGISTRATION_FEES[submission.category]?.[submission.registrationType] ??
      0;

    const kidsFee = Number(submission.kidsCount || 0) * KIDS_ADDON_PRICE;

    const truckFee =
      Number(submission.additionalTruckCount || 0) * ADDITIONAL_TRUCK_PRICE;

    const rows = [
      [
        `Base Fee (${submission.category} — ${submission.registrationType})`,
        baseFee,
      ],
      [
        `Kids Add-on (${submission.kidsCount || 0} × ₱${KIDS_ADDON_PRICE})`,
        kidsFee,
      ],
      [
        `Additional Truck (${
          submission.additionalTruckCount || 0
        } × ₱${ADDITIONAL_TRUCK_PRICE})`,
        truckFee,
      ],
    ];

    context.font = "600 28px Arial, sans-serif";

    rows.forEach(([label, amount], index) => {
      const rowY = 1180 + index * 65;
      context.fillStyle = mudDark;
      context.textAlign = "left";
      context.fillText(label, 90, rowY);
      context.textAlign = "right";
      context.fillText(formatPeso(Number(amount)), 980, rowY);
    });

    context.strokeStyle = "rgba(42,26,16,.26)";
    context.beginPath();
    context.moveTo(90, 1370);
    context.lineTo(980, 1370);
    context.stroke();

    context.fillStyle = orangeDark;
    context.font = "700 34px Arial Black, Arial";
    context.textAlign = "left";
    context.fillText("TOTAL FEE", 90, 1410);
    context.textAlign = "right";
    context.fillText(formatPeso(Number(submission.totalFee || 0)), 980, 1410);
    context.textAlign = "left";

    context.fillStyle = orangeDark;
    context.font = "700 34px Arial Black, Arial";
    context.fillText("PAYMENT RECEIPT SCREENSHOT", 70, 1485);

    // Larger screenshot area for readability.
    drawRoundedRect(
      context,
      60,
      1515,
      960,
      1140,
      12,
      "#ede5d7",
      "rgba(42,26,16,.18)",
    );

    // Phone-style frame for portrait payment screenshots.
    drawRoundedRect(
      context,
      250,
      1565,
      580,
      1040,
      34,
      "#111111",
      "rgba(42,26,16,.38)",
    );

    drawRoundedRect(context, 275, 1605, 530, 960, 22, "#ffffff");

    context.fillStyle = "#2b2b2b";
    context.beginPath();
    context.roundRect(460, 1578, 160, 12, 6);
    context.fill();

    const paymentImage = await loadCanvasImage(paymentReceiptDataUrl);

    const imageMaxWidth = 500;
    const imageMaxHeight = 920;
    const imageScale = Math.min(
      imageMaxWidth / paymentImage.width,
      imageMaxHeight / paymentImage.height,
    );

    const imageWidth = paymentImage.width * imageScale;
    const imageHeight = paymentImage.height * imageScale;
    const imageX = 275 + (530 - imageWidth) / 2;
    const imageY = 1605 + (960 - imageHeight) / 2;

    context.drawImage(paymentImage, imageX, imageY, imageWidth, imageHeight);

    const footerGradient = context.createLinearGradient(
      0,
      2730,
      canvas.width,
      2860,
    );
    footerGradient.addColorStop(0, "#c94d08");
    footerGradient.addColorStop(1, "#ef6c22");

    context.fillStyle = footerGradient;
    context.fillRect(0, 2730, 1080, 130);

    context.fillStyle = "#1b1008";
    context.font = "700 32px Arial Black, Arial";
    context.textAlign = "center";
    context.fillText("THANK YOU FOR BEING PART OF MUDFEST!", 540, 2785);

    context.font = "600 21px Arial, sans-serif";
    context.fillText(
      "Keep this receipt and present it during event check-in.",
      540,
      2825,
    );

    context.textAlign = "left";
    return canvas;
  }

  async function prepareGeneratedReceipt(submission, paymentReceiptDataUrl) {
    const canvas = await generatePremiumReceipt(
      submission,
      paymentReceiptDataUrl,
    );

    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);

    generatedReceiptPreview.src = objectUrl;
    generatedReceiptSection.hidden = false;

    registrationFormCard.classList.add("is-complete");

    generatedReceiptSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function uploadReceiptToDrive(receiptData, filename) {
    return new Promise((resolve) => {
      const iframeName = `mudfest-receipt-${Date.now()}`;

      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.hidden = true;

      const uploadForm = document.createElement("form");
      uploadForm.method = "POST";
      uploadForm.action = GOOGLE_SCRIPT_URL;
      uploadForm.target = iframeName;
      uploadForm.hidden = true;

      const fields = {
        action: "uploadReceipt",
        filename,
        mimeType: receiptData.mimeType,
        image: receiptData.base64,
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value || "");
        uploadForm.appendChild(input);
      });

      const finish = () => {
        setTimeout(() => {
          uploadForm.remove();
          iframe.remove();
        }, 1000);
        resolve();
      };

      iframe.addEventListener("load", finish, { once: true });

      document.body.appendChild(iframe);
      document.body.appendChild(uploadForm);
      uploadForm.submit();

      setTimeout(finish, 6000);
    });
  }

  function postToAppsScript(data) {
    return new Promise((resolve) => {
      const iframeName = `mudfest-submit-${Date.now()}`;

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
        if (resolved) return;
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

      // Apps Script's cross-origin response cannot be read.
      setTimeout(finish, 4000);
    });
  }

  paymentReceiptInput.addEventListener("change", async () => {
    clearReceiptPreview();
    statusText.textContent = "";
    statusText.className = "form-status";

    const file = paymentReceiptInput.files?.[0];

    if (!file) return;

    try {
      validateReceiptFile(file);
      paymentReceiptPreview.src = await readFileAsDataUrl(file);
      paymentReceiptPreview.hidden = false;
    } catch (error) {
      paymentReceiptInput.value = "";
      statusText.textContent =
        error?.message || "Unable to use the selected receipt.";
      statusText.className = "form-status error";
    }
  });

  categoryInput.addEventListener("change", updateCategoryFields);

  kidsAddonInput.addEventListener("change", updateKidsAddonFields);

  additionalTruckInput.addEventListener("change", updateAdditionalTruckFields);

  additionalTruckCountInput.addEventListener("change", calculateTotalFee);

  kidsCountInput.addEventListener("change", calculateTotalFee);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    statusText.textContent =
      "Preparing receipt and submitting registration. PLEASE WAIT...";
    statusText.className = "form-status";

    try {
      calculateTotalFee();

      const receiptFile = paymentReceiptInput.files?.[0];
      const receipt = await prepareReceipt(receiptFile);
      const registrationId = createRegistrationId();

      const submission = {
        action: "submitRegistration",
        registrationId,
        fullName: fullNameInput.value.trim(),
        category: categoryInput.value,
        registrationType: REGISTRATION_TYPE,
        shirtSize: shirtSizeInput.value,
        kidsAddon:
          categoryInput.value === "Adult" && kidsAddonInput.checked
            ? "Yes"
            : "No",
        kidsCount:
          categoryInput.value === "Adult" && kidsAddonInput.checked
            ? kidsCountInput.value
            : "0",
        additionalTruck:
          categoryInput.value === "Adult" && additionalTruckInput.checked
            ? "Yes"
            : "No",
        additionalTruckCount:
          categoryInput.value === "Adult" && additionalTruckInput.checked
            ? additionalTruckCountInput.value
            : "0",
        totalFee: totalFeeInput.dataset.amount || "0",
        submittedAt: new Date().toISOString(),
      };

      await postToAppsScript(submission);

      statusText.textContent =
        `Registration ${registrationId} was submitted. ` +
        "Generating your registration receipt...";
      statusText.className = "form-status success";

      await prepareGeneratedReceipt(submission, receipt.dataUrl);

      // Upload receipt separately to Google Drive.
      // Failure here does not cancel the registration.
      uploadReceiptToDrive(
        receipt,
        `${registrationId}.jpg`,
      ).catch((error) => {
        console.error("Receipt backup upload failed:", error);
      });

      statusText.textContent =
        `Registration ${registrationId} was submitted. ` +
        "Your receipt is ready. Save the image or take a screenshot of this page.";

      form.reset();
      clearReceiptPreview();
      kidsAddonInput.checked = false;
      kidsCountInput.value = "";
      kidsCountField.hidden = true;
      kidsCountInput.required = false;

      additionalTruckInput.checked = false;
      additionalTruckCountInput.value = "";
      additionalTruckCountField.hidden = true;
      additionalTruckCountInput.required = false;

      updateRegistrationTypeBadge();
      updateCategoryFields();

      setTimeout(() => {
        alert(
          "Take a screenshot of this page or save the receipt image using your browser's image options. Present it during event check-in.",
        );
      }, 500);
    } catch (error) {
      console.error("Registration submission failed:", error);

      statusText.textContent =
        error?.message ||
        "Unable to submit the registration. Please try again.";
      statusText.className = "form-status error";
    } finally {
      submitButton.disabled = false;
    }
  });

  registerAnotherButton.addEventListener("click", () => {
    generatedReceiptSection.hidden = true;
    generatedReceiptPreview.removeAttribute("src");

    registrationFormCard.classList.remove("is-complete");

    form.reset();
    categoryInput.value = "Adult";

    kidsAddonInput.checked = false;
    kidsCountInput.value = "1";
    kidsCountField.hidden = true;
    kidsCountInput.required = false;

    additionalTruckInput.checked = false;
    additionalTruckCountInput.value = "1";
    additionalTruckCountField.hidden = true;
    additionalTruckCountInput.required = false;

    clearReceiptPreview();
    statusText.textContent = "";
    statusText.className = "form-status";

    updateRegistrationTypeBadge();
    updateCategoryFields();
    calculateTotalFee();

    registrationFormCard.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    fullNameInput.focus();
  });

  updateRegistrationTypeBadge();
  updateCategoryFields();
});
