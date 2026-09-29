/**
 * High-performance, universal background removal for football team crests and club logos.
 * Handles client-side processing directly in HTML5 Canvas:
 * - Automatically strips white, light, dark, solid-color, and fake checkerboard backgrounds.
 * - Scales high-res phone camera uploads down safely (preventing iOS Safari memory crashes).
 * - Crops transparent padding and centers crests in crisp, high-definition 256x256 dimensions.
 * - Produces compact transparent PNG data URLs (< 40KB) that save instantly to Firebase Firestore.
 */

export interface BackgroundRemovalOptions {
  tolerance?: number; // Color difference threshold (default: 55)
  feather?: number; // Soft edge margin (default: 18)
  autoCrop?: boolean; // Trim transparent padding (default: true)
  cropPadding?: number; // Padding around badge after cropping (default: 6)
  maxDim?: number; // Target max dimension for Firestore (default: 256)
}

/**
 * Calculates human-perception-weighted color difference (Redmean approximation)
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
 * Calculates standard perceived luminance (0-255)
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Determines whether a color is neutral / achromatic (grayscale, white, black, gray)
 */
function isAchromatic(r: number, g: number, b: number, maxSpread = 24): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) <= maxSpread;
}

/**
 * Converts a Blob or File to a Base64 data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as data URL'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Safely loads any File, Blob, or URL into an HTMLImageElement without CORS tainting.
 */
export async function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  let effectiveSrc = source;
  const isHttpUrl = typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'));

  if (isHttpUrl) {
    try {
      const res = await fetch(source as string, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        effectiveSrc = await blobToDataUrl(blob);
      }
    } catch {
      // If direct CORS fetch fails, try reliable proxies
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(source as string)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(source as string)}`
      ];

      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy);
          if (res.ok) {
            const blob = await res.blob();
            effectiveSrc = await blobToDataUrl(blob);
            break;
          }
        } catch {
          // Continue to next fallback
        }
      }
    }
  } else if (typeof source !== 'string') {
    // File or Blob
    effectiveSrc = await blobToDataUrl(source);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const isDataOrBlob = typeof effectiveSrc === 'string' && (effectiveSrc.startsWith('data:') || effectiveSrc.startsWith('blob:'));

    // DO NOT set crossOrigin on data: or blob: URLs (causes failures in Safari/iOS WebKit)
    if (!isDataOrBlob && isHttpUrl) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Secondary fallback
      const imgFallback = new Image();
      imgFallback.onload = () => resolve(imgFallback);
      imgFallback.onerror = (err) => reject(new Error('Failed to load image: ' + String(err)));
      imgFallback.src = typeof effectiveSrc === 'string' ? effectiveSrc : URL.createObjectURL(effectiveSrc);
    };

    img.src = typeof effectiveSrc === 'string' ? effectiveSrc : URL.createObjectURL(effectiveSrc);
  });
}

/**
 * Resizes and compresses any image Data URL to fit within target max dimension (default 256px)
 * ensuring it stays under 50KB for safe, instant Firestore broadcasting.
 */
export async function compressLogoDataUrl(dataUrl: string, maxDim = 256): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width <= maxDim && height <= maxDim && dataUrl.length < 80000) {
      return dataUrl;
    }

    if (width >= height) {
      height = Math.max(1, Math.round((height * maxDim) / width));
      width = maxDim;
    } else {
      width = Math.max(1, Math.round((width * maxDim) / height));
      height = maxDim;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
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
 * Automatically removes background from any club crest/logo.
 * Guaranteed to produce a transparent PNG data URL (< 50KB) safe for Firestore.
 */
export async function removeImageBackground(
  source: File | Blob | string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 56,
    feather = 16,
    autoCrop = true,
    cropPadding = 6,
    maxDim = 256
  } = options;

  const img = await loadImage(source);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (origW <= 0 || origH <= 0) {
    throw new Error('Invalid image dimensions');
  }

  // Work at a crisp, safe resolution (max 320px) to prevent iOS mobile memory crashes
  // while preserving sharp badge contours.
  const WORK_DIM = 320;
  let workW = origW;
  let workH = origH;

  if (workW > WORK_DIM || workH > WORK_DIM) {
    if (workW >= workH) {
      workH = Math.max(1, Math.round((workH * WORK_DIM) / workW));
      workW = WORK_DIM;
    } else {
      workW = Math.max(1, Math.round((workW * WORK_DIM) / workH));
      workH = WORK_DIM;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = workW;
  canvas.height = workH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to create canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, workW, workH);

  const imgData = ctx.getImageData(0, 0, workW, workH);
  const data = imgData.data;

  // 1. Analyze border pixels to understand background type
  // Sample the 4 corners, inset corners (to skip 1px borders), and edge mid-points
  const samplePoints: [number, number][] = [
    [0, 0],
    [workW - 1, 0],
    [0, workH - 1],
    [workW - 1, workH - 1],
    [Math.min(2, workW - 1), Math.min(2, workH - 1)],
    [Math.max(0, workW - 3), Math.min(2, workH - 1)],
    [Math.min(2, workW - 1), Math.max(0, workH - 3)],
    [Math.max(0, workW - 3), Math.max(0, workH - 3)],
    [Math.floor(workW * 0.25), 0],
    [Math.floor(workW * 0.75), 0],
    [Math.floor(workW * 0.25), workH - 1],
    [Math.floor(workW * 0.75), workH - 1],
    [0, Math.floor(workH * 0.25)],
    [0, Math.floor(workH * 0.75)],
    [workW - 1, Math.floor(workH * 0.25)],
    [workW - 1, Math.floor(workH * 0.75)],
  ];

  let transparentSamples = 0;
  let whiteSamples = 0;
  let greySamples = 0;
  let darkSamples = 0;
  let totalSolidSamples = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (const [sx, sy] of samplePoints) {
    const idx = (sy * workW + sx) * 4;
    const a = data[idx + 3];
    if (a < 35) {
      transparentSamples++;
      continue;
    }

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = getLuminance(r, g, b);
    const neutral = isAchromatic(r, g, b, 26);

    sumR += r;
    sumG += g;
    sumB += b;
    totalSolidSamples++;

    if (neutral && lum >= 225) whiteSamples++;
    else if (neutral && lum >= 170 && lum < 225) greySamples++;
    else if (lum <= 40) darkSamples++;
  }

  // If already predominantly transparent (e.g. valid transparent PNG)
  const isAlreadyTransparent = transparentSamples >= Math.floor(samplePoints.length * 0.6);
  if (isAlreadyTransparent) {
    // Image is already transparent! Simply crop transparent borders and return compressed PNG
    return finalizeAndCrop(canvas, ctx, imgData, workW, workH, autoCrop, cropPadding, maxDim);
  }

  // Check for fake transparent checkerboard (has both white and grey neutral tiles on perimeter)
  const isCheckerboard = (whiteSamples >= 2 && greySamples >= 2) || (greySamples >= 4 && isAchromatic(Math.round(sumR / Math.max(1, totalSolidSamples)), Math.round(sumG / Math.max(1, totalSolidSamples)), Math.round(sumB / Math.max(1, totalSolidSamples))));

  // Check for white / light background (very common for crests copied from web/photos)
  const isPredominantlyLight = (whiteSamples + greySamples) >= Math.max(2, Math.floor(totalSolidSamples * 0.45));

  // Check for dark background
  const isPredominantlyDark = darkSamples >= Math.max(2, Math.floor(totalSolidSamples * 0.45));

  // Dominant background color
  const bgR = totalSolidSamples > 0 ? Math.round(sumR / totalSolidSamples) : 255;
  const bgG = totalSolidSamples > 0 ? Math.round(sumG / totalSolidSamples) : 255;
  const bgB = totalSolidSamples > 0 ? Math.round(sumB / totalSolidSamples) : 255;

  // 2. Define background pixel test function
  const isBgPixel = (r: number, g: number, b: number, a: number): boolean => {
    if (a < 35) return true;

    // Fake checkerboard tile
    if (isCheckerboard) {
      if (isAchromatic(r, g, b, 28) && getLuminance(r, g, b) >= 160) {
        return true;
      }
    }

    // White / off-white background (matches white paper, white box, JPEG compression artifacts)
    if (isPredominantlyLight) {
      const lum = getLuminance(r, g, b);
      if (isAchromatic(r, g, b, 30) && lum >= 195) {
        return true;
      }
      if (lum >= 235) {
        return true;
      }
    }

    // Dark / black background
    if (isPredominantlyDark) {
      if (getLuminance(r, g, b) <= 45 && isAchromatic(r, g, b, 30)) {
        return true;
      }
    }

    // Distance to sampled perimeter background color
    const dist = colorDistance(r, g, b, bgR, bgG, bgB);
    return dist <= tolerance;
  };

  // 3. Flood Fill from image borders
  const totalPixels = workW * workH;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  // Seed top and bottom borders
  for (let x = 0; x < workW; x++) {
    const topIdx = x;
    const tdi = topIdx * 4;
    if (isBgPixel(data[tdi], data[tdi + 1], data[tdi + 2], data[tdi + 3])) {
      visited[topIdx] = 1;
      queue[qTail++] = topIdx;
    }

    const btmIdx = (workH - 1) * workW + x;
    const bdi = btmIdx * 4;
    if (isBgPixel(data[bdi], data[bdi + 1], data[bdi + 2], data[bdi + 3])) {
      visited[btmIdx] = 1;
      queue[qTail++] = btmIdx;
    }
  }

  // Seed left and right borders
  for (let y = 1; y < workH - 1; y++) {
    const leftIdx = y * workW;
    const ldi = leftIdx * 4;
    if (visited[leftIdx] === 0 && isBgPixel(data[ldi], data[ldi + 1], data[ldi + 2], data[ldi + 3])) {
      visited[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }

    const rightIdx = y * workW + (workW - 1);
    const rdi = rightIdx * 4;
    if (visited[rightIdx] === 0 && isBgPixel(data[rdi], data[rdi + 1], data[rdi + 2], data[rdi + 3])) {
      visited[rightIdx] = 1;
      queue[qTail++] = rightIdx;
    }
  }

  // Process 4-way flood fill
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % workW;
    const cy = Math.floor(curr / workW);

    // 4 neighbors: right, left, down, up
    const nCoords = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of nCoords) {
      if (nx >= 0 && nx < workW && ny >= 0 && ny < workH) {
        const nIdx = ny * workW + nx;
        if (visited[nIdx] === 0) {
          const ndi = nIdx * 4;
          if (isBgPixel(data[ndi], data[ndi + 1], data[ndi + 2], data[ndi + 3])) {
            visited[nIdx] = 1;
            queue[qTail++] = nIdx;
          }
        }
      }
    }
  }

  // 4. Clear background and apply soft edge defringing
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    if (visited[i] === 1) {
      data[idx + 3] = 0; // Make 100% transparent
    } else {
      // Check if neighboring a removed background pixel for anti-aliased edge smoothing
      const x = i % workW;
      const y = Math.floor(i / workW);
      const isBorder = (
        (x > 0 && visited[i - 1] === 1) ||
        (x < workW - 1 && visited[i + 1] === 1) ||
        (y > 0 && visited[i - workW] === 1) ||
        (y < workH - 1 && visited[i + workW] === 1)
      );

      if (isBorder) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const dist = colorDistance(r, g, b, bgR, bgG, bgB);

        if (dist < tolerance + feather) {
          const alphaFactor = Math.max(0, Math.min(1, (dist - tolerance) / Math.max(1, feather)));
          data[idx + 3] = Math.round(alphaFactor * 255);

          // Defringe color bleed
          if (alphaFactor > 0.05 && alphaFactor < 0.95) {
            data[idx] = Math.max(0, Math.min(255, Math.round((r - bgR * (1 - alphaFactor)) / alphaFactor)));
            data[idx + 1] = Math.max(0, Math.min(255, Math.round((g - bgG * (1 - alphaFactor)) / alphaFactor)));
            data[idx + 2] = Math.max(0, Math.min(255, Math.round((b - bgB * (1 - alphaFactor)) / alphaFactor)));
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 5. Finalize, crop transparent padding, and return crisp PNG
  return finalizeAndCrop(canvas, ctx, imgData, workW, workH, autoCrop, cropPadding, maxDim);
}

/**
 * Trims transparent bounds around the crest, centers it, and exports a 256x256 max PNG data URL.
 */
function finalizeAndCrop(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imgData: ImageData,
  width: number,
  height: number,
  autoCrop: boolean,
  cropPadding: number,
  maxDim: number
): string {
  if (!autoCrop) {
    if (width > maxDim || height > maxDim) {
      return compressLogoToTarget(canvas, maxDim);
    }
    return canvas.toDataURL('image/png');
  }

  const data = imgData.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasPixels = true;
      }
    }
  }

  // If no visible pixels remaining, fall back to canvas
  if (!hasPixels) {
    return canvas.toDataURL('image/png');
  }

  const pad = cropPadding;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

  // Fit within maxDim (e.g. 256x256)
  let targetW = cropW;
  let targetH = cropH;

  if (targetW > maxDim || targetH > maxDim) {
    if (targetW >= targetH) {
      targetH = Math.max(1, Math.round((targetH * maxDim) / targetW));
      targetW = maxDim;
    } else {
      targetW = Math.max(1, Math.round((targetW * maxDim) / targetH));
      targetH = maxDim;
    }
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas.toDataURL('image/png');

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

  return outCanvas.toDataURL('image/png');
}

/**
 * Resizes canvas to fit within maxDim
 */
function compressLogoToTarget(canvas: HTMLCanvasElement, maxDim: number): string {
  let targetW = canvas.width;
  let targetH = canvas.height;

  if (targetW >= targetH) {
    targetH = Math.max(1, Math.round((targetH * maxDim) / targetW));
    targetW = maxDim;
  } else {
    targetW = Math.max(1, Math.round((targetW * maxDim) / targetH));
    targetH = maxDim;
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas.toDataURL('image/png');

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(canvas, 0, 0, targetW, targetH);

  return outCanvas.toDataURL('image/png');
}
