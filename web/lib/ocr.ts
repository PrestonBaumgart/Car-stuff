// Read the text in a photo, entirely on this device (no server): Tesseract.js runs the recognizer in a web
// worker. The first scan downloads the recognizer and English language data (~4 MB) from the jsdelivr CDN;
// the browser caches them after that. Photos are never uploaded.
"use client";

const MAX_SIDE = 2200;

/** Draw the photo upright, scaled down, in grayscale with stretched contrast: faster and easier to read. */
async function prepare(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const img = g.getImageData(0, 0, canvas.width, canvas.height), px = img.data;
  let lo = 255, hi = 0;
  for (let i = 0; i < px.length; i += 4) {
    const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = y;
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < px.length; i += 4) px[i] = px[i + 1] = px[i + 2] = ((px[i] - lo) * 255) / span;
  g.putImageData(img, 0, 0);
  return canvas;
}

/** The text in a photo. onProgress gets 0–1 and a short status while the recognizer loads and reads. */
export async function readPhoto(file: Blob, onProgress?: (progress: number, status: string) => void): Promise<string> {
  const canvas = await prepare(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.(m.progress, m.status),
  });
  try {
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
