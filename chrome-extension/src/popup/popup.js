document.addEventListener('DOMContentLoaded', async () => {
  const jobPreview = document.getElementById('job-preview');
  const tailorBtn = document.getElementById('tailor-btn');
  const statusDiv = document.getElementById('status');
  const progressSpan = document.getElementById('progress');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject content script if needed (though manifest handles it)
  // Request page text
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_text' });
    if (response && response.text) {
      jobPreview.textContent = response.text.substring(0, 300) + '...';
    } else {
      jobPreview.textContent = 'Could not extract text. Please ensure you are on a job page.';
      tailorBtn.disabled = true;
    }
  } catch (error) {
    console.error(error);
    jobPreview.textContent = 'Error connecting to page. Refresh and try again.';
    tailorBtn.disabled = true;
  }

  tailorBtn.addEventListener('click', async () => {
    statusDiv.classList.remove('hidden');
    tailorBtn.disabled = true;
    
    // Trigger AI in offscreen via background
    chrome.runtime.sendMessage({ 
      action: 'start_tailoring',
      jobText: jobPreview.textContent // In reality, send full text
    });
  });

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'ai_progress') {
      progressSpan.textContent = `${Math.round(message.progress * 100)}%`;
      if (message.text) {
        statusDiv.innerHTML = `${message.text} <span id="progress">${Math.round(message.progress * 100)}%</span>`;
      }
    } else if (message.action === 'ai_complete') {
        statusDiv.textContent = 'Done! (Placeholder)';
        tailorBtn.disabled = false;
    }
  });
});
