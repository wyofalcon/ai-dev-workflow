document.addEventListener('DOMContentLoaded', async () => {
  const jobPreview = document.getElementById('job-preview');
  const tailorBtn = document.getElementById('tailor-btn');
  const statusDiv = document.getElementById('status');
  const progressSpan = document.getElementById('progress');
  
  let fullJobText = '';

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject content script if needed (though manifest handles it)
  // Request page text
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_text' });
    if (response && response.text) {
      fullJobText = response.text;
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
    if (!fullJobText) return;
    
    statusDiv.classList.remove('hidden');
    tailorBtn.disabled = true;
    
    // Trigger AI via background
    chrome.runtime.sendMessage({ 
      action: 'start_tailoring',
      jobText: fullJobText
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
        statusDiv.classList.add('hidden');
        tailorBtn.disabled = false;
        
        const resultContainer = document.getElementById('result-container');
        const resultText = document.getElementById('result-text');
        
        resultText.textContent = message.result;
        resultContainer.classList.remove('hidden');
    } else if (message.action === 'ai_error') {
        statusDiv.innerHTML = `<span style="color: red;">Error: ${message.error}</span>`;
        tailorBtn.disabled = false;
    }
  });
});
