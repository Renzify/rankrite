import type { Request, Response } from "express";
import {
  createTemplate,
  type CreateTemplateInput,
  getTemplateByName,
  getTemplateCatalog,
} from "../services/templateService.ts";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import { createActivityLogEntry } from "../services/activityLogService.ts";

function getAuthenticatedUserId(req: Request) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (typeof userId !== "string" || userId.trim() === "") {
    return null;
  }

  return userId;
}

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

export async function createTemplateController(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = req.body as CreateTemplateInput;
    const template = await createTemplate(payload);
    await createActivityLogEntry({
      userId,
      action: "Create Template",
      details: "Created template \"" + template.name + "\" (ID: " + template.id + ")",
    });
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof Error && error.message === "TEMPLATE_NAME_EXISTS") {
      return res.status(409).json({
        message: "Template name already exists",
      });
    }

    if (error instanceof Error && error.message === "INVALID_TEMPLATE_INPUT") {
      return res.status(400).json({
        message: "Invalid template input",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to create template",
    });
  }
}
