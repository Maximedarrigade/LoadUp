/**
 * Prise de photo et compression côté navigateur (PWA).
 * On passe par un <input type="file" capture="environment"> plutôt que getUserMedia,
 * peu fiable en PWA sur iPhone. Le redimensionnement via canvas supprime aussi les
 * métadonnées EXIF (dont la position GPS) avant l'envoi.
 */

const MAX_SIDE = 1024;
// Le serveur refuse au-delà de 1,5 Mo : on vise largement en dessous.
const TARGET_MAX_BYTES = 1.2 * 1024 * 1024;

/** Ouvre l'appareil photo (ou la galerie). Renvoie null si l'utilisateur annule. */
export function pickPhoto(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.style.display = "none";
    document.body.appendChild(input);

    const done = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener("change", () => done(input.files?.[0] ?? null));
    input.addEventListener("cancel", () => done(null));
    input.click();
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression impossible"))),
      "image/jpeg",
      quality
    );
  });
}

/** Redimensionne à 1024 px de côté max et réencode en JPEG. */
export async function compressPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let blob = await canvasToJpeg(canvas, 0.7);
    if (blob.size > TARGET_MAX_BYTES) blob = await canvasToJpeg(canvas, 0.5);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
