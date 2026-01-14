import { getAuthToken } from './auth.js';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'start_tailoring') {
    await setupOffscreenDocument('src/offscreen/offscreen.html');
    
    // Get Auth Token
    const token = await getAuthToken();
    if (!token) {
        console.warn("No auth token found. User might not be logged in to CVstomize.");
        // Proceed anyway, but maybe warn? Or let offscreen handle it?
    }

    // Forward to offscreen
    chrome.runtime.sendMessage({
      action: 'run_inference',
      data: message.jobText,
      token: token
    });
  }
});

async function setupOffscreenDocument(path) {
  // Check if offscreen document exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [path]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['WORKERS'], // 'WORKERS' is valid reason for WebLLM? checking docs... usually 'DOM_PARSING' or 'BLOBS'
      justification: 'Running WebLLM for local AI inference'
    });
    await creating;
    creating = null;
  }
}

let creating; // Promise keeper
