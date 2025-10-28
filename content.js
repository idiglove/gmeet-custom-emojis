// Content script for Google Meet custom emojis
let customEmojis = [];
let emojiPicker = null;
let reactionOverlay = null;

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
    // Create or update the emoji picker
    if (customEmojis.length > 0) {
      createCustomEmojiPicker();
    } else {
      removeCustomEmojiPicker();
    }
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.customEmojis) {
    customEmojis = changes.customEmojis.newValue || [];
    console.log('🔄 Custom emojis updated:', customEmojis.length);
    if (customEmojis.length > 0) {
      createCustomEmojiPicker();
    } else {
      removeCustomEmojiPicker();
    }
  }
});

// Initialize
loadCustomEmojis();
createReactionOverlay();

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

  // Find the toolbar with aria-label="Send a reaction"
  const toolbar = document.querySelector('div[role="toolbar"][aria-label*="reaction"]');

  if (!toolbar) {
    console.log('❌ Reactions toolbar not found yet');
    return;
  }

  // Check if we already injected into this specific toolbar instance
  const existingCustom = toolbar.querySelectorAll('.custom-emoji-container');
  if (existingCustom.length > 0) {
    console.log('⏭️ Custom emojis already in this toolbar');
    return;
  }

  console.log('✅ Found reactions toolbar');

  // Find an existing emoji container to use as a reference
  const referenceEmojiContainer = toolbar.querySelector('div[jsname="nePGOb"]');

  if (!referenceEmojiContainer) {
    console.log('❌ Could not find reference emoji container');
    return;
  }

  console.log('✅ Found reference emoji container');

  // Inject each custom emoji
  customEmojis.forEach((emoji) => {
    console.log('➕ Injecting custom emoji:', emoji);

    const emojiValue = emoji.isImage ? emoji.shortcode : emoji.emoji;

    // Create the complete structure matching Google Meet's DOM
    // <div jsname="nePGOb">
    const outerContainer = document.createElement('div');
    outerContainer.setAttribute('jsname', 'nePGOb');
    outerContainer.classList.add('custom-emoji-container');

    // <div class="nnCtR" role="none">
    const middleContainer = document.createElement('div');
    middleContainer.className = 'nnCtR';
    middleContainer.setAttribute('role', 'none');

    // <div jsname="qB4Txe" role="none" data-emoji="...">
    const dataEmojiDiv = document.createElement('div');
    dataEmojiDiv.setAttribute('jsname', 'qB4Txe');
    dataEmojiDiv.setAttribute('role', 'none');
    dataEmojiDiv.setAttribute('data-emoji', emojiValue);
    dataEmojiDiv.setAttribute('jscontroller', 'I3Y0R');
    dataEmojiDiv.setAttribute('jsaction', 'JIbuQc:aj0Jcf; contextmenu:xexox; keydown:uYT2Vb; mouseover:UI3Kjd; mouseout:EZ53sd;AHmuwe:h06R8;O22p3e:zjh6rb;touchstart:npT2md');

    // <span data-is-tooltip-wrapper="true">
    const tooltipWrapper = document.createElement('span');
    tooltipWrapper.setAttribute('data-is-tooltip-wrapper', 'true');

    // <button class="VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ sg22sf">
    const button = document.createElement('button');
    button.className = 'VfPpkd-Bz112c-LgbsSe yHy1rc eT1oJ sg22sf';
    button.setAttribute('aria-label', emojiValue);
    button.setAttribute('data-emoji', emojiValue);
    button.setAttribute('tabindex', '-1');
    button.setAttribute('role', 'button');

    // Add Google Meet's controller and actions to integrate with their system
    button.setAttribute('jscontroller', 'soHxf');
    button.setAttribute('jsaction', 'click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef;mlnRJb:fLiPzd');
    button.setAttribute('jsname', 'vnVdbf');
    button.setAttribute('data-idom-class', 'yHy1rc eT1oJ sg22sf');

    // Add ripple effect divs (Material Design)
    const rippleDiv1 = document.createElement('div');
    rippleDiv1.className = 'VfPpkd-Bz112c-Jh9lGc';
    const rippleDiv2 = document.createElement('div');
    rippleDiv2.className = 'VfPpkd-Bz112c-J1Ukfc-LhBDec';

    // <img class="iiJ4W">
    const img = document.createElement('img');
    img.className = 'iiJ4W';
    img.setAttribute('draggable', 'false');
    img.setAttribute('data-emoji', emojiValue);

    if (emoji.isImage) {
      // For custom images, use the uploaded image
      img.src = emoji.emoji;
      img.alt = emoji.shortcode;
      img.setAttribute('aria-label', emoji.shortcode);
    } else {
      // For emoji characters, try to use Google's emoji CDN
      const codePoint = emoji.emoji.codePointAt(0).toString(16);
      img.src = `https://fonts.gstatic.com/s/e/notoemoji/16.0/${codePoint}/512.png=s48`;
      img.alt = emoji.emoji;
      img.setAttribute('aria-label', emoji.emoji);
    }

    // Add click handler - DON'T prevent default or stop propagation
    // Let Google's handlers run too
    button.addEventListener('click', () => {
      console.log('🖱️ Custom emoji clicked:', emoji);

      // Trigger our custom animation
      triggerCustomReaction(emoji);

      // Try to trigger Google Meet's internal reaction system
      // by dispatching a custom event that mimics their system
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });

      // Also try to find and trigger any Google Meet reaction handlers
      button.dispatchEvent(clickEvent);
    }, false);

    // Assemble the structure
    button.appendChild(rippleDiv1);
    button.appendChild(rippleDiv2);
    button.appendChild(img);
    tooltipWrapper.appendChild(button);
    dataEmojiDiv.appendChild(tooltipWrapper);
    middleContainer.appendChild(dataEmojiDiv);
    outerContainer.appendChild(middleContainer);

    // Insert the custom emoji container into the toolbar
    toolbar.appendChild(outerContainer);
    console.log('✅ Custom emoji injected into reactions bar');

    // Debug: Log the element details
    console.log('📍 Injected element:', outerContainer);
    console.log('📍 Parent toolbar:', toolbar);
    console.log('📍 Computed style:', window.getComputedStyle(outerContainer).display);
  });

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
