import type { Request, Response } from "express";
import { getTemplateByName } from "../services/templateService.ts";

export async function getGymnasticsTemplate(req: Request, res: Response) {
  try {
    const template = await getTemplateByName("Gymnastics Template");

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
