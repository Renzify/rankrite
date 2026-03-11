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

