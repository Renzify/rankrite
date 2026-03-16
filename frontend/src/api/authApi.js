import { axiosInstance } from "../shared/lib/axios";

export const login = async (payload) => {
  const res = await axiosInstance.post("/auth/login", payload, {
    withCredentials: true,
  });

  return res.data;
};

export const signup = async (payload) => {
  const res = await axiosInstance.post("/auth/signup", payload, {
    withCredentials: true,
  });

  return res.data;
};
