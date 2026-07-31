const SHEET_NAME = "Registrations";

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error("No registration data was received.");
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`Sheet tab "${SHEET_NAME}" was not found.`);
    }

    const data = e.parameter;
    const requiredFields = [
      "fullName",
      "category",
      "registrationType",
      "shirtSize",
      "paymentReference",
    ];

    requiredFields.forEach(function (field) {
      if (!String(data[field] || "").trim()) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    const kidsCount = Number.parseInt(data.kidsCount || "0", 10);
    const totalFee = Number(data.totalFee || 0);

    if (!Number.isFinite(totalFee) || totalFee < 0) {
      throw new Error("The total registration fee is invalid.");
    }

    if (data.kidsAddon === "Yes" && (!Number.isInteger(kidsCount) || kidsCount < 1)) {
      throw new Error("The number of kids must be at least 1.");
    }

    const registrationId = createRegistrationId_();

    sheet.appendRow([
      new Date(),
      registrationId,
      String(data.fullName).trim(),
      data.category,
      data.registrationType,
      data.shirtSize,
      data.kidsAddon || "No",
      data.kidsAddon === "Yes" ? kidsCount : 0,
      totalFee,
      String(data.paymentReference).trim(),
      data.submittedAt || "",
    ]);

    return jsonResponse_({
      success: true,
      registrationId: registrationId,
      message: "Registration saved successfully.",
    });
  } catch (error) {
    console.error(error);

    return jsonResponse_({
      success: false,
      message: error && error.message
        ? error.message
        : "Unable to save the registration.",
    });
  }
}

function createRegistrationId_() {
  const timezone = Session.getScriptTimeZone();
  const timestamp = Utilities.formatDate(
    new Date(),
    timezone,
    "yyyyMMdd-HHmmss",
  );
  const randomCode = Math.floor(1000 + Math.random() * 9000);

  return `MUD-${timestamp}-${randomCode}`;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
