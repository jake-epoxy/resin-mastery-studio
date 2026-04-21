const fetch = require('node-fetch');
(async () => {
    const res = await fetch('https://resinacademics.com/');
    const html = await res.text();
    const match = html.match(/src="(\/assets\/index-[^\.]+\.js)"/);
    if (match) {
        console.log("Found JS:", match[1]);
        const jsRes = await fetch('https://resinacademics.com' + match[1]);
        const js = await jsRes.text();
        if (js.includes("Missing Supabase environment variables!")) {
             console.log("YEP, THE ERROR IS IN THE PRODUCTION JS BUNDLE");
        } else {
             console.log("NOPE, THE ERROR IS NOT IN THE BUNDLE.");
        }
    } else {
        console.log("No JS matched.");
    }
})();
