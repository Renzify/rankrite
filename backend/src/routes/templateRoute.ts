import { Router } from "express";
import {
  createTemplateController,
  getTemplate,
  listTemplateCatalog,
} from "../controllers/templateController.ts";

const router = Router();

router.post("/templates", createTemplateController);
router.get("/templates/catalog", listTemplateCatalog);
router.get("/templates/:name", getTemplate);

export default router;
