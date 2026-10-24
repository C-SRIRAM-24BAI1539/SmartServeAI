import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createReview } from "../services/review.service.js";
import {
CalendarDays,
CheckCircle2,
Clock3,
LogOut,
RefreshCw,
Wrench,
XCircle,
Plus,
ArrowRight,
ClipboardList,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext.jsx";
import {
getMyBookings,
updateBookingStatus,
} from "../services/booking.service.js";
import "./DashboardPage.css";

const dateLabel = (value) => {
if (!value) return "Not scheduled";
const date = new Date(value);
return Number.isNaN(date.getTime())
? "Not scheduled"
: date.toLocaleString();
};

const moneyLabel = (value) => {
if (value == null) return "Price pending";
return `â‚¹${Number(value).toLocaleString("en-IN")}`;
};

export default function DashboardPage() {
const { user, logout } = useAuth();
const navigate = useNavigate();

const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [updatingId, setUpdatingId] = useState(null);

const [reviewRatings, setReviewRatings] = useState({});
const [reviewComments, setReviewComments] = useState({});
const [reviewingId, setReviewingId] = useState(null);
const [reviewMessage, setReviewMessage] = useState("");

const role = String(user?.role || "").toUpperCase();
const isCustomer = role === "CUSTOMER";
const isProvider = role === "PROVIDER";

const loadBookings = useCallback(async () => {
setLoading(true);
setError("");
try {
  const result = await getMyBookings();
  setBookings(Array.isArray(result) ? result : []);
} catch (err) {
  setError(
    err.response?.data?.message ||
      "Could not load bookings. Please check that the backend is running."
  );
} finally {
  setLoading(false);
}
}, []);

useEffect(() => {
loadBookings();
}, [loadBookings]);

const handleStatusUpdate = async (bookingId, status) => {
setUpdatingId(bookingId);
setError("");
try {
  await updateBookingStatus(bookingId, status);
  await loadBookings();
} catch (err) {
  setError(
    err.response?.data?.message || "Could not update this booking."
  );
} finally {
  setUpdatingId(null);
}
};
const handleReviewSubmit = async (booking) => {
  const rating = Number(reviewRatings[booking.id]);
  const comment = reviewComments[booking.id] || "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    setReviewMessage("Please select a rating from 1 to 5 stars.");
    return;
  }

  setReviewingId(booking.id);
  setReviewMessage("");

  try {
    await createReview(booking.id, { rating, comment });
    setReviewMessage("Review submitted successfully.");
    await loadBookings();
  } catch (err) {
    setReviewMessage(
      err.response?.data?.message || "Could not submit your review."
    );
  } finally {
    setReviewingId(null);
  }
};
const handleLogout = async () => {
await logout();
navigate("/login");
};

const pendingCount = bookings.filter(
(booking) => booking.status === "PENDING"
).length;

const completedCount = bookings.filter(
(booking) => booking.status === "COMPLETED"
).length;

const getActions = (booking) => {
if (isProvider) {
if (booking.status === "PENDING") {
return (
<>
<button
type="button"
className="dashboard-action accept"
disabled={updatingId === booking.id}
onClick={() => handleStatusUpdate(booking.id, "ACCEPTED")}
> <CheckCircle2 size={16} /> Accept </button>
<button
type="button"
className="dashboard-action reject"
disabled={updatingId === booking.id}
onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
> <XCircle size={16} /> Reject </button>
</>
);
}
  if (booking.status === "ACCEPTED") {
    return (
      <button
        type="button"
        className="dashboard-action accept"
        disabled={updatingId === booking.id}
        onClick={() => handleStatusUpdate(booking.id, "IN_PROGRESS")}
      >
        <Wrench size={16} /> Start service
      </button>
    );
  }

  if (booking.status === "IN_PROGRESS") {
    return (
      <button
        type="button"
        className="dashboard-action accept"
        disabled={updatingId === booking.id}
        onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
      >
        <CheckCircle2 size={16} /> Mark completed
      </button>
    );
  }
}

if (
  isCustomer &&
  ["PENDING", "ACCEPTED"].includes(booking.status)
) {
  return (
    <button
      type="button"
      className="dashboard-action reject"
      disabled={updatingId === booking.id}
      onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
    >
      <XCircle size={16} /> Cancel booking
    </button>
  );
}

return null;
};

return ( <main className="dashboard-page"> <header className="dashboard-header"> <Link to="/" className="dashboard-brand"> <span className="dashboard-brand-icon"> <Wrench size={20} /> </span> <span>
SmartServe <strong>AI</strong> </span> </Link>
    <div className="dashboard-header-actions">
      <span className="dashboard-role">{role || "USER"}</span>
      <button
        type="button"
        className="dashboard-logout"
        onClick={handleLogout}
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  </header>

  <section className="dashboard-content">
    <div className="dashboard-welcome">
      <div>
        <p className="dashboard-eyebrow">YOUR SMARTSERVE SPACE</p>
        <h1>Welcome, {user?.name || "User"}</h1>
        <p>
          {isProvider
            ? "Manage your services, respond to customer requests, and keep bookings updated."
            : "Find trusted service providers and manage your bookings."}
        </p>
      </div>

      <div className="dashboard-welcome-actions">
        {isCustomer && (
          <Link to="/services" className="dashboard-primary-button">
            <Wrench size={18} /> Browse services
          </Link>
        )}

        {isProvider && (
          <>
            <Link
              to="/provider/services/new"
              className="dashboard-primary-button"
            >
              <Plus size={18} /> Add a service
            </Link>
            <Link to="/services" className="dashboard-secondary-button">
              View services <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </div>

    {isProvider && (
      <section className="dashboard-provider-tools">
        <div className="dashboard-provider-tool-icon">
          <ClipboardList size={23} />
        </div>
        <div>
          <h2>Provider workspace</h2>
          <p>
            Publish a service to make your offering available in the
            catalogue, then manage incoming customer bookings below.
          </p>
        </div>
        <Link to="/provider/services/new">
          Create service <ArrowRight size={16} />
        </Link>
      </section>
    )}

    <div className="dashboard-stats">
      <article className="dashboard-stat">
        <span className="dashboard-stat-icon">
          <CalendarDays size={20} />
        </span>
        <div>
          <p>Total bookings</p>
          <strong>{bookings.length}</strong>
        </div>
      </article>

      <article className="dashboard-stat">
        <span className="dashboard-stat-icon pending">
          <Clock3 size={20} />
        </span>
        <div>
          <p>Pending requests</p>
          <strong>{pendingCount}</strong>
        </div>
      </article>

      <article className="dashboard-stat">
        <span className="dashboard-stat-icon completed">
          <CheckCircle2 size={20} />
        </span>
        <div>
          <p>Completed</p>
          <strong>{completedCount}</strong>
        </div>
      </article>
    </div>

    <section className="dashboard-bookings">
      <div className="dashboard-section-heading">
        <div>
          <h2>{isProvider ? "Service requests" : "My bookings"}</h2>
          <p>
            {isProvider
              ? "Accept requests and update service progress."
              : "Track your service requests from start to finish."}
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={loadBookings}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <div className="dashboard-empty">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-empty-icon">
            <CalendarDays size={26} />
          </span>
          <h3>No bookings yet</h3>
          <p>
            {isProvider
              ? "Customer requests assigned to you will appear here."
              : "Browse available services and make your first booking."}
          </p>

          {isCustomer && (
            <Link to="/services" className="dashboard-primary-button">
              Explore services
            </Link>
          )}

          {isProvider && (
            <Link
              to="/provider/services/new"
              className="dashboard-primary-button"
            >
              <Plus size={18} /> Publish your first service
            </Link>
          )}
        </div>
      ) : (
        <div className="dashboard-booking-list">
          {bookings.map((booking) => (
            <article className="dashboard-booking-card" key={booking.id}>
              <div className="dashboard-booking-top">
                <div className="dashboard-booking-icon">
                  <Wrench size={21} />
                </div>

                <div className="dashboard-booking-title">
                  <h3>{booking.service?.name || "Home service"}</h3>
                  <p>
                    {isProvider
                      ? `Customer: ${booking.customer?.name || "Customer"}`
                      : `Provider: ${booking.provider?.businessName || "To be confirmed"}`}
                  </p>
                </div>

                <span
                  className={`dashboard-status ${String(
                    booking.status || "PENDING"
                  ).toLowerCase()}`}
                >
                  {String(booking.status || "PENDING").replaceAll("_", " ")}
                </span>
              </div>

              <p className="dashboard-booking-description">
                {booking.description}
              </p>

              <div className="dashboard-booking-details">
                <span>
                  <CalendarDays size={15} />
                  {dateLabel(booking.scheduledAt)}
                </span>
                <span>
                  <Wrench size={15} />
                  {booking.address || "Address not provided"}
                </span>
                <strong>{moneyLabel(booking.estimatedPrice)}</strong>
              </div>

              <div className="dashboard-booking-actions">
                {getActions(booking)}
                {updatingId === booking.id && (
                  <span className="dashboard-updating">Updating...</span>
                )}
              </div>
              {isCustomer &&
  booking.status === "COMPLETED" &&
  booking.provider &&
  (booking.review ? (
    <div className="dashboard-review-summary">
      <strong>Reviewed · {"★".repeat(booking.review.rating)}</strong>
      {booking.review.comment && <p>{booking.review.comment}</p>}
    </div>
  ) : (
    <div className="dashboard-review-form">
      <h4>Rate this service</h4>

      <div className="dashboard-star-picker" aria-label="Choose a rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={
              Number(reviewRatings[booking.id]) >= star ? "selected" : ""
            }
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() =>
              setReviewRatings((current) => ({
                ...current,
                [booking.id]: star,
              }))
            }
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={reviewComments[booking.id] || ""}
        onChange={(event) =>
          setReviewComments((current) => ({
            ...current,
            [booking.id]: event.target.value,
          }))
        }
        placeholder="Share your experience (optional)"
        maxLength={2000}
        rows={3}
      />

      <button
        type="button"
        className="dashboard-primary-button"
        disabled={reviewingId === booking.id}
        onClick={() => handleReviewSubmit(booking)}
      >
        {reviewingId === booking.id ? "Submitting..." : "Submit review"}
      </button>
    </div>
  ))}
            </article>
          ))}
        </div>
      )}
    </section>

    <p className="dashboard-account-info">
      Signed in as <strong>{user?.email}</strong>
    </p>
  </section>
</main>
);
}