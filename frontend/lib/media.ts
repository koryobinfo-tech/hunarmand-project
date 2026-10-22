export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файл хонда нашуд"));
    reader.readAsDataURL(file);
  });
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1600, quality = 0.8) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Файл набояд аз 20 МБ зиёд бошад.");
  }
  if (!file.type.startsWith("image/")) {
    return fileToDataUrl(file);
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fileToDataUrl(file);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
