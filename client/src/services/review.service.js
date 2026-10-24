
import api from "./api.js";

export async function createReview(bookingId, data) {
  const response = await api.post(`/reviews/booking/${bookingId}`, data);
  return response.data;
}
