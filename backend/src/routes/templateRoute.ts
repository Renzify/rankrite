import { Router } from "express";
import {
  getTemplate,
  listTemplateCatalog,
} from "../controllers/templateController.ts";

const router = Router();

router.get("/templates/catalog", listTemplateCatalog);
router.get("/templates/:name", getTemplate);

export default router;
