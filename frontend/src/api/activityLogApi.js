import { axiosInstance } from "../shared/lib/axios";

export const getActivityLogs = async () => {
  const res = await axiosInstance.get("/activity-logs");
  return res.data;
};
