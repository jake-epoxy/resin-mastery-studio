const SHEETS_URL = "https://script.google.com/macros/s/AKfycbz6pkQjVCRkUH1D-G_YqsgGSROJJiIRhFq1_OpMzoABTIRi9Wl63qzt9khWVzKBN8OY/exec";

/**
 * Log a lead to the Google Sheets "Resin Academics Leads" spreadsheet.
 * Fire-and-forget — never blocks the user experience.
 */
export const logLeadToSheets = (data: {
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
}) => {
    try {
        fetch(SHEETS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                source: data.source || "Website",
            }),
            redirect: "follow",
        }).catch(() => {
            // Silent fail — never interrupt UX for analytics
        });
    } catch {
        // Swallow errors
    }
};
