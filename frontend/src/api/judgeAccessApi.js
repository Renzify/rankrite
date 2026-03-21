import { axiosInstance } from "../shared/lib/axios";

function buildJudgeAccessHeaders(accessToken) {
  const normalizedToken = String(accessToken ?? "").trim();

  if (!normalizedToken) {
    throw new Error("Judge access token is required.");
  }

  return {
    Authorization: `Bearer ${normalizedToken}`,
  };
}

export const getJudgeAccessContext = async (accessToken) => {
  const res = await axiosInstance.get("/judge-access/context", {
    headers: buildJudgeAccessHeaders(accessToken),
  });
  return res.data;
};

export const submitJudgeAccessScore = async (accessToken, payload) => {
  const res = await axiosInstance.post("/judge-access/score", payload, {
    headers: buildJudgeAccessHeaders(accessToken),
  });
  return res.data;
};
