import { Router } from "express";
import { recommendProviders } from "./recommendation.controller.js";

const router = Router();

router.post("/", recommendProviders);

export default router;