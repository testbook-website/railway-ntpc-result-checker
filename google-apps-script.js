/**
 * RRB NTPC Result Checker - Google Sheets Apps Script Backend
 * 
 * Instructions:
 * 1. Open a Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Click the Save icon (floppy disk).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Select Type: "Web app".
 * 7. Set:
 *    - Description: RRB NTPC Result Logger
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone (This is important so the widget can send data)
 * 8. Click "Deploy". Authorize permissions if prompted.
 * 9. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/.../exec).
 * 10. Update the `DEPLOYMENT_ID` or Web App URL in your widget's `script.js`.
 */

// Handle GET requests (Highly recommended as it avoids preflight CORS checks)
function doGet(e) {
  return handleRequest(e);
}

// Handle POST requests
function doPost(e) {
  return handleRequest(e);
}

// Main handler for both GET and POST requests
function handleRequest(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if the sheet is blank
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Roll Number", "Mobile Number", "Zone", "Qualification Status"]);
      // Format header row (bold & grey background)
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    var params = {};
    
    // Parse parameters from POST JSON body or GET query params
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback to URL-encoded parameters if parsing fails
        params = e.parameter;
      }
    } else {
      params = e.parameter;
    }
    
    var timestamp = new Date();
    var name = params.name || params.Name || "";
    var rollNumber = params.rollNumber || params.roll || params.Roll || "";
    var mobile = params.mobile || params.phone || params.Mobile || "";
    var zone = params.zone || params.Zone || "";
    var status = params.status || params.Status || "";
    
    // Normalize parameters
    name = name.trim();
    rollNumber = rollNumber.trim();
    mobile = String(mobile).trim();
    zone = zone.trim();
    status = status.trim();
    
    // Don't append empty entries
    if (!name && !rollNumber && !mobile) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "ignored", 
        message: "No data provided" 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    // Write data to the spreadsheet
    sheet.appendRow([timestamp, name, rollNumber, mobile, zone, status]);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Data logged successfully" 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
  }
}

// Handle OPTIONS (Preflight request for CORS)
function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
