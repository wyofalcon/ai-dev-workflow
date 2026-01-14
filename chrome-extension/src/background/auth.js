// Auth utility to get token from main site cookies

const DOMAINS = [
  'http://localhost:3000',
  'https://cvstomize-frontend-351889420459.us-central1.run.app',
  'https://cvstomize.com'
];

export async function getAuthToken() {
  for (const domain of DOMAINS) {
    try {
      // Check for Firebase auth token in localStorage (requires content script injection usually)
      // OR check for cookies if HTTP-only cookies are used (safer).
      // Since Firebase stores tokens in IndexedDB/LocalStorage, cookies might not work directly 
      // unless we implemented session cookies.
      
      // ALTERNATIVE: Use externally_connectable in main app to send token to extension.
      // FOR NOW: Let's try to get a specific cookie if one existed, OR we can inject a script to read localStorage.
      
      // Let's assume we can read a specific cookie if we set one, but standard Firebase Auth is client-side.
      // So the reliable way is to inject a script into the CVstomize tab to read localStorage.
      
      // Check if we have an open tab for the app
      const tabs = await chrome.tabs.query({ url: `${domain}/*` });
      if (tabs.length > 0) {
        const tab = tabs[0];
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Read from localStorage (Firebase keys are long and dynamic, but usually start with firebase:authUser)
            // Or look for our custom 'cvstomize_dev_token'
            const devToken = localStorage.getItem('cvstomize_dev_token');
            if (devToken) return devToken;
            
            // Try to find Firebase user
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                if (key.startsWith('firebase:authUser')) {
                    const user = JSON.parse(localStorage.getItem(key));
                    return user.stsTokenManager.accessToken;
                }
            }
            return null;
          }
        });
        
        if (result && result[0] && result[0].result) {
            return result[0].result;
        }
      }
    } catch (e) {
      console.log(`Failed to get token from ${domain}`, e);
    }
  }
  return null;
}
