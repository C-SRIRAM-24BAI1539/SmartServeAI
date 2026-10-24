
import api from "./api.js";

export async function getMyBookings() {
  const response = await api.get("/bookings");
  return response.data.bookings ?? [];
}

export async function createBooking(data) {
  const response = await api.post("/bookings", data);
  return response.data.booking;
}

export async function updateBookingStatus(id, status) {
  const response = await api.patch(`/bookings/${id}/status`, { status });
  return response.data.booking;
}