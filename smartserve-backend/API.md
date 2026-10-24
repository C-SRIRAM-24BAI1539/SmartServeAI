# SmartServe AI API

All protected endpoints require `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login` |
| Profile | `GET`, `PATCH /api/profile/me` |
| Categories | `GET /api/categories`; admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Providers | `GET /api/providers`, `GET /api/providers/:id`, provider: `GET /api/providers/me/dashboard` |
| Services | `GET /api/services`; provider: `POST /api/services`, `PATCH`, `DELETE /api/services/:id` |
| Bookings | customer: `POST /api/bookings`, `PATCH /api/bookings/:id/cancel`; all roles: `GET /api/bookings`, `GET /api/bookings/:id`; provider/admin: `PATCH /api/bookings/:id/status` |
| Reviews | `GET /api/reviews/provider/:providerId`; customer: `POST /api/reviews` |
| Admin | `GET /api/admin/dashboard`, `GET /api/admin/users` |

Booking status is constrained to `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`, with `PENDING → REJECTED` and customer cancellation permitted while `PENDING` or `ACCEPTED`.

AI/RAG fields on bookings intentionally remain optional and are not populated by this API.
