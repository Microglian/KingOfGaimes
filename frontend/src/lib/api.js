import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

export async function createCard(cardData) {
  const payload = preparePayload(cardData);
  const { data } = await api.post("/cards", payload);
  return normalizeCard(data);
}

export async function updateCard(id, cardData) {
  const payload = preparePayload(cardData);
  const { data } = await api.put(`/cards/${id}`, payload);
  return normalizeCard(data);
}

export async function getCard(id) {
  const { data } = await api.get(`/cards/${id}`);
  return normalizeCard(data);
}

export async function deleteCard(id) {
  const { data } = await api.delete(`/cards/${id}`);
  return data;
}

export async function searchCards(params = {}) {
  const { data } = await api.get("/cards", { params });
  return {
    cards: data.cards.map(normalizeCard),
    total: data.total,
  };
}

export async function importCards(cards) {
  const payload = cards.map(preparePayload);
  const { data } = await api.post("/cards/import", payload);
  return data.map(normalizeCard);
}

export async function exportAllCards() {
  const { data } = await api.get("/cards/export/all");
  return data.map(normalizeCard);
}

export function getProxyImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("file:")) return "";
  return `${API}/proxy-image?url=${encodeURIComponent(url)}`;
}

export async function getArchetypes() {
  const { data } = await api.get("/cards/meta/archetypes");
  return data;
}

export async function getSetCodes() {
  const { data } = await api.get("/cards/meta/set-codes");
  return data;
}

function preparePayload(card) {
  const payload = { ...card };
  if ("def" in payload) {
    payload.def = payload.def;
  }
  return payload;
}

function normalizeCard(data) {
  return {
    ...data,
    def: data.def ?? data.def_ ?? null,
    imageOffset: data.imageOffset || { x: 0, y: 0 },
    imageCrop: data.imageCrop || { zoom: 1.0 },
    typeLine: data.typeLine || [],
    linkArrows: data.linkArrows || [],
    overlays: data.overlays || [],
    archetypes: data.archetypes || [],
  };
}
