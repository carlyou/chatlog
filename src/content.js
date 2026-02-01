// ChatLog - Content Script
// Enhanced navigation and organization for AI chat conversations

(function() {
  'use strict';

  // Detect platform
  const isClaude = window.location.hostname.includes('claude.ai');
  const isChatGPT = window.location.hostname.includes('chatgpt.com');

  if (!isClaude && !isChatGPT) {
    console.log('[ChatLog] Not on supported platform');
    return;
  }

  console.log('[ChatLog] Initializing on', isClaude ? 'Claude.ai' : 'ChatGPT');

  // State
  let rightPinned = false;
  let initialized = false;
  let currentUrl = window.location.href;

  // Wait for page to be ready
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout waiting for ' + selector));
      }, timeout);
    });
  }

  // Platform-specific selectors
  const selectors = isClaude ? {
    // Claude.ai selectors (updated for current version)
    sidebar: 'nav[aria-label="Chat history"]',
    conversationItem: 'a[href^="/chat/"]',
    conversationTitle: 'div',
    messageContainer: '#main-content',
    messages: '[data-is-streaming], [data-test-render-count]',
    userMessage: '[data-is-streaming="false"]',
  } : {
    // ChatGPT selectors
    sidebar: 'nav',
    conversationItem: 'a[href*="/c/"]',
    conversationTitle: 'div',
    messageContainer: 'main',
    messages: '[data-message-author-role]',
  };



  // Parse messages - Claude.ai specific
  function parseClaudeMessages(container) {
    const messages = [];

    // Find all message groups (both user messages and assistant responses)
    const allGroups = container.querySelectorAll('div.group.relative');
    // console.log('[ChatLog] Found', allGroups.length, 'message groups');

    allGroups.forEach((group, idx) => {
      const text = group.textContent?.trim();
      if (!text) {
        // console.log(`[ChatLog] Skipping group ${idx}: no text`);
        return;
      }

      // Determine message type by class
      const isUserMessage = group.className.includes('bg-bg-300'); // User messages have rounded gray background
      const hasStreaming = group.hasAttribute('data-is-streaming'); // Assistant responses and thinking blocks have this

      if (isUserMessage) {
        // It's a user message - no length check, even "hi" is valid
        // console.log(`[ChatLog] Group ${idx}: USER message -`, text.substring(0, 50));
        messages.push({
          id: `msg-${messages.length}`,
          type: 'user',
          text: text,
          element: group
        });
      } else if (hasStreaming) {
        // This element contains assistant response (and possibly thinking summary)
        // Need to extract just the assistant response content
        // Use row-start-2 which contains ONLY the response, not the thinking summary
        const responseContainer = group.querySelector('[class*="row-start-2"]');

        if (responseContainer) {
          const responseText = responseContainer.textContent?.trim();
          if (responseText) {
            // console.log(`[ChatLog] Group ${idx}: ASSISTANT response -`, responseText.substring(0, 50));
            messages.push({
              id: `msg-${messages.length}`,
              type: 'assistant',
              text: responseText,
              element: responseContainer
            });
          } else {
            // console.log(`[ChatLog] Group ${idx}: Response empty`);
          }
        } else {
          // console.log(`[ChatLog] Group ${idx}: No response container found`);
        }
      } else {
        // console.log(`[ChatLog] Group ${idx}: Unknown type - not user, not streaming`);
      }
    });

    // console.log('[ChatLog] Final parsed messages:', messages.length);
    return messages;
  }

  // Parse messages - ChatGPT specific
  function parseChatGPTMessages(container) {
    const messages = [];

    // Find all message elements with role attributes
    const allMessages = container.querySelectorAll('[data-message-author-role]');
    // console.log('[ChatLog] Found', allMessages.length, 'ChatGPT messages');

    allMessages.forEach((msg, idx) => {
      const role = msg.getAttribute('data-message-author-role');
      const text = msg.textContent?.trim();

      if (!text) {
        // console.log(`[ChatLog] Skipping message ${idx}: no text`);
        return;
      }

      if (role === 'user') {
        // console.log(`[ChatLog] Message ${idx}: USER -`, text.substring(0, 50));
        messages.push({
          id: `msg-${messages.length}`,
          type: 'user',
          text: text,
          element: msg
        });
      } else if (role === 'assistant') {
        // console.log(`[ChatLog] Message ${idx}: ASSISTANT -`, text.substring(0, 50));
        messages.push({
          id: `msg-${messages.length}`,
          type: 'assistant',
          text: text,
          element: msg
        });
      }
    });

    // console.log('[ChatLog] Final parsed ChatGPT messages:', messages.length);
    return messages;
  }

  // Parse messages - Main entry point
  function parseMessages() {
    const container = document.querySelector(selectors.messageContainer);

    if (!container) {
      // console.log('[ChatLog] Message container not found');
      return [];
    }

    // Delegate to platform-specific parser
    if (isClaude) {
      return parseClaudeMessages(container);
    } else if (isChatGPT) {
      return parseChatGPTMessages(container);
    }

    // console.log('[ChatLog] Unknown platform');
    return [];
  }


  // Create right sidebar HTML
  function createRightSidebar(messages) {
    const items = messages.map((msg, idx) => `
      <button class="chatlog-message" data-index="${idx}">
        <div class="chatlog-message-${msg.type}">
          <div class="chatlog-bubble chatlog-bubble-${msg.type}">
            ${escapeHtml(msg.text.substring(0, 200))}${msg.text.length > 200 ? '...' : ''}
          </div>
        </div>
      </button>
    `).join('');

    return `
      <div class="chatlog-sidebar chatlog-sidebar-right" id="chatlog-right">
        <div class="chatlog-outline-header">
          <span>ChatLog</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="chatlog-outline-count">${messages.length}</span>
            <button class="chatlog-pin-btn" id="chatlog-pin-right" title="Pin sidebar">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v8M8 6v4l-2 2v2h5v6h2v-6h5v-2l-2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="chatlog-outline-messages">
          ${items || '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No messages yet</div>'}
        </div>
      </div>
    `;
  }

  // Create hover zone
  function createHoverZone() {
    return `
      <div class="chatlog-hover-zone chatlog-hover-right" id="chatlog-hover-right"></div>
    `;
  }

  // Create toggle button
  function createToggle() {
    const div = document.createElement('div');
    div.id = 'chatlog-toggles';
    div.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999998; display: flex; gap: 8px;';
    div.innerHTML = `
      <button class="chatlog-toggle" id="chatlog-toggle-right" title="Toggle outline">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
        </svg>
      </button>
    `;
    return div;
  }

  // Helper: escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Toggle functions
  function setupToggles() {
    const rightToggle = document.getElementById('chatlog-toggle-right');
    const rightPin = document.getElementById('chatlog-pin-right');

    if (rightToggle) {
      rightToggle.addEventListener('click', () => {
        rightPinned = !rightPinned;
        const sidebar = document.getElementById('chatlog-right');
        const zone = document.getElementById('chatlog-hover-right');
        const pinBtn = document.getElementById('chatlog-pin-right');

        if (rightPinned) {
          sidebar?.classList.add('pinned');
          zone?.classList.add('hidden');
          rightToggle.classList.add('active');
          pinBtn?.classList.add('pinned');
          document.body.classList.add('chatlog-right-pinned');
        } else {
          sidebar?.classList.remove('pinned');
          zone?.classList.remove('hidden');
          rightToggle.classList.remove('active');
          pinBtn?.classList.remove('pinned');
          document.body.classList.remove('chatlog-right-pinned');
        }
      });
    }

    // Pin button in header
    if (rightPin) {
      rightPin.addEventListener('click', () => {
        rightPinned = !rightPinned;
        const sidebar = document.getElementById('chatlog-right');
        const zone = document.getElementById('chatlog-hover-right');

        if (rightPinned) {
          sidebar?.classList.add('pinned');
          zone?.classList.add('hidden');
          rightToggle?.classList.add('active');
          rightPin.classList.add('pinned');
          document.body.classList.add('chatlog-right-pinned');
        } else {
          sidebar?.classList.remove('pinned');
          zone?.classList.remove('hidden');
          rightToggle?.classList.remove('active');
          rightPin.classList.remove('pinned');
          document.body.classList.remove('chatlog-right-pinned');
        }
      });
    }
  }

  // Setup message clicks
  function setupMessageClicks(messages) {
    document.querySelectorAll('.chatlog-message').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const msg = messages[idx];
        if (msg && msg.element) {
          // Add scroll margin for breathing room
          msg.element.style.scrollMarginTop = '80px';
          msg.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // console.log('[ChatLog] Scrolled to message', idx);
        }
      });
    });
  }


  // Update outline only (when conversation changes)
  function updateOutline() {
    // console.log('[ChatLog] Updating outline for new conversation...');

    const messages = parseMessages();
    const rightSidebar = document.getElementById('chatlog-right');

    if (!rightSidebar) {
      // console.log('[ChatLog] Right sidebar not found');
      return;
    }

    // Update the outline content
    const outlineContainer = rightSidebar.querySelector('.chatlog-outline-messages');
    const outlineCount = rightSidebar.querySelector('.chatlog-outline-count');

    if (outlineContainer) {
      const items = messages.map((msg, idx) => `
        <button class="chatlog-message" data-index="${idx}">
          <div class="chatlog-message-${msg.type}">
            <div class="chatlog-bubble chatlog-bubble-${msg.type}">
              ${escapeHtml(msg.text.substring(0, 200))}${msg.text.length > 200 ? '...' : ''}
            </div>
          </div>
        </button>
      `).join('');

      outlineContainer.innerHTML = items || '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No messages yet</div>';

      if (outlineCount) {
        outlineCount.textContent = messages.length;
      }

      // Re-setup message click handlers
      setupMessageClicks(messages);

      // Re-setup the pin button click handler
      const rightPin = document.getElementById('chatlog-pin-right');
      if (rightPin) {
        // Remove old listener by cloning
        const newPin = rightPin.cloneNode(true);
        rightPin.parentNode.replaceChild(newPin, rightPin);

        // Add new listener
        const rightToggle = document.getElementById('chatlog-toggle-right');
        newPin.addEventListener('click', () => {
          rightPinned = !rightPinned;
          const sidebar = document.getElementById('chatlog-right');
          const zone = document.getElementById('chatlog-hover-right');

          if (rightPinned) {
            sidebar?.classList.add('pinned');
            zone?.classList.add('hidden');
            rightToggle?.classList.add('active');
            newPin.classList.add('pinned');
            document.body.classList.add('chatlog-right-pinned');
          } else {
            sidebar?.classList.remove('pinned');
            zone?.classList.remove('hidden');
            rightToggle?.classList.remove('active');
            newPin.classList.remove('pinned');
            document.body.classList.remove('chatlog-right-pinned');
          }
        });
      }

      // console.log('[ChatLog] Outline updated with', messages.length, 'messages');
    }
  }

  // Watch for URL changes
  function watchUrlChanges() {
    // Method 1: Listen to popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // console.log('[ChatLog] URL changed via popstate:', currentUrl);
        setTimeout(updateOutline, 1000); // Increased timeout for content to load
      }
    });

    // Method 2: Monitor pushState/replaceState (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // console.log('[ChatLog] URL changed via pushState:', currentUrl);
        setTimeout(updateOutline, 1000); // Increased timeout
      }
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // console.log('[ChatLog] URL changed via replaceState:', currentUrl);
        setTimeout(updateOutline, 1000); // Increased timeout
      }
    };

    // console.log('[ChatLog] URL change watchers initialized');
  }

  // Watch for new messages in current conversation
  function watchNewMessages() {
    const container = document.querySelector(selectors.messageContainer);
    if (!container) {
      // console.log('[ChatLog] Message container not found for watching');
      return;
    }

    let updateTimeout = null;

    const observer = new MutationObserver(() => {
      // Debounce updates - only update after changes stop for 500ms
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        // console.log('[ChatLog] New messages detected, updating outline...');
        updateOutline();
      }, 500);
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    // console.log('[ChatLog] New message watcher initialized');
  }

  // Main injection
  async function inject() {
    if (initialized) {
      // console.log('[ChatLog] Already initialized');
      return;
    }

    try {
      // Wait for conversations to exist
      // console.log('[ChatLog] Waiting for conversations...');
      await waitForElement(selectors.conversationItem, 5000);

      // console.log('[ChatLog] Conversations found, parsing data...');

      // Parse data
      const messages = parseMessages();

      // Remove old elements
      document.querySelectorAll('[id^="chatlog-"]').forEach(el => el.remove());

      // Create and inject
      const container = document.createElement('div');
      container.innerHTML = createHoverZone() +
                           createRightSidebar(messages);

      document.body.appendChild(container);
      document.body.appendChild(createToggle());

      // Setup interactions
      setupToggles();
      setupMessageClicks(messages);

      // Watch for URL changes to update outline
      watchUrlChanges();

      // Watch for new messages in current conversation
      watchNewMessages();

      initialized = true;
      // console.log('[ChatLog] ✓ Initialization complete!');
      // console.log('[ChatLog] - Hover near right edge to reveal outline');
      // console.log('[ChatLog] - Use toggle button (top right) or pin icon to pin');

    } catch (error) {
      // console.error('[ChatLog] Failed to initialize:', error);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(inject, 1000);
    });
  } else {
    setTimeout(inject, 1000);
  }

})();
