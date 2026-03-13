import { axiosInstance } from "../lib/axios";

export const createEventDraft = async (payload) => {
  const res = await axiosInstance.post("/events/draft", payload);
  return res.data;
};

export const getEvents = async () => {
  const res = await axiosInstance.get("/events");
  return res.data;
};

export const getEventDetails = async (eventId) => {
  const res = await axiosInstance.get(`/events/${eventId}`);
  return res.data;
};

export const getEventJudgeScores = async (eventId) => {
  const res = await axiosInstance.get(`/events/${eventId}/judge-scores`);
  return res.data;
};

export const updateEvent = async (eventId, payload) => {
  const res = await axiosInstance.put(`/events/${eventId}`, payload);
  return res.data;
};

export const deleteEvent = async (eventId) => {
  await axiosInstance.delete(`/events/${eventId}`);
};

export const addEventJudge = async (eventId, payload) => {
  const res = await axiosInstance.post(`/events/${eventId}/judges`, payload);
  return res.data;
};

export const submitJudgeScore = async (eventId, payload) => {
  const res = await axiosInstance.post(`/events/${eventId}/judge-scores`, payload);
  return res.data;
};

export const addEventContestant = async (eventId, payload) => {
  const res = await axiosInstance.post(`/events/${eventId}/contestants`, payload);
  return res.data;
};

export const importEventContestants = async (eventId, payload) => {
  const res = await axiosInstance.post(
    `/events/${eventId}/contestants/import`,
    payload,
  );
  return res.data;
};
