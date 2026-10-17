/**
 * Photo prise depuis un bouton « Scanner mon assiette », en attente d'analyse sur l'écran scan-meal.
 * Sur iPhone, l'appareil photo ne s'ouvre que dans le geste de l'utilisateur : on le déclenche
 * donc sur l'écran du bouton, puis on transmet le fichier à l'écran d'analyse. Gardée en mémoire
 * seulement, jamais stockée.
 */
let pendingPhoto: File | null = null;

export function setPendingPhoto(file: File) {
  pendingPhoto = file;
}

/** Récupère la photo en attente et la retire (une seule lecture). */
export function takePendingPhoto(): File | null {
  const file = pendingPhoto;
  pendingPhoto = null;
  return file;
}
