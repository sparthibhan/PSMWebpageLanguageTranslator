const LANGS = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },

  // Indian languages (major / commonly used)
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "ur", name: "Urdu" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "as", name: "Assamese" },
  { code: "sd", name: "Sindhi" },
  { code: "ks", name: "Kashmiri" },
  { code: "ne", name: "Nepali" },
  { code: "mni", name: "Manipuri (Meitei)" },
  { code: "bho", name: "Bhojpuri" },
  { code: "mai", name: "Maithili" },

  // fallback / other
  { code: " Other", name: "Other / Provider-specific" }
];

function $(id) { return document.getElementById(id); }

async function populate() {
  const select = $("lang");
  LANGS.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.name;
    select.appendChild(opt);
  });

  const stored = await chrome.storage.local.get(["targetLang"]);
  if (stored.targetLang) select.value = stored.targetLang;
}

async function doTranslate(incremental=false) {
  const target = $("lang").value;
  await chrome.storage.local.set({ targetLang: target });
  // Execute content script in active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }, () => {
    // then run a small call to the page to start translation with params
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t, inc) => {
        // content script defines a global `runPSMTranslator`
        if (typeof runPSMTranslator === "function") {
          runPSMTranslator(t, !!inc);
        } else {
          console.warn("Translator content script not found.");
        }
      },
      args: [target, incremental]
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await populate();
  $("translateBtn").addEventListener("click", () => doTranslate(false));
  $("refreshBtn").addEventListener("click", () => doTranslate(true));
});