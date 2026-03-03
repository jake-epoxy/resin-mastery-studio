const SHEETS_URL = "https://script.google.com/macros/s/AKfycbyffEeMjJzWKr0QZ_jq_dernr2RtdGifLlvPxoGwZJ8iwR48fz_Rj6phBYtQMhvyxCG/exec";

/**
 * Log a lead to the Google Sheets "Resin Academics Leads" spreadsheet.
 * Fire-and-forget — never blocks the user experience.
 *
 * Uses an Image beacon as a fallback since Google Apps Script
 * redirects (302) don't play well with fetch + CORS from browsers.
 */
export const logLeadToSheets = (data: {
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
}) => {
    const params = new URLSearchParams({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        source: data.source || "Website",
    });

    // Use GET with query params — avoids all CORS / preflight issues
    // Google Apps Script doGet will handle this
    const url = `${SHEETS_URL}?${params.toString()}`;

    try {
        // Primary: fetch with no-cors
        fetch(url, { method: "GET", mode: "no-cors" }).catch(() => { });
    } catch {
        // Fallback: image beacon
        const img = new Image();
        img.src = url;
    }
};
