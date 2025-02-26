'use strict';

const dotSizeSlider = document.getElementById('dotSize');
const dotSizeValueDisplay = document.getElementById('dotSizeValue');
const nextImageButton = document.getElementById('nextImageButton');
const errorMessage = document.getElementById('errorMessage');
const imageUpload = document.getElementById('imageUpload');

// Canvas and context for image
const canvasImage = document.getElementById('canvasImage');
const ctxImage = canvasImage.getContext('2d');

// Source image element
const sourceImage = document.getElementById('sourceImage');

// Global dot size, starting with the minimum value (small dot) on first load
let dotSize = parseInt(dotSizeSlider.value, 10);

// Function to apply dotted effect on a given image source onto canvas context
function applyDottedEffect(ctx, source, width, height, dotSize) {
  // Check that the image has been successfully loaded
  if (source.naturalWidth === 0 || source.naturalHeight === 0) {
    console.error('Image is not loaded properly.');
    errorMessage.textContent = 'Error: Image failed to load properly.';
    return;
  }
  errorMessage.textContent = '';

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Clear canvas for dotted drawing
  ctx.clearRect(0, 0, width, height);

  // Loop over grid positions
  for (let y = 0; y < height; y += dotSize) {
    for (let x = 0; x < width; x += dotSize) {
      // Accumulate brightness within the dot block area
      let total = 0, count = 0;
      for (let dy = 0; dy < dotSize && (y + dy) < height; dy++) {
        for (let dx = 0; dx < dotSize && (x + dx) < width; dx++) {
          const idx = 4 * ((y + dy) * width + (x + dx));
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          total += brightness;
          count++;
        }
      }
      const avgBrightness = total / count;
      const fillColor = avgBrightness > 128 ? '#fff' : '#000';

      // Draw a circle at the center of the grid cell
      const cx = x + dotSize / 2;
      const cy = y + dotSize / 2;
      const radius = dotSize / 2 * 0.8;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
  }
}

// Process image once loaded and valid
function processImage() {
  // Check that image loaded successfully (naturalWidth > 0)
  if (sourceImage.naturalWidth === 0 || sourceImage.naturalHeight === 0) {
    errorMessage.textContent = 'Error: Unable to process image because it failed to load.';
    return;
  }
  errorMessage.textContent = '';
  // Set canvas size same as image
  canvasImage.width = sourceImage.naturalWidth;
  canvasImage.height = sourceImage.naturalHeight;
  applyDottedEffect(ctxImage, sourceImage, canvasImage.width, canvasImage.height, dotSize);
}

// Function to load a new image with a random query parameter to bypass cache
function loadNextImage() {
  // Using current timestamp as a cache-buster
  const randomQuery = Date.now();
  errorMessage.textContent = '';
  // Remove any uploaded image object URL if present
  if (sourceImage.dataset.uploaded === 'true') {
    URL.revokeObjectURL(sourceImage.src);
    delete sourceImage.dataset.uploaded;
  }
  // Start loading new image
  sourceImage.src = `https://picsum.photos/400/300?random=${randomQuery}`;
}

// Handle image load errors and try to reload automatically
sourceImage.addEventListener('error', () => {
  errorMessage.textContent = 'Error: Failed to load image. Retrying...';
  console.error('Image load error. Retrying in 1 second.');
  // Wait 1 second before trying again
  setTimeout(loadNextImage, 1000);
});

// Setup Image processing - handle already loaded images too
if (sourceImage.complete && sourceImage.naturalWidth !== 0) {
  processImage();
} else {
  sourceImage.addEventListener('load', processImage);
}

// Update dot size when slider value changes
dotSizeSlider.addEventListener('input', (e) => {
  dotSize = parseInt(e.target.value, 10);
  dotSizeValueDisplay.textContent = dotSize;
  // Reapply effect on image if loaded correctly
  if (sourceImage.complete && sourceImage.naturalWidth !== 0) {
    applyDottedEffect(ctxImage, sourceImage, canvasImage.width, canvasImage.height, dotSize);
  }
});

// Add event listener for next image button
nextImageButton.addEventListener('click', () => {
  loadNextImage();
});

// Handle file upload event
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fileURL = URL.createObjectURL(file);
  // Remove any error messages
  errorMessage.textContent = '';
  // Mark as uploaded image so we can revoke the URL later
  sourceImage.dataset.uploaded = 'true';
  sourceImage.src = fileURL;
});