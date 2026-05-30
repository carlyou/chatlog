import React from 'react';
import ReactDOM from 'react-dom/client';
import type { Platform } from '../types';
import { App } from './App';
import contentCss from './content.css?inline';
import './lib/adapters/claude';
import './lib/adapters/chatgpt';
import './lib/adapters/claude-code';
import { detectPlatform, getAdapter } from './lib/adapters/registry';

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
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

async function init() {
  const platformId = detectPlatform() as Platform;
  if (!platformId) return;

  const adapter = getAdapter(platformId);
  if (!adapter) return;

  try {
    await waitForElement(adapter.selectors.conversationItem, 5000);
  } catch {
    // Conversation items not found, but continue anyway
  }

  // Inject host-page styles for pinned margin adjustment (outside Shadow DOM)
  if (!document.getElementById('chatlog-host-styles')) {
    const hostStyle = document.createElement('style');
    hostStyle.id = 'chatlog-host-styles';

    // Apply both margin-right (shrinks static-positioned containers) and an
    // explicit width cap (works on absolute containers pinned via inset:0
    // where margin-right is layout-inert). One of the two takes effect per
    // container; the other is harmless.
    const marginRules = adapter.pinnedMarginSelectors
      .map(
        (sel) =>
          `body.chatlog-right-pinned ${sel} { margin-right: var(--chatlog-sidebar-width, 320px); width: calc(100% - var(--chatlog-sidebar-width, 320px)); }`,
      )
      .join('\n      ');

    // Float the chat-input column over the transcript instead of pushing it
    // out of layout flow. This keeps the document height stable when fading,
    // so scrolling at the bottom doesn't jump as the input reveals/hides.
    const adapterStyles =
      adapter.id === 'claude-code'
        ? `
      .epitaxy-chat-column:has(.epitaxy-prompt) {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 5;
        transition: opacity 0.15s ease;
        opacity: var(--chatlog-input-opacity, 1);
      }
      .epitaxy-chat-column:has(.epitaxy-prompt):focus-within,
      .epitaxy-chat-column:has(.epitaxy-prompt):hover {
        opacity: 1 !important;
      }
    `
        : '';

    hostStyle.textContent = `
      ${marginRules}
      ${adapterStyles}
      div[data-chat-input-container="true"] {
        transition: opacity 0.3s ease;
        opacity: var(--chatlog-input-opacity, 1);
      }
      div[data-chat-input-container="true"]:focus-within {
        opacity: 1 !important;
      }
      div[data-chat-input-container="true"] > fieldset {
        border-radius: 1.25rem !important;
        background: transparent !important;
      }
      div[data-chat-input-container="true"] > fieldset > div {
        background: transparent !important;
      }
      button.group\\/status {
        background: transparent !important;
      }
    `;
    document.head.appendChild(hostStyle);
  }

  // Fade chat input based on mouse Y position
  document.addEventListener(
    'mousemove',
    (e) => {
      const threshold = 3 / 4;
      const opacity = e.clientY <= window.innerHeight * threshold ? 0 : 1;
      document.documentElement.style.setProperty(
        '--chatlog-input-opacity',
        String(opacity),
      );
    },
    { passive: true },
  );

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
      <App platform={platformId} shadowHost={host} />
    </React.StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
} else {
  setTimeout(init, 1000);
}
