
import React, { useEffect, useState } from 'react';

/**
 * DebugInspector
 * A development-only tool to identify React components by clicking on them.
 * Shows a tooltip with the element tag and class.
 * Note: Getting the exact "File Path" automatically in prod build is hard without babel plugins,
 * but this will give us the HTML structure and classes which usually maps 1:1 to components.
 */
const DebugInspector = () => {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      if (e.ctrlKey) { // Only activate when holding CTRL
        e.stopPropagation();
        e.target.style.outline = '2px solid red';
        e.target.style.cursor = 'crosshair';
        setTarget({
          tagName: e.target.tagName.toLowerCase(),
          className: e.target.className,
          text: e.target.innerText?.substring(0, 30),
          id: e.target.id
        });
      }
    };

    const handleMouseOut = (e) => {
      e.target.style.outline = '';
      e.target.style.cursor = '';
      if (!e.ctrlKey) setTarget(null);
    };

    const handleClick = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔍 INSPECTED ELEMENT:', {
            tag: e.target.tagName,
            classes: e.target.className,
            id: e.target.id,
            text: e.target.innerText,
            html: e.target.outerHTML
        });
        alert(`Component ID Info:\nTag: <${e.target.tagName.toLowerCase()}>\nID: ${e.target.id || '(none)'}\nClass: ${typeof e.target.className === 'string' ? e.target.className.split(' ')[0] : '...'}\n\n(Details logged to console)`);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true); // Capture phase

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  if (!target) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '8px',
      borderRadius: '4px',
      zIndex: 99999,
      pointerEvents: 'none',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      &lt;{target.tagName}&gt; {target.id ? `#${target.id}` : ''} {target.className && typeof target.className === 'string' ? `.${target.className.split(' ').slice(0,2).join('.')}` : ''}
    </div>
  );
};

export default DebugInspector;
