function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.fullName || '',
    data.category || '',
    data.registrationType || '',
    data.shirtSize || '',
    data.kidsAddon || 'No',
    data.kidsCount || '0',
    Number(data.totalFee || 0),
    data.paymentReference || '',
    data.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
