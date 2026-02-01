// ChatLog Debug - Run this in console to see what's happening

console.log('[ChatLog Debug] Starting diagnostic...');

// 1. Check if script is running
console.log('[ChatLog Debug] URL:', window.location.href);
console.log('[ChatLog Debug] Hostname:', window.location.hostname);

// 2. Try to find conversation list
const possibleSelectors = [
  '[data-testid="conversation-item"]',
  'nav a[href*="/chat/"]',
  'nav a[href*="/c/"]',
  'nav [role="link"]',
  'aside a',
  'nav button',
];

console.log('[ChatLog Debug] Looking for conversation list...');
possibleSelectors.forEach(selector => {
  const found = document.querySelectorAll(selector);
  if (found.length > 0) {
    console.log(`✓ Found ${found.length} elements with selector: ${selector}`);
    console.log('  Sample element:', found[0]);
  }
});

// 3. Try to find messages
const messageSelectors = [
  '[data-message-author-role]',
  '[data-testid="user-message"]',
  '[data-testid="assistant-message"]',
  '.group\\/conversation-turn',
  '[role="presentation"]',
];

console.log('[ChatLog Debug] Looking for messages...');
messageSelectors.forEach(selector => {
  const found = document.querySelectorAll(selector);
  if (found.length > 0) {
    console.log(`✓ Found ${found.length} elements with selector: ${selector}`);
    console.log('  Sample element:', found[0]);
  }
});

// 4. Try to find header
const headerSelectors = [
  'header',
  '[role="banner"]',
  'nav',
  '.sticky.top-0',
];

console.log('[ChatLog Debug] Looking for header...');
headerSelectors.forEach(selector => {
  const found = document.querySelector(selector);
  if (found) {
    console.log(`✓ Found header with selector: ${selector}`);
    console.log('  Element:', found);
  }
});

console.log('[ChatLog Debug] Diagnostic complete. Check results above.');
