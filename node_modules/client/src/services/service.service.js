import api from "./api.js";

function extractData(response) {
const body = response.data;
return body?.data ?? body?.categories ?? body?.services ?? body;
}

export async function getServiceCategories() {
const response = await api.get("/services/categories");
return extractData(response);
}

export async function getServices(params = {}) {
const response = await api.get("/services", { params });
return extractData(response);
}

export async function createService(data) {
const response = await api.post("/services", data);
return extractData(response);
}
