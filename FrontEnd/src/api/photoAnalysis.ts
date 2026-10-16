import api from "./client";
import { FoodResult } from "./foodSearch";

export type PhotoFood = {
  name: string;
  estimatedGrams: number;
  /** Produit Open Food Facts correspondant (valeurs pour 100 g), null si rien trouvé. */
  match: FoodResult | null;
};

export type PhotoAnalysisResult = {
  foods: PhotoFood[];
  remainingToday: number;
};

export async function analyzeMealPhoto(photo: Blob): Promise<PhotoAnalysisResult> {
  const response = await api.post("/meals/photo-analysis", photo, {
    headers: { "Content-Type": "image/jpeg" },
    // Le serveur peut enchaîner plusieurs modèles puis les recherches Open Food Facts.
    timeout: 120_000,
  });
  return response.data;
}

/** Message lisible pour l'utilisateur à partir d'une erreur d'analyse. */
export function photoErrorMessage(error: any): string {
  const serverMessage = error?.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (error?.code === "ECONNABORTED") return "L'analyse a pris trop de temps. Réessaie dans un instant.";
  if (!error?.response) return "Connexion au serveur impossible. Vérifie ta connexion et réessaie.";
  return "L'analyse de la photo a échoué. Réessaie ou ajoute les aliments à la main.";
}
