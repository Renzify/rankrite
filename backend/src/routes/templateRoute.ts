import { Router } from "express";
import { getGymnasticsTemplate } from "../controllers/templateController.ts";

const router = Router();

router.get("/templates/gymnastics", getGymnasticsTemplate);

export default router;
