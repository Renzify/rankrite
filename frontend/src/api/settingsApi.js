import { axiosInstance } from "../shared/lib/axios";

export const getSettingsProfile = async () => {
  const res = await axiosInstance.get("/auth/settings");
  return res.data;
};

export const updateSettingsProfile = async (payload) => {
  const res = await axiosInstance.put("/auth/settings/profile", payload);
  return res.data;
};

export const updateSettingsPassword = async (payload) => {
  const res = await axiosInstance.put("/auth/settings/password", payload);
  return res.data;
};
