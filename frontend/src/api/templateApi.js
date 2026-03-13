import { axiosInstance } from "../shared/lib/axios";

export const getTemplateCatalog = async () => {
  const res = await axiosInstance.get("/templates/catalog");
  return res.data;
};

export const getTemplateByName = async (templateName) => {
  const res = await axiosInstance.get(
    `/templates/${encodeURIComponent(templateName)}`,
  );
  return res.data;
};

export const createTemplate = async (payload) => {
  const res = await axiosInstance.post("/templates", payload);
  return res.data;
};
