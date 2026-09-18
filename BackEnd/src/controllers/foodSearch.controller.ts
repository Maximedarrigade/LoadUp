import { Request, Response } from "express";
import { searchFoodByName, searchFoodByBarcode } from "../lib/openFoodFacts";

export async function searchFood(req: Request, res: Response) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query) {
      return res.status(400).json({ error: "Le paramètre de recherche 'q' est requis." });
    }

    const results = await searchFoodByName(query);
    res.json({ data: results });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Erreur lors de la recherche sur Open Food Facts." });
  }
}

export async function searchFoodBarcode(req: Request, res: Response) {
  try {
    const code = req.params.code as string;

    const result = await searchFoodByBarcode(code);

    if (!result) {
      return res.status(404).json({ error: "Produit introuvable pour ce code-barres." });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Erreur lors de la recherche sur Open Food Facts." });
  }
}
