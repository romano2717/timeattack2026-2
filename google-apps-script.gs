function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.fullName || '',
    data.category || '',
    data.shirtSize || '',
    data.kidsAddon || 'No',
    data.kidsCount || '0',
    data.paymentReference || '',
    data.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
