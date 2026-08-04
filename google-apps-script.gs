const SHEET_NAME = "Registrations";

function doGet() {
  return jsonResponse_({
    success: true,
    message: "MUDFEST registration service is running.",
  });
}

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error("No registration data was received.");
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

    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(
        `Sheet tab "${SHEET_NAME}" was not found.`,
      );
    }

    ensureHeaders_(sheet);

    sheet.appendRow([
      new Date(),                         // A Timestamp
      registrationId,                    // B Registration ID
      sanitizeCell_(data.fullName),       // C Full Name
      sanitizeCell_(data.category),       // D Category
      sanitizeCell_(data.registrationType), // E Registration Type
      sanitizeCell_(data.shirtSize),      // F Shirt Size
      kidsAddon,                          // G Kids Add-on
      kidsCount,                          // H Number of Kids
      totalFee,                           // I Total Fee
      "",                                 // J Receipt Filename (unused)
      "",                                 // K Receipt URL (unused)
      data.submittedAt || "",             // L Submitted At
      additionalTruck,                    // M Additional Truck
      additionalTruckCount,               // N Additional Truck Count
    ]);

    SpreadsheetApp.flush();

    return jsonResponse_({
      success: true,
      registrationId,
      message: "Registration saved successfully.",
    });
  } catch (error) {
    console.error(error);

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
  ];

  requiredFields.forEach(function (field) {
    if (!String(data[field] || "").trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  });

  const allowedCategories = ["Adult", "Kid"];

  if (
    !allowedCategories.includes(
      String(data.category).trim(),
    )
  ) {
    throw new Error("Invalid participant category.");
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
    throw new Error("Invalid registration type.");
  }

  const totalFee = Number(data.totalFee);

  if (!Number.isFinite(totalFee) || totalFee < 0) {
    throw new Error("Invalid total registration fee.");
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
      kidsCount > 2
    ) {
      throw new Error(
        "The number of kids must be from 1 to 2.",
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
      additionalTruckCount > 2
    ) {
      throw new Error(
        "The number of additional trucks must be from 1 to 2.",
      );
    }
  }
}

function ensureHeaders_(sheet) {
  const headers = [
    "Timestamp",
    "Registration ID",
    "Full Name",
    "Category",
    "Registration Type",
    "Shirt Size",
    "Kids Add-on",
    "Number of Kids",
    "Total Fee",
    "Receipt Filename",
    "Receipt Drive URL",
    "Submitted At",
    "Additional Truck",
    "Number of Additional Trucks",
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  headers.forEach(function (header, index) {
    const cell = sheet.getRange(1, index + 1);
    if (!cell.getValue()) {
      cell.setValue(header);
    }
  });
}

function sanitizeCell_(value) {
  const text = String(value || "").trim();

  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorizeSheets() {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      `Sheet tab "${SHEET_NAME}" was not found.`,
    );
  }

  console.log(sheet.getName());
}
