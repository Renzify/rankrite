import { axiosInstance } from "../shared/lib/axios";

export const login = async (payload) => {
  const res = await axiosInstance.post("/auth/login", payload, {
    withCredentials: true,
  });

  return res.data;
};
