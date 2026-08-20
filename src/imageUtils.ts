const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const AVATAR_SIZE = 384;

async function processImage(file: File, width: number, height: number, quality: number): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("A imagem original deve ter no máximo 10 MB.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d"); if (!context) { bitmap.close(); throw new Error("Não foi possível processar esta imagem."); }
  const sourceRatio = bitmap.width / bitmap.height; const targetRatio = width / height;
  const sourceWidth = sourceRatio > targetRatio ? bitmap.height * targetRatio : bitmap.width;
  const sourceHeight = sourceRatio > targetRatio ? bitmap.height : bitmap.width / targetRatio;
  const sourceX = (bitmap.width - sourceWidth) / 2; const sourceY = (bitmap.height - sourceHeight) / 2;
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height); bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Não foi possível converter esta imagem.");
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível ler a imagem processada.")); reader.readAsDataURL(blob); });
}

export const processAvatar = (file: File) => processImage(file, AVATAR_SIZE, AVATAR_SIZE, .82);
export const processCover = (file: File) => processImage(file, 1400, 420, .78);
