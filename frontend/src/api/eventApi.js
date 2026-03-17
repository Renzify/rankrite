import { axiosInstance } from "../shared/lib/axios";

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

export const getEventJudgeScores = async (eventId, options = {}) => {
  const params = new URLSearchParams();

  if (options.contestantId) {
    params.set("contestantId", options.contestantId);
  }

  if (options.judgeId) {
    params.set("judgeId", options.judgeId);
  }

  if (options.eventPhaseId) {
    params.set("eventPhaseId", options.eventPhaseId);
  }

  const queryString = params.toString();
  const res = await axiosInstance.get(
    `/events/${eventId}/judge-scores${queryString ? `?${queryString}` : ""}`,
  );
  return res.data;
};

export const updateEvent = async (eventId, payload) => {
  const res = await axiosInstance.put(`/events/${eventId}`, payload);
  return res.data;
};

export const updateCurrentEventPhase = async (eventId, payload) => {
  const res = await axiosInstance.put(`/events/${eventId}/current-phase`, payload);
  return res.data;
};

export const setEventActiveContestant = async (eventId, payload) => {
  const res = await axiosInstance.put(
    `/events/${eventId}/active-contestant`,
    payload,
  );
  return res.data;
};

export const deleteEvent = async (eventId) => {
  await axiosInstance.delete(`/events/${eventId}`);
};

export const addEventJudge = async (eventId, payload) => {
  const res = await axiosInstance.post(`/events/${eventId}/judges`, payload);
  return res.data;
};

export const updateEventJudge = async (eventId, judgeId, payload) => {
  const res = await axiosInstance.put(
    `/events/${eventId}/judges/${judgeId}`,
    payload,
  );
  return res.data;
};

export const deleteEventJudge = async (eventId, judgeId) => {
  await axiosInstance.delete(`/events/${eventId}/judges/${judgeId}`);
};

export const submitJudgeScore = async (eventId, payload) => {
  const res = await axiosInstance.post(
    `/events/${eventId}/judge-scores`,
    payload,
  );
  return res.data;
};

export const lockJudgeScore = async (eventId, payload) => {
  const res = await axiosInstance.post(
    `/events/${eventId}/judge-scores/lock`,
    payload,
  );
  return res.data;
};

export const addEventContestant = async (eventId, payload) => {
  const res = await axiosInstance.post(
    `/events/${eventId}/contestants`,
    payload,
  );
  return res.data;
};

export const updateEventContestant = async (eventId, contestantId, payload) => {
  const res = await axiosInstance.put(
    `/events/${eventId}/contestants/${contestantId}`,
    payload,
  );
  return res.data;
};

export const deleteEventContestant = async (eventId, contestantId) => {
  await axiosInstance.delete(`/events/${eventId}/contestants/${contestantId}`);
};

export const importEventContestants = async (eventId, payload) => {
  const res = await axiosInstance.post(
    `/events/${eventId}/contestants/import`,
    payload,
  );
  return res.data;
};
