const DEFAULT_API = "https://libretranslate.com/translate";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "translateRequest") {
    translateBatch(msg.texts, msg.target).then(result => {
      sendResponse({ success: true, translations: result });
    }).catch(err => {
      console.error("translate error", err);
      sendResponse({ success: false, error: String(err) });
    });
    return true; // keep channel open for async response
  }
});

async function translateBatch(texts, target) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const { apiEndpoint } = await chrome.storage.local.get({ apiEndpoint: DEFAULT_API });
  const endpoint = apiEndpoint || DEFAULT_API;

  const payload = {
    q: texts,
    source: "auto",
    target: target,
    format: "text"
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Translation API error: ${res.status} ${txt}`);
  }

  const data = await res.json();
  // LibreTranslate returns either an object with "translatedText" for single string,
  // or an array of objects when q was an array. Normalize:
  if (Array.isArray(data)) {
    return data.map(item => item.translatedText ?? item);
  }
  // Some instances return {translatedText: "..."} or array in data.translations
  if (data.translatedText) {
    // single string - happens if we sent a single q
    return [data.translatedText];
  }
  if (data.translations && Array.isArray(data.translations)) {
    return data.translations.map(t => t.translatedText || t);
  }
  // If the API echoes an array under `result` or similar, try to handle commonly:
  if (Array.isArray(data.result)) {
    return data.result.map(x => (typeof x === "string") ? x : (x.translatedText || ""));
  }
  // fallback: try to return as single-text wrapped
  return [JSON.stringify(data)];
}