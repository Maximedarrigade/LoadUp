import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { searchFood, searchFoodBarcode } from "../controllers/foodSearch.controller";

const router = Router();

router.use(authMiddleware);

router.get("/search", searchFood);
router.get("/barcode/:code", searchFoodBarcode);

export default router;
