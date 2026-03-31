/**
 * ============================================================
 *  Jake Epoxy / Resin Academics — Quote Acceptance Handler
 * ============================================================
 *
 *  SETUP INSTRUCTIONS:
 *  1. Go to https://script.google.com  →  New Project
 *  2. Paste this entire file into the editor (replace everything)
 *  3. Click  Deploy  →  New Deployment
 *  4. Type = "Web app"
 *  5. Execute as = "Me"
 *  6. Who has access = "Anyone"
 *  7. Click Deploy  →  copy the URL
 *  8. Paste that URL into quote-lindy-carpenter.html where it says SCRIPT_URL
 *
 *  WHAT THIS DOES:
 *  - Stores the accepted quote data in a Google Sheet ("Accepted Quotes" tab)
 *  - Saves the client's signature as a PNG in your Google Drive
 *  - Emails YOU a notification with all the details
 *  - Emails the CLIENT a confirmation copy
 */

// ── CONFIG ──────────────────────────────────────────────────
// The spreadsheet to log quotes in. Leave blank to auto-create one.
const SPREADSHEET_ID = "";  // paste your sheet ID here, or leave blank

// The Google Drive folder to save signatures in. Leave blank to use root.
const DRIVE_FOLDER_ID = "";  // optional

// Your email (notifications go here). Leave blank = uses your Google account email.
const OWNER_EMAIL = "";  // e.g. "jake@example.com"
// ────────────────────────────────────────────────────────────


/**
 * Handle POST requests from the quote page
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Get or create spreadsheet
    const ss = getOrCreateSpreadsheet();
    const sheet = getOrCreateSheet(ss, "Accepted Quotes");
    
    // Save signature to Drive
    const sigUrl = saveSignatureToDrive(data.signature, data.clientName);
    
    // Log to sheet
    sheet.appendRow([
      new Date(),                    // Timestamp
      data.clientName || "",         // Client Name
      data.clientEmail || "",        // Email
      data.clientPhone || "",        // Phone
      data.projectAddress || "",     // Address
      data.quoteAmount || "",        // Quote Amount
      data.projectDescription || "", // Description
      data.dateSigned || "",         // Date Signed
      sigUrl,                        // Signature (Drive link)
      "Accepted",                    // Status
      data.quoteNumber || ""         // Quote Number
    ]);
    
    // Send notification to Jake
    sendOwnerNotification(data, sigUrl);
    
    // Send confirmation to client
    sendClientConfirmation(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for CORS-friendly fire-and-forget from browser)
 */
function doGet(e) {
  try {
    const p = e.parameter;
    
    // If there's a signature param, this is a quote acceptance
    if (p.clientName) {
      const ss = getOrCreateSpreadsheet();
      const sheet = getOrCreateSheet(ss, "Accepted Quotes");
      
      // Signature comes separately via POST, so GET won't have it
      sheet.appendRow([
        new Date(),
        p.clientName || "",
        p.clientEmail || "",
        p.clientPhone || "",
        p.projectAddress || "",
        p.quoteAmount || "",
        p.projectDescription || "",
        p.dateSigned || "",
        p.signatureUrl || "N/A — see Drive folder",
        "Accepted",
        p.quoteNumber || ""
      ]);
      
      // Send emails
      sendOwnerNotification({
        clientName: p.clientName,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone,
        projectAddress: p.projectAddress,
        quoteAmount: p.quoteAmount,
        projectDescription: p.projectDescription,
        dateSigned: p.dateSigned,
        quoteNumber: p.quoteNumber
      }, p.signatureUrl || "");
      
      sendClientConfirmation({
        clientName: p.clientName,
        clientEmail: p.clientEmail,
        quoteAmount: p.quoteAmount,
        projectDescription: p.projectDescription,
        dateSigned: p.dateSigned,
        quoteNumber: p.quoteNumber
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ── SPREADSHEET HELPERS ─────────────────────────────────────

function getOrCreateSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  
  // Check if we already created one
  const files = DriveApp.getFilesByName("Jake Epoxy — Accepted Quotes");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Create new
  const ss = SpreadsheetApp.create("Jake Epoxy — Accepted Quotes");
  const sheet = ss.getActiveSheet();
  sheet.setName("Accepted Quotes");
  sheet.appendRow([
    "Timestamp", "Client Name", "Email", "Phone", "Address",
    "Quote Amount", "Description", "Date Signed", "Signature", "Status", "Quote #"
  ]);
  sheet.setFrozenRows(1);
  sheet.getRange("1:1").setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#ffffff");
  
  return ss;
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      "Timestamp", "Client Name", "Email", "Phone", "Address",
      "Quote Amount", "Description", "Date Signed", "Signature", "Status", "Quote #"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange("1:1").setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#ffffff");
  }
  return sheet;
}


// ── SIGNATURE STORAGE ───────────────────────────────────────

function saveSignatureToDrive(base64Data, clientName) {
  if (!base64Data) return "No signature provided";
  
  try {
    // Strip the data URL prefix if present
    const raw = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const blob = Utilities.newBlob(Utilities.base64Decode(raw), "image/png",
      `signature_${(clientName || "client").replace(/\s+/g, "_")}_${new Date().getTime()}.png`);
    
    let file;
    if (DRIVE_FOLDER_ID) {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      file = folder.createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
    
  } catch (err) {
    return "Error saving signature: " + err.toString();
  }
}


// ── EMAIL: NOTIFICATION TO JAKE ─────────────────────────────

function sendOwnerNotification(data, sigUrl) {
  const to = OWNER_EMAIL || Session.getEffectiveUser().getEmail();
  
  const subject = `✅ Quote Accepted — ${data.clientName || "Client"}`;
  
  const body = `
A client has accepted a quote!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:       ${data.clientName || "N/A"}
Email:      ${data.clientEmail || "N/A"}
Phone:      ${data.clientPhone || "N/A"}
Address:    ${data.projectAddress || "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUOTE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project:    ${data.projectDescription || "N/A"}
Amount:     ${data.quoteAmount || "N/A"}
Quote #:    ${data.quoteNumber || "N/A"}
Signed:     ${data.dateSigned || "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sigUrl || "No signature captured"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time to schedule the job! 💪
  `.trim();
  
  GmailApp.sendEmail(to, subject, body);
}


// ── EMAIL: CONFIRMATION TO CLIENT ───────────────────────────

function sendClientConfirmation(data) {
  if (!data.clientEmail) return; // Can't send without email
  
  const subject = "Your Quote Confirmation — Jake Epoxy / Resin Academics";
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #0a0a0a; color: #ffffff; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; color: #78c8ff; }
    .header p { margin: 8px 0 0; color: #888; font-size: 13px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
    .detail-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { color: #333; font-weight: 600; font-size: 14px; }
    .amount { font-size: 28px; color: #333; font-weight: 700; text-align: center; margin: 20px 0; }
    .next-steps { background: #f0f8ff; border-left: 4px solid #78c8ff; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .next-steps h3 { margin: 0 0 8px; color: #333; font-size: 15px; }
    .next-steps p { margin: 0; color: #555; font-size: 14px; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { margin: 0; color: #999; font-size: 12px; }
    .footer a { color: #78c8ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jake Epoxy / Resin Academics</h1>
      <p>Professional Epoxy Flooring Services</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${data.clientName || "there"},</p>
      <p style="color: #555; line-height: 1.6;">
        Thank you for accepting your quote! This email confirms that you have reviewed and agreed
        to the terms of service. Here's a summary of your project:
      </p>
      
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Project</span>
          <span class="detail-value">${data.projectDescription || "Epoxy Floor"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Quote #</span>
          <span class="detail-value">${data.quoteNumber || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date Signed</span>
          <span class="detail-value">${data.dateSigned || "N/A"}</span>
        </div>
      </div>
      
      <div class="amount">$${(data.quoteAmount || "0").replace(/[$,]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
      
      <div class="next-steps">
        <h3>📋 What Happens Next</h3>
        <p>
          Jake will be in touch shortly to confirm your start date and go over any final details.
          A 50% deposit ($${(parseFloat((data.quoteAmount || "0").replace(/[$,]/g, "")) / 2).toLocaleString("en-US", { minimumFractionDigits: 2 })}) secures your spot on the schedule.
          The remaining balance is due upon completion.
        </p>
      </div>
      
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        If you have any questions in the meantime, don't hesitate to reach out.
        We look forward to transforming your space!
      </p>
    </div>
    <div class="footer">
      <p>Jake Epoxy / Resin Academics</p>
      <p style="margin-top: 4px;"><a href="https://resinacademics.com">resinacademics.com</a></p>
      <p style="margin-top: 4px;">El Paso, TX</p>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  const plainBody = `
Hi ${data.clientName || "there"},

Thank you for accepting your quote! Here's your confirmation:

Project: ${data.projectDescription || "Epoxy Floor"}
Amount: ${data.quoteAmount || "N/A"}
Quote #: ${data.quoteNumber || "N/A"}
Date Signed: ${data.dateSigned || "N/A"}

WHAT HAPPENS NEXT:
Jake will be in touch shortly to confirm your start date.
A 50% deposit secures your spot on the schedule.

Questions? Visit resinacademics.com

— Jake Epoxy / Resin Academics
  `.trim();
  
  GmailApp.sendEmail(data.clientEmail, subject, plainBody, {
    htmlBody: htmlBody,
    name: "Jake Epoxy / Resin Academics"
  });
}
