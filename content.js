// Content script for Google Meet custom emojis
let customEmojis = [];

// Toolbar tracking for injection
let lastInjectedToolbar = null;
let toolbarObserver = null;

// WebSocket relay server connection
let ws = null;
let meetingId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RELAY_SERVER_URL = 'ws://localhost:8080';

console.log('🎨 Custom Emojis extension loaded!');

// Load custom emojis from storage
function loadCustomEmojis() {
  chrome.storage.sync.get(['customEmojis'], (result) => {
    customEmojis = result.customEmojis || [];
    console.log('✅ Loaded custom emojis:', customEmojis.length);
    // The MutationObserver will automatically inject emojis when they're available
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.customEmojis) {
    customEmojis = changes.customEmojis.newValue || [];
    console.log('🔄 Custom emojis updated:', customEmojis.length);
    // The MutationObserver will automatically inject emojis when they're available
  }
});

// Initialize
loadCustomEmojis();

// Extract meeting ID from URL and connect to relay server
function initializeRelay() {
  // Extract meeting ID from Google Meet URL
  // URL format: https://meet.google.com/xxx-yyyy-zzz
  const urlMatch = window.location.href.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);

  if (urlMatch && urlMatch[1]) {
    meetingId = urlMatch[1];
    console.log('📍 Meeting ID:', meetingId);
    connectToRelay();
  } else {
    console.log('⚠️ Could not extract meeting ID from URL');
  }
}

// Connect to WebSocket relay server
function connectToRelay() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('⏭️ Already connected or connecting to relay');
    return;
  }

  console.log('🔌 Connecting to relay server:', RELAY_SERVER_URL);

  try {
    ws = new WebSocket(RELAY_SERVER_URL);

    ws.onopen = () => {
      console.log('✅ Connected to relay server');
      reconnectAttempts = 0;

      // Join the meeting room
      ws.send(JSON.stringify({
        type: 'join',
        meetingId: meetingId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received from relay:', data);

        switch (data.type) {
          case 'connected':
            console.log('🎉 Relay connection established:', data.clientId);
            break;

          case 'joined':
            console.log(`✅ Joined meeting room: ${data.meetingId} (${data.participantCount} participants)`);
            break;

          case 'reaction':
            console.log('🎭 Received reaction from another participant:', data.emoji);
            showLocalReaction(data.emoji);
            break;

          case 'participant-joined':
            console.log(`👋 Participant joined (${data.participantCount} total)`);
            break;

          case 'participant-left':
            console.log(`👋 Participant left (${data.participantCount} remaining)`);
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing relay message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from relay server');

      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(connectToRelay, delay);
      } else {
        console.log('❌ Max reconnection attempts reached. Please refresh the page.');
      }
    };
  } catch (error) {
    console.error('❌ Failed to create WebSocket connection:', error);
  }
}

// Send reaction to relay server
function broadcastReaction(emoji) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('📤 Broadcasting reaction to relay:', emoji);
    ws.send(JSON.stringify({
      type: 'reaction',
      emoji: emoji
    }));
    return true;
  } else {
    console.log('⚠️ WebSocket not connected, cannot broadcast reaction');
    return false;
  }
}

// Initialize relay connection
setTimeout(initializeRelay, 2000);

// Find and inject custom emojis into Google Meet's reactions bar
function injectCustomEmojisIntoReactionsBar() {
  if (customEmojis.length === 0) {
    console.log('⏭️ No custom emojis to inject');
    return;
  }

  console.log('🔍 Looking for reactions bar...');

  // Find the toolbar by looking for the thumbs down emoji and going up to its parent toolbar
  const thumbsDownEmoji = document.querySelector('[data-emoji="👎"]');

  if (!thumbsDownEmoji) {
    console.log('❌ Thumbs down emoji not found yet');
    return;
  }

  // Go two parents up from the emoji element to get the toolbar
  const toolbar = thumbsDownEmoji.parentElement?.parentElement;

  if (!toolbar) {
    console.log('❌ Could not find toolbar (parent structure unexpected)');
    return;
  }

  console.log('✅ Found reactions toolbar via thumbs down emoji');

  // Check if we already injected into this specific toolbar instance
  const existingCustom = toolbar.querySelectorAll('.custom-emoji-container');
  if (existingCustom.length > 0) {
    console.log('⏭️ Custom emojis already in this toolbar');
    return;
  }

  // Inject each custom emoji
  console.log('🔄 Total custom emojis to inject:', customEmojis.length, customEmojis);
  customEmojis.forEach((emoji, index) => {
    console.log(`➕ Injecting custom emoji ${index + 1}/${customEmojis.length}:`, emoji);

    const emojiValue = emoji.isImage ? emoji.shortcode : emoji.emoji;

    // Create a simple button structure - we don't need to mimic Google's complex DOM
    const container = document.createElement('div');
    container.classList.add('custom-emoji-container');
    container.style.cssText = `
      display: inline-block;
      margin: 0 4px;
    `;

    const button = document.createElement('button');
    button.classList.add('custom-emoji-button');
    button.setAttribute('aria-label', emojiValue);
    button.setAttribute('data-emoji', emojiValue);
    button.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });

    // Create the emoji image
    const img = document.createElement('img');
    img.setAttribute('draggable', 'false');
    img.style.cssText = `
      width: 32px;
      height: 32px;
      object-fit: contain;
    `;

    if (emoji.isImage) {
      // For custom images, use the uploaded image
      img.src = emoji.emoji;
      img.alt = emoji.shortcode;
    } else {
      // For emoji characters, try to use Google's emoji CDN
      const codePoint = emoji.emoji.codePointAt(0).toString(16);
      img.src = `https://fonts.gstatic.com/s/e/notoemoji/16.0/${codePoint}/512.png`;
      img.alt = emoji.emoji;
    }

    // Add click handler
    button.addEventListener('click', () => {
      console.log('🖱️ Custom emoji clicked:', emoji);
      triggerCustomReaction(emoji);
    });

    // Assemble the structure
    button.appendChild(img);
    container.appendChild(button);

    // Insert the custom emoji container into the toolbar
    toolbar.appendChild(container);
    console.log(`✅ Custom emoji ${index + 1}/${customEmojis.length} injected into reactions bar`);
    console.log('📍 Container element:', container);
  });

  console.log('🎉 Finished injecting all custom emojis. Total in toolbar:', toolbar.querySelectorAll('.custom-emoji-container').length);

  // Watch this toolbar for changes and re-inject if needed
  if (lastInjectedToolbar !== toolbar) {
    lastInjectedToolbar = toolbar;

    // Disconnect previous observer if exists
    if (toolbarObserver) {
      toolbarObserver.disconnect();
    }

    // Create a new observer to watch for toolbar changes
    toolbarObserver = new MutationObserver(() => {
      console.log('🔄 Toolbar changed, checking if re-injection needed...');
      const stillHasCustom = toolbar.querySelectorAll('.custom-emoji-container').length > 0;
      if (!stillHasCustom && customEmojis.length > 0) {
        console.log('⚠️ Custom emojis removed, re-injecting...');
        setTimeout(injectCustomEmojisIntoReactionsBar, 100);
      }
    });

    toolbarObserver.observe(toolbar, {
      childList: true,
      subtree: false
    });
  }

  console.log('🎉 All custom emojis injected!');
}

// Trigger a custom reaction that appears on screen
function triggerCustomReaction(emoji) {
  console.log('🎭 Triggering custom reaction:', emoji);

  // Broadcast to other participants via relay server
  broadcastReaction(emoji);

  // Show local animation
  showLocalReaction(emoji);
}

// Show the reaction animation locally
function showLocalReaction(emoji) {
  // Find the video container where reactions appear
  const videoContainer = document.querySelector('[data-self-participant-id]') ||
                         document.querySelector('[data-participant-id]') ||
                         document.querySelector('.R19f7e') ||
                         document.body;

  // Create the reaction element
  const reactionElement = document.createElement('div');
  reactionElement.className = 'custom-reaction-animation';
  reactionElement.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 20%;
    transform: translateX(-50%);
    font-size: 80px;
    z-index: 999999;
    pointer-events: none;
    animation: reactionFloat 3s ease-out forwards;
  `;

  if (emoji.isImage) {
    const img = document.createElement('img');
    img.src = emoji.emoji;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'contain';
    reactionElement.appendChild(img);
  } else {
    reactionElement.textContent = emoji.emoji;
  }

  videoContainer.appendChild(reactionElement);

  // Remove after animation completes
  setTimeout(() => {
    reactionElement.remove();
  }, 3000);

  console.log('✅ Custom reaction displayed locally');
}

// Observe DOM changes to detect when reactions bar appears
const observer = new MutationObserver(() => {
  if (customEmojis.length > 0) {
    injectCustomEmojisIntoReactionsBar();
  }
});

// Wait for body to be available
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// Try to inject multiple times as Meet loads slowly
console.log('⏰ Scheduling injection attempts...');
setTimeout(() => injectCustomEmojisIntoReactionsBar(), 2000);
setTimeout(() => injectCustomEmojisIntoReactionsBar(), 5000);
setTimeout(() => injectCustomEmojisIntoReactionsBar(), 10000);
