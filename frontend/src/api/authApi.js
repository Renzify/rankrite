import { axiosInstance } from "../shared/lib/axios";

export const checkAuth = async () => {
  const res = await axiosInstance.get("/auth/check");
  return res.data;
};

export const login = async (payload) => {
  const res = await axiosInstance.post("/auth/login", payload);

  return res.data;
};

export const signup = async (payload) => {
  const res = await axiosInstance.post("/auth/signup", payload);

  return res.data;
};

export const logout = async () => {
  const res = await axiosInstance.post("/auth/logout");

  return res.data;
};
