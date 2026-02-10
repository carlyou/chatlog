import React from 'react';
import ReactDOM from 'react-dom/client';
import { detectPlatform } from './lib/platform';
import { getSelectors } from './lib/selectors';
import { App } from './App';
import contentCss from './content.css?inline';

function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for ' + selector));
    }, timeout);
  });
}

async function init() {
  const platform = detectPlatform();
  if (!platform) return;

  const selectors = getSelectors(platform);
  if (!selectors) return;

  try {
    await waitForElement(selectors.conversationItem, 5000);
  } catch {
    // Conversation items not found, but continue anyway
  }

  // Inject host-page styles for pinned margin adjustment (outside Shadow DOM)
  if (!document.getElementById('chatlog-host-styles')) {
    const hostStyle = document.createElement('style');
    hostStyle.id = 'chatlog-host-styles';
    hostStyle.textContent = `
      body.chatlog-right-pinned #main-content { margin-right: var(--chatlog-sidebar-width, 320px); }
      body.chatlog-right-pinned main { margin-right: var(--chatlog-sidebar-width, 320px); }
      div[data-chat-input-container="true"] {
        transition: opacity 0.3s ease;
        opacity: var(--chatlog-input-opacity, 1);
      }
      div[data-chat-input-container="true"]:focus-within {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(hostStyle);
  }

  // Fade chat input based on mouse Y position
  document.addEventListener('mousemove', (e) => {
    const threshold = 3 / 4;
    const opacity = e.clientY <= window.innerHeight * threshold ? 0 :  1;
    document.documentElement.style.setProperty('--chatlog-input-opacity', String(opacity));
  }, { passive: true });

  // Remove any previous mount
  document.getElementById('chatlog-root')?.remove();

  // Create host element
  const host = document.createElement('div');
  host.id = 'chatlog-root';
  document.body.appendChild(host);

  // Attach Shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles into Shadow DOM
  const style = document.createElement('style');
  style.textContent = contentCss;
  shadow.appendChild(style);

  // Create mount point inside shadow
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // Render React app
  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <App platform={platform} />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
  setTimeout(init, 1000);
}
