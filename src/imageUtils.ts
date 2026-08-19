const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const AVATAR_SIZE = 384;

export async function processAvatar(file: File): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("A imagem original deve ter no máximo 10 MB.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas"); canvas.width = AVATAR_SIZE; canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d"); if (!context) { bitmap.close(); throw new Error("Não foi possível processar esta imagem."); }
  const side = Math.min(bitmap.width, bitmap.height); const sourceX = (bitmap.width - side) / 2; const sourceY = (bitmap.height - side) / 2;
  context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE); bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
  if (!blob) throw new Error("Não foi possível converter esta imagem.");
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Não foi possível ler a imagem processada.")); reader.readAsDataURL(blob); });
}
