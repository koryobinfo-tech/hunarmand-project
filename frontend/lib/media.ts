export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файл хонда нашуд"));
    reader.readAsDataURL(file);
  });
}

export async function fileToCompressedDataUrl(file: File, maxSize = 1280, quality = 0.74) {
  if (!file.type.startsWith("image/")) {
    if (file.size > 6 * 1024 * 1024) {
      throw new Error("Видео набояд аз 6 МБ зиёд бошад, то дар базаи доимӣ сабт шавад.");
    }
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
