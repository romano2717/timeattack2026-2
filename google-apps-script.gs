const SHEET_NAME = "Registrations";
const RECEIPT_FOLDER_ID =
  "1QhENl73e9uamD5C9i6ad4Zd-7YravbGO";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

function doGet() {
  return jsonResponse_({
    success: true,
    message: "MUDFEST registration service is running.",
  });
}

function doPost(e) {
  let receiptFile = null;

  try {
    if (!e || !e.parameter) {
      throw new Error(
        "No registration data was received.",
      );
    }

    const data = e.parameter;

    if (data.action !== "submitRegistration") {
      throw new Error("Unsupported action.");
    }

    validateRegistrationData_(data);

    const registrationId =
      String(data.registrationId).trim();
    const kidsAddon =
      data.kidsAddon === "Yes" ? "Yes" : "No";
    const kidsCount =
      kidsAddon === "Yes"
        ? Number.parseInt(data.kidsCount || "0", 10)
        : 0;
    const additionalTruck =
      data.additionalTruck === "Yes" ? "Yes" : "No";
    const additionalTruckCount =
      additionalTruck === "Yes"
        ? Number.parseInt(
            data.additionalTruckCount || "0",
            10,
          )
        : 0;
    const totalFee = Number(data.totalFee || 0);

    receiptFile = saveReceipt_(
      data,
      registrationId,
    );

    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(
        `Sheet tab "${SHEET_NAME}" was not found.`,
      );
    }

    ensureAdditionalTruckHeaders_(sheet);

    const receiptFileName =
      receiptFile.getName();
    const receiptUrl = receiptFile.getUrl();

    sheet.appendRow([
      new Date(),
      registrationId,
      sanitizeCell_(data.fullName),
      sanitizeCell_(data.category),
      sanitizeCell_(data.registrationType),
      sanitizeCell_(data.shirtSize),
      kidsAddon,
      kidsCount,
      totalFee,
      receiptFileName,
      receiptUrl,
      data.submittedAt || "",
      additionalTruck,
      additionalTruckCount,
    ]);

    SpreadsheetApp.flush();

    return jsonResponse_({
      success: true,
      registrationId,
      receiptFileName,
      receiptUrl,
      message:
        "Registration and receipt saved successfully.",
    });
  } catch (error) {
    console.error(error);

    // Remove the receipt if saving the Sheet row fails.
    if (receiptFile) {
      try {
        receiptFile.setTrashed(true);
      } catch (cleanupError) {
        console.error(
          "Unable to remove orphan receipt:",
          cleanupError,
        );
      }
    }

    return jsonResponse_({
      success: false,
      message:
        error && error.message
          ? error.message
          : "Unable to save the registration.",
    });
  }
}

function validateRegistrationData_(data) {
  const requiredFields = [
    "registrationId",
    "fullName",
    "category",
    "registrationType",
    "shirtSize",
    "receiptBase64",
  ];

  requiredFields.forEach(function (field) {
    if (!String(data[field] || "").trim()) {
      throw new Error(
        `Missing required field: ${field}`,
      );
    }
  });

  const allowedCategories = ["Adult", "Kid"];

  if (
    !allowedCategories.includes(
      String(data.category).trim(),
    )
  ) {
    throw new Error(
      "Invalid participant category.",
    );
  }

  const allowedRegistrationTypes = [
    "Early",
    "Late",
    "Walk-in",
  ];

  if (
    !allowedRegistrationTypes.includes(
      String(data.registrationType).trim(),
    )
  ) {
    throw new Error(
      "Invalid registration type.",
    );
  }

  const totalFee = Number(data.totalFee);

  if (!Number.isFinite(totalFee) || totalFee < 0) {
    throw new Error(
      "Invalid total registration fee.",
    );
  }

  if (data.kidsAddon === "Yes") {
    const kidsCount = Number.parseInt(
      data.kidsCount || "0",
      10,
    );

    if (
      String(data.category).trim() !== "Adult" ||
      !Number.isInteger(kidsCount) ||
      kidsCount < 1 ||
      kidsCount > 10
    ) {
      throw new Error(
        "The number of kids must be from 1 to 10.",
      );
    }
  }

  if (data.additionalTruck === "Yes") {
    const additionalTruckCount = Number.parseInt(
      data.additionalTruckCount || "0",
      10,
    );

    if (
      String(data.category).trim() !== "Adult" ||
      !Number.isInteger(additionalTruckCount) ||
      additionalTruckCount < 1 ||
      additionalTruckCount > 10
    ) {
      throw new Error(
        "The number of additional trucks must be from 1 to 10.",
      );
    }
  }
}

function ensureAdditionalTruckHeaders_(sheet) {
  if (!sheet.getRange("M1").getValue()) {
    sheet.getRange("M1").setValue("Additional Truck");
  }

  if (!sheet.getRange("N1").getValue()) {
    sheet
      .getRange("N1")
      .setValue("Number of Additional Trucks");
  }
}

function saveReceipt_(data, registrationId) {
  const receiptBase64 = String(
    data.receiptBase64 || "",
  ).trim();

  const receiptMimeType = String(
    data.receiptMimeType || "image/jpeg",
  ).trim();

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedMimeTypes.includes(
      receiptMimeType,
    )
  ) {
    throw new Error(
      "Unsupported receipt image type.",
    );
  }

  const bytes =
    Utilities.base64Decode(receiptBase64);

  if (!bytes.length) {
    throw new Error(
      "The receipt image is empty.",
    );
  }

  if (bytes.length > MAX_RECEIPT_BYTES) {
    throw new Error(
      "The receipt image exceeds the 5 MB limit.",
    );
  }

  const extensionByMimeType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension =
    extensionByMimeType[receiptMimeType];
  const participantName =
    sanitizeFileName_(data.fullName);
  const fileName =
    `${registrationId}-${participantName}.${extension}`;

  const blob = Utilities.newBlob(
    bytes,
    receiptMimeType,
    fileName,
  );

  const folder =
    DriveApp.getFolderById(RECEIPT_FOLDER_ID);

  return folder.createFile(blob);
}

function sanitizeCell_(value) {
  const text = String(value || "").trim();

  // Prevent spreadsheet formula injection.
  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

function sanitizeFileName_(value) {
  return (
    String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "participant"
  );
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this manually once if Apps Script asks for authorization.
function authorizeDriveAndSheets() {
  const folder =
    DriveApp.getFolderById(RECEIPT_FOLDER_ID);
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      `Sheet tab "${SHEET_NAME}" was not found.`,
    );
  }

  console.log(folder.getName());
  console.log(sheet.getName());
}
