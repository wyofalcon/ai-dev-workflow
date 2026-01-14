// Auth utility to get token from main site cookies

const DOMAINS = [
  { url: 'http://localhost:3000', apiUrl: 'http://localhost:3001/api' },
  { url: 'https://cvstomize-frontend-351889420459.us-central1.run.app', apiUrl: 'https://cvstomize-api-351889420459.us-central1.run.app/api' },
  { url: 'https://cvstomize.com', apiUrl: 'https://cvstomize-api-351889420459.us-central1.run.app/api' }
];

export async function getAuthToken() {
  for (const domain of DOMAINS) {
    try {
      // Check if we have an open tab for the app
      const tabs = await chrome.tabs.query({ url: `${domain.url}/*` });
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
            return {
                token: result[0].result,
                apiUrl: domain.apiUrl
            };
        }
      }
    } catch (e) {
      console.log(`Failed to get token from ${domain.url}`, e);
    }
  }
  return null;
}
