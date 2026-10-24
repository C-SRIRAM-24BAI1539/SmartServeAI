
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Wrench } from "lucide-react";
import { getServices } from "../services/service.service.js";
import { createBooking } from "../services/booking.service.js";
import { useAuth } from "../features/auth/AuthContext.jsx";
import "./BookingPage.css";

function unwrapServices(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.services)) return result.services;
  return [];
}

export default function BookingPage() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadService() {
      try {
        const result = unwrapServices(await getServices());
        if (active) {
          setService(result.find((item) => item.id === serviceId) ?? null);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Could not load this service.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadService();
    return () => {
      active = false;
    };
  }, [serviceId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (user?.role !== "CUSTOMER") {
      setError("Only customer accounts can create bookings.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please describe your problem using at least 10 characters.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Please enter your complete service address.");
      return;
    }

    if (scheduledAt && new Date(scheduledAt) <= new Date()) {
      setError("Please choose a future date and time.");
      return;
    }

    setSubmitting(true);

    try {
      await createBooking({
        serviceId,
        description: description.trim(),
        address: address.trim(),
        ...(scheduledAt
          ? { scheduledAt: new Date(scheduledAt).toISOString() }
          : {}),
      });

      navigate("/dashboard", {
        state: { message: "Your booking request was submitted successfully." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create your booking."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="booking-shell"><p>Loading service...</p></main>;
  }

  if (!service) {
    return (
      <main className="booking-shell">
        <h2>Service unavailable</h2>
        <p>This service may have been removed or is no longer available.</p>
        <Link to="/services">Browse services</Link>
      </main>
    );
  }

  if (user?.role !== "CUSTOMER") {
    return (
      <main className="booking-shell">
        <h2>Customer account required</h2>
        <p>Sign in with a customer account to request a home service.</p>
        <Link to="/services">Return to services</Link>
      </main>
    );
  }

  const price = service.basePrice ?? service.price;

  return (
    <main className="booking-shell">
      <Link to="/services" className="booking-back">
        <ArrowLeft size={17} /> Back to services
      </Link>

      <div className="booking-layout">
        <section className="booking-form-panel">
          <span className="booking-eyebrow">SERVICE REQUEST</span>
          <h1>Book a service</h1>
          <p className="booking-intro">
            Tell us what needs attention. Your provider will review the request.
          </p>

          {error && <div className="booking-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="problem-description">
              Describe your problem
              <textarea
                id="problem-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minLength={10}
                maxLength={3000}
                rows={5}
                placeholder="For example: The kitchen tap is leaking from its base..."
                required
              />
              <span className="booking-hint">
                {description.length}/3000 characters (minimum 10)
              </span>
            </label>

            <label htmlFor="service-address">
              <span className="booking-label-icon"><MapPin size={16} /> Service address</span>
              <textarea
                id="service-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="House number, street, area, city"
                required
              />
            </label>

            <label htmlFor="scheduled-at">
              <span className="booking-label-icon">
                <CalendarDays size={16} /> Preferred date and time
              </span>
              <input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
              <span className="booking-hint">
                Optional. Leave blank if you have no preferred time.
              </span>
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting request..." : "Confirm booking"}
            </button>
          </form>
        </section>

        <aside className="booking-summary">
          <span className="booking-summary-icon"><Wrench size={25} /></span>
          <span className="booking-eyebrow">YOUR SELECTED SERVICE</span>
          <h2>{service.name ?? service.title}</h2>
          <p>{service.description || "Professional home service."}</p>

          {service.category?.name && (
            <div className="booking-summary-row">
              <span>Category</span>
              <strong>{service.category.name}</strong>
            </div>
          )}

          <div className="booking-summary-row">
            <span>Listed base price</span>
            <strong>
              {price == null
                ? "To be confirmed"
                : `₹${Number(price).toLocaleString("en-IN")}`}
            </strong>
          </div>

          <p className="booking-disclaimer">
            The displayed base price is an estimate. Confirm the final cost
            with the service provider before work begins.
          </p>
        </aside>
      </div>
    </main>
  );
}