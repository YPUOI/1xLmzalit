/**
 * Utility to automatically remove white, light, solid, or checkerboard backgrounds
 * from uploaded team crests and logos using client-side HTML5 Canvas and edge-connected flood fill.
 * 
 * Optimized for Firebase Firestore persistence (< 1MB document size limit).
 * Automatically downsamples logos to crisp 256x256 dimensions (~20KB-50KB) so they
 * save instantly to Firestore and broadcast to all users in real-time.
 */

export interface BackgroundRemovalOptions {
  tolerance?: number; // Color distance threshold (default: 42)
  feather?: number; // Anti-aliasing soft edge margin (default: 20)
  autoCrop?: boolean; // Trim transparent padding (default: true)
  cropPadding?: number; // Padding after cropping (default: 8)
  maxDim?: number; // Maximum dimension (default: 256px)
}

/**
 * Calculates Euclidean distance in RGB color space using Redmean approximation
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Helper to convert Blob or File to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads an image from a File, Blob, or URL string into an HTMLImageElement
 * Handles CORS and proxies external image URLs to prevent canvas tainting.
 */
export async function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  let effectiveSrc = source;

  // If source is an external URL, attempt fetching as blob first to guarantee canvas non-tainted state
  if (typeof source === 'string' && source.startsWith('http')) {
    try {
      const res = await fetch(source, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        effectiveSrc = await blobToDataUrl(blob);
      }
    } catch {
      // If direct fetch fails (e.g. strict CORS), try via CORS proxy
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          effectiveSrc = await blobToDataUrl(blob);
        }
      } catch {
        // Fallback to direct URL if proxies fail
      }
    }
  } else if (typeof source !== 'string') {
    effectiveSrc = await blobToDataUrl(source);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin attribute if failed
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = (err) => reject(new Error('Failed to load image: ' + String(err)));
      img2.src = typeof effectiveSrc === 'string' ? effectiveSrc : URL.createObjectURL(effectiveSrc);
    };

    img.src = typeof effectiveSrc === 'string' ? effectiveSrc : URL.createObjectURL(effectiveSrc);
  });
}

/**
 * Compresses any image Data URL to fit within target max dimension (default 256px)
 * ensuring it stays well under 100KB for Firestore storage.
 */
export async function compressLogoDataUrl(dataUrl: string, maxDim = 256): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width <= maxDim && height <= maxDim && dataUrl.length < 150000) {
      return dataUrl;
    }

    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/png');
  } catch {
    return dataUrl;
  }
}

/**
 * Automatically removes background from an image source
 * @param source Image file, blob, or dataURL/URL
 * @param options Customization options for tolerance and feathering
 * @returns Promise with transparent PNG Data URL (< 100KB, ideal for Firestore)
 */
export async function removeImageBackground(
  source: File | Blob | string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 44,
    feather = 22,
    autoCrop = true,
    cropPadding = 8,
    maxDim = 280, // Optimal dimension for crests (< 60KB PNG data URL)
  } = options;

  const img = await loadImage(source);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Scale down to maxDim for fast flood-fill and safe Firestore size
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // Create processing canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas context');

  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Analyze border pixels to determine the background color(s)
  const cornerCoords = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
  ];

  let sampleR = 0;
  let sampleG = 0;
  let sampleB = 0;
  let sampleCount = 0;
  let whitePixelCount = 0;
  let darkPixelCount = 0;

  for (const [cx, cy] of cornerCoords) {
    const idx = (cy * width + cx) * 4;
    const a = data[idx + 3];
    if (a > 50) {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      sampleR += r;
      sampleG += g;
      sampleB += b;
      sampleCount++;

      if (r > 215 && g > 215 && b > 215) whitePixelCount++;
      if (r < 40 && g < 40 && b < 40) darkPixelCount++;
    }
  }

  const bgR = sampleCount > 0 ? Math.round(sampleR / sampleCount) : 255;
  const bgG = sampleCount > 0 ? Math.round(sampleG / sampleCount) : 255;
  const bgB = sampleCount > 0 ? Math.round(sampleB / sampleCount) : 255;

  const isPredominantlyWhite = whitePixelCount >= Math.max(1, sampleCount * 0.4);
  const isPredominantlyDark = darkPixelCount >= Math.max(1, sampleCount * 0.5);

  // 2. Connected-component flood fill from the outer perimeter
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  const isBackgroundPixel = (r: number, g: number, b: number, a: number): boolean => {
    // If already transparent
    if (a < 35) return true;

    // If background is white/light
    if (isPredominantlyWhite) {
      if (r >= 220 && g >= 220 && b >= 220) return true;
      // Checkerboard grey/white tile detection
      const isGreyTile = Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && r >= 185 && r <= 255;
      if (isGreyTile) return true;
    }

    // If background is dark/black
    if (isPredominantlyDark) {
      if (r <= 40 && g <= 40 && b <= 40) return true;
    }

    // General distance to sampled background color
    const dist = colorDistance(r, g, b, bgR, bgG, bgB);
    return dist <= tolerance;
  };

  // Seed with all border pixels
  for (let x = 0; x < width; x++) {
    const topIdx = x;
    const topDataIdx = topIdx * 4;
    if (isBackgroundPixel(data[topDataIdx], data[topDataIdx + 1], data[topDataIdx + 2], data[topDataIdx + 3])) {
      visited[topIdx] = 1;
      queue[qTail++] = topIdx;
    }

    const btmIdx = (height - 1) * width + x;
    const btmDataIdx = btmIdx * 4;
    if (isBackgroundPixel(data[btmDataIdx], data[btmDataIdx + 1], data[btmDataIdx + 2], data[btmDataIdx + 3])) {
      visited[btmIdx] = 1;
      queue[qTail++] = btmIdx;
    }
  }

  for (let y = 1; y < height - 1; y++) {
    const leftIdx = y * width;
    const leftDataIdx = leftIdx * 4;
    if (visited[leftIdx] === 0 && isBackgroundPixel(data[leftDataIdx], data[leftDataIdx + 1], data[leftDataIdx + 2], data[leftDataIdx + 3])) {
      visited[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }

    const rightIdx = y * width + (width - 1);
    const rightDataIdx = rightIdx * 4;
    if (visited[rightIdx] === 0 && isBackgroundPixel(data[rightDataIdx], data[rightDataIdx + 1], data[rightDataIdx + 2], data[rightDataIdx + 3])) {
      visited[rightIdx] = 1;
      queue[qTail++] = rightIdx;
    }
  }

  // Process flood fill queue
  while (qHead < qTail) {
    const currentIdx = queue[qHead++];
    const cx = currentIdx % width;
    const cy = Math.floor(currentIdx / width);

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (visited[nIdx] === 0) {
          const nDataIdx = nIdx * 4;
          const nr = data[nDataIdx];
          const ng = data[nDataIdx + 1];
          const nb = data[nDataIdx + 2];
          const na = data[nDataIdx + 3];

          if (isBackgroundPixel(nr, ng, nb, na)) {
            visited[nIdx] = 1;
            queue[qTail++] = nIdx;
          }
        }
      }
    }
  }

  // 3. Clear background pixels and apply anti-aliasing feathering to borders
  for (let i = 0; i < width * height; i++) {
    const dataIdx = i * 4;
    if (visited[i] === 1) {
      data[dataIdx + 3] = 0;
    } else {
      const x = i % width;
      const y = Math.floor(i / width);
      let adjacentBg = false;

      if (
        (x > 0 && visited[i - 1] === 1) ||
        (x < width - 1 && visited[i + 1] === 1) ||
        (y > 0 && visited[i - width] === 1) ||
        (y < height - 1 && visited[i + width] === 1)
      ) {
        adjacentBg = true;
      }

      if (adjacentBg) {
        const r = data[dataIdx];
        const g = data[dataIdx + 1];
        const b = data[dataIdx + 2];
        const dist = colorDistance(r, g, b, bgR, bgG, bgB);

        if (dist < tolerance + feather) {
          const factor = Math.max(0, Math.min(1, (dist - tolerance) / feather));
          data[dataIdx + 3] = Math.round(factor * 255);

          // Defringe color bleed from background
          if (factor > 0.1 && factor < 0.95) {
            data[dataIdx] = Math.max(0, Math.min(255, Math.round((r - bgR * (1 - factor)) / factor)));
            data[dataIdx + 1] = Math.max(0, Math.min(255, Math.round((g - bgG * (1 - factor)) / factor)));
            data[dataIdx + 2] = Math.max(0, Math.min(255, Math.round((b - bgB * (1 - factor)) / factor)));
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. Auto-crop transparent boundaries if requested
  if (autoCrop) {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasVisiblePixels = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasVisiblePixels = true;
        }
      }
    }

    if (hasVisiblePixels && (minX > 0 || minY > 0 || maxX < width - 1 || maxY < height - 1)) {
      const pad = cropPadding;
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
      const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

      // Final target dimensions (keep within 256x256 max)
      const finalMaxDim = 256;
      let finalW = cropW;
      let finalH = cropH;
      if (finalW > finalMaxDim || finalH > finalMaxDim) {
        if (finalW >= finalH) {
          finalH = Math.round((finalH * finalMaxDim) / finalW);
          finalW = finalMaxDim;
        } else {
          finalW = Math.round((finalW * finalMaxDim) / finalH);
          finalH = finalMaxDim;
        }
      }

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = finalW;
      croppedCanvas.height = finalH;
      const croppedCtx = croppedCanvas.getContext('2d');

      if (croppedCtx) {
        croppedCtx.imageSmoothingEnabled = true;
        croppedCtx.imageSmoothingQuality = 'high';
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, finalW, finalH);
        return croppedCanvas.toDataURL('image/png');
      }
    }
  }

  // Ensure final output canvas is within 256x256 max
  if (width > 256 || height > 256) {
    return await compressLogoDataUrl(canvas.toDataURL('image/png'), 256);
  }

  return canvas.toDataURL('image/png');
}
