// Simple script to generate PNG icons from SVG
// Run: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a73e8';
  roundRect(ctx, 0, 0, size, size, size * 0.1875);
  ctx.fill();

  // Emoji
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('😊', size / 2, size / 2);

  // Plus circle
  const plusSize = size * 0.3125;
  const plusX = size * 0.78125;
  const plusY = size * 0.21875;

  ctx.fillStyle = '#34a853';
  ctx.beginPath();
  ctx.arc(plusX, plusY, plusSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `bold ${plusSize * 0.625}px Arial`;
  ctx.fillStyle = 'white';
  ctx.fillText('+', plusX, plusY);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/icon${size}.png`, buffer);
  console.log(`Generated icon${size}.png`);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Check if canvas module is available
try {
  generateIcon(16);
  generateIcon(48);
  generateIcon(128);
  console.log('\nIcons generated successfully!');
} catch (error) {
  console.error('\nError: canvas module not found.');
  console.log('Please install it with: npm install canvas');
  console.log('\nAlternatively, you can:');
  console.log('1. Use an online SVG to PNG converter with icons/icon.svg');
  console.log('2. Create simple colored squares as placeholders');
  console.log('3. Use any emoji image from the web\n');
}
