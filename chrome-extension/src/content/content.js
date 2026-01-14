chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract_text') {
    // Simple extraction strategy: get main article or body
    // In future: Use Readability.js or specific selectors for LinkedIn/Indeed
    const mainText = document.body.innerText; 
    // Basic cleanup
    const cleanText = mainText.replace(/\s+/g, ' ').trim();
    sendResponse({ text: cleanText });
  }
  return true;
});
