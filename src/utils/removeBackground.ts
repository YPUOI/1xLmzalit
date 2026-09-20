/**
 * Utility to automatically remove white, light, solid, or checkerboard backgrounds
 * from uploaded team crests and logos using client-side HTML5 Canvas and edge-connected flood fill.
 */

export interface BackgroundRemovalOptions {
  tolerance?: number; // Color distance threshold (default: 38)
  feather?: number; // Anti-aliasing soft edge margin (default: 18)
  autoCrop?: boolean; // Trim transparent padding (default: true)
  cropPadding?: number; // Padding after cropping (default: 10)
}

/**
 * Calculates Euclidean distance in RGB color space
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted color distance for human eye perception (Redmean color distance approximation)
  const rMean = (r1 + r2) / 2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Loads an image from a File, Blob, or URL string into an HTMLImageElement
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('فشل تحميل الصورة: ' + String(err)));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('فشل قراءة ملف الصورة'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Automatically removes background from an image source
 * @param source Image file, blob, or dataURL/URL
 * @param options Customization options for tolerance and feathering
 * @returns Promise with transparent PNG Data URL
 */
export async function removeImageBackground(
  source: File | Blob | string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 42,
    feather = 22,
    autoCrop = true,
    cropPadding = 10,
  } = options;

  const img = await loadImage(source);

  // Limit maximum dimension to 1024px for high speed and crisp logo clarity
  const maxDim = 1024;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

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
  if (!ctx) throw new Error('لا يمكن تفعيل معالج الرسوم Canvas');

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

      if (r > 220 && g > 220 && b > 220) whitePixelCount++;
      if (r < 40 && g < 40 && b < 40) darkPixelCount++;
    }
  }

  // Determine average background color from perimeter samples
  const bgR = sampleCount > 0 ? Math.round(sampleR / sampleCount) : 255;
  const bgG = sampleCount > 0 ? Math.round(sampleG / sampleCount) : 255;
  const bgB = sampleCount > 0 ? Math.round(sampleB / sampleCount) : 255;

  const isPredominantlyWhite = whitePixelCount >= sampleCount * 0.5;
  const isPredominantlyDark = darkPixelCount >= sampleCount * 0.6;

  // 2. Connected-component flood fill from the outer perimeter
  // We use a queue to only remove background connected to borders,
  // preventing accidental removal of white elements inside the logo!
  const visited = new Uint8Array(width * height);
  // queue: store coordinates as 1D index
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  // Check function to match background color
  const isBackgroundPixel = (r: number, g: number, b: number, a: number): boolean => {
    // If already transparent
    if (a < 30) return true;

    // If background is white/light
    if (isPredominantlyWhite) {
      if (r >= 225 && g >= 225 && b >= 225) return true;
      // Checkerboard grey/white tile detection
      const isGreyTile = Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8 && r >= 190 && r <= 255;
      if (isGreyTile) return true;
    }

    // If background is dark/black
    if (isPredominantlyDark) {
      if (r <= 35 && g <= 35 && b <= 35) return true;
    }

    // General distance to sampled background color
    const dist = colorDistance(r, g, b, bgR, bgG, bgB);
    return dist <= tolerance;
  };

  // Seed with all border pixels
  for (let x = 0; x < width; x++) {
    // Top border
    const topIdx = x;
    const topDataIdx = topIdx * 4;
    if (isBackgroundPixel(data[topDataIdx], data[topDataIdx + 1], data[topDataIdx + 2], data[topDataIdx + 3])) {
      visited[topIdx] = 1;
      queue[qTail++] = topIdx;
    }

    // Bottom border
    const btmIdx = (height - 1) * width + x;
    const btmDataIdx = btmIdx * 4;
    if (isBackgroundPixel(data[btmDataIdx], data[btmDataIdx + 1], data[btmDataIdx + 2], data[btmDataIdx + 3])) {
      visited[btmIdx] = 1;
      queue[qTail++] = btmIdx;
    }
  }

  for (let y = 1; y < height - 1; y++) {
    // Left border
    const leftIdx = y * width;
    const leftDataIdx = leftIdx * 4;
    if (visited[leftIdx] === 0 && isBackgroundPixel(data[leftDataIdx], data[leftDataIdx + 1], data[leftDataIdx + 2], data[leftDataIdx + 3])) {
      visited[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }

    // Right border
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

    // Check 4 adjacent neighbors
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
      // 100% background -> set alpha to 0
      data[dataIdx + 3] = 0;
    } else {
      // Check if neighboring any visited background pixel for anti-aliasing / defringe
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

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext('2d');

      if (croppedCtx) {
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        return croppedCanvas.toDataURL('image/png');
      }
    }
  }

  return canvas.toDataURL('image/png');
}
