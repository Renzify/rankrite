import type { Request, Response } from "express";
import {
  getTemplateByName,
  getTemplateCatalog,
} from "../services/templateService.ts";

export async function listTemplateCatalog(req: Request, res: Response) {
  try {
    const catalog = await getTemplateCatalog();
    res.json(catalog);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load template catalog",
    });
  }
}

export async function getTemplate(req: Request, res: Response) {
  try {
    const rawName = req.params.name;
    const name = Array.isArray(rawName) ? rawName[0] : rawName;

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        message: "Template name is required",
      });
    }

    // Express already decodes route params.
    const template = await getTemplateByName(name);

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    res.json(template);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load template",
    });
  }
}
