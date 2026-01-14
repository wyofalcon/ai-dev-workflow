chrome.runtime.onMessage.addListener((e,r,t)=>{if(e.action==="extract_text"){const n=document.body.innerText.replace(/\s+/g," ").trim();t({text:n})}return!0});
