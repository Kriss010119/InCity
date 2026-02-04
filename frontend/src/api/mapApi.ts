import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const buildRoute = (from: string, to: string) =>
  api.post("/route", { from, to });

export const getPlacesAlongRoute = (routeId: string) =>
  api.get(`/places?routeId=${routeId}`);

export const getEventsInCity = (city: string) =>
  api.get(`/events?city=${city}`);
