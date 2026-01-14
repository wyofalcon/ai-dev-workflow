import { getAuthToken } from './auth.js';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'start_tailoring') {
    
    // Get Auth Token & API URL
    const authData = await getAuthToken();
    
    if (!authData || !authData.token) {
        console.warn("No auth token found. User might not be logged in to CVstomize.");
        chrome.runtime.sendMessage({ 
            action: 'ai_error', 
            error: "Please log in to CVstomize in another tab first."
        });
        return;
    }

    const { token, apiUrl } = authData;

    try {
        // 1. Report progress
        chrome.runtime.sendMessage({ 
            action: 'ai_progress', 
            progress: 0.2, 
            text: 'Analyzing Job Description with Vertex AI...' 
        });

        // 2. Call Backend API
        const response = await fetch(`${apiUrl}/ai/extension/tailor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobDescription: message.jobText
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();

        // 3. Send Results
        chrome.runtime.sendMessage({ 
            action: 'ai_complete', 
            result: data.result 
        });

    } catch (error) {
        console.error("AI API Error:", error);
        chrome.runtime.sendMessage({ 
            action: 'ai_error', // Changed from ai_progress with error text to distinct error action
            error: error.message 
        });
        // Also send progress reset just in case
        chrome.runtime.sendMessage({ 
            action: 'ai_progress', 
            progress: 0, 
            text: `Error: ${error.message}` 
        });
    }
  }
});
