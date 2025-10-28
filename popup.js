// Get DOM elements
const emojiInput = document.getElementById('emoji-input');
const shortcodeInput = document.getElementById('shortcode-input');
const addEmojiBtn = document.getElementById('add-emoji-btn');
const emojiFile = document.getElementById('emoji-file');
const emojiGrid = document.getElementById('emoji-grid');

// Load and display emojis on popup open
loadEmojis();

// Add emoji button click handler
addEmojiBtn.addEventListener('click', () => {
  const emoji = emojiInput.value.trim();
  const shortcode = shortcodeInput.value.trim();

  if (!shortcode) {
    alert('Please enter a shortcode (e.g., :party:)');
    return;
  }

  if (!emoji) {
    alert('Please paste an emoji character or upload an image');
    return;
  }

  // Check if it's likely an emoji (contains Unicode emoji characters)
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const hasEmoji = emojiRegex.test(emoji);

  if (!hasEmoji && emoji.length > 3) {
    const confirm = window.confirm(
      `"${emoji}" doesn't look like an emoji. Did you paste an actual emoji character?\n\nTip: Press Windows+. or Ctrl+Cmd+Space to open emoji picker\n\nContinue anyway?`
    );
    if (!confirm) return;
  }

  addEmoji(emoji, shortcode, false);
  emojiInput.value = '';
  shortcodeInput.value = '';
});

// File upload handler
emojiFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const shortcode = shortcodeInput.value.trim();
  if (!shortcode) {
    alert('Please enter a shortcode first');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    addEmoji(event.target.result, shortcode, true);
    shortcodeInput.value = '';
    emojiFile.value = '';
  };
  reader.readAsDataURL(file);
});

// Add emoji to storage
function addEmoji(emoji, shortcode, isImage) {
  chrome.storage.sync.get(['customEmojis'], (result) => {
    const emojis = result.customEmojis || [];

    // Check if shortcode already exists
    if (emojis.some(e => e.shortcode === shortcode)) {
      alert('This shortcode already exists!');
      return;
    }

    emojis.push({
      emoji,
      shortcode,
      isImage,
      id: Date.now()
    });

    chrome.storage.sync.set({ customEmojis: emojis }, () => {
      loadEmojis();
    });
  });
}

// Load emojis from storage and display
function loadEmojis() {
  chrome.storage.sync.get(['customEmojis'], (result) => {
    const emojis = result.customEmojis || [];
    emojiGrid.innerHTML = '';

    emojis.forEach(emoji => {
      const emojiItem = document.createElement('div');
      emojiItem.className = 'emoji-item';

      if (emoji.isImage) {
        const img = document.createElement('img');
        img.src = emoji.emoji;
        img.className = 'emoji-image';
        emojiItem.appendChild(img);
      } else {
        const display = document.createElement('div');
        display.className = 'emoji-display';
        display.textContent = emoji.emoji;
        emojiItem.appendChild(display);
      }

      const shortcode = document.createElement('div');
      shortcode.className = 'emoji-shortcode';
      shortcode.textContent = emoji.shortcode;
      emojiItem.appendChild(shortcode);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteEmoji(emoji.id);
      };
      emojiItem.appendChild(deleteBtn);

      // Copy emoji on click
      emojiItem.addEventListener('click', () => {
        if (emoji.isImage) {
          // For images, we'll just show a message
          showToast('Image emoji added! Use it in Google Meet.');
        } else {
          navigator.clipboard.writeText(emoji.emoji);
          showToast('Emoji copied to clipboard!');
        }
      });

      emojiGrid.appendChild(emojiItem);
    });
  });
}

// Delete emoji
function deleteEmoji(id) {
  chrome.storage.sync.get(['customEmojis'], (result) => {
    const emojis = result.customEmojis || [];
    const filtered = emojis.filter(e => e.id !== id);

    chrome.storage.sync.set({ customEmojis: filtered }, () => {
      loadEmojis();
    });
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #323232;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}
