
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, House, Plus, Wrench } from "lucide-react";
import { getServiceCategories, createService } from "../services/service.service.js";
import { useAuth } from "../features/auth/AuthContext.jsx";
import "./ProviderServicesPage.css";

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    basePrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getServiceCategories()
      .then((result) => {
        const list = Array.isArray(result)
          ? result
          : result?.categories ?? result?.items ?? [];
        setCategories(list);
      })
      .catch(() => setError("Could not load service categories."));
  }, []);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.categoryId) {
      setError("Please select a service category.");
      return;
    }

    if (Number(form.basePrice) < 0 || form.basePrice === "") {
      setError("Enter a valid service price.");
      return;
    }

    setLoading(true);

    try {
      await createService({
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
      });

      setSuccess("Your service was published successfully.");
      setForm({
        name: "",
        categoryId: "",
        description: "",
        basePrice: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not publish the service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (user?.role !== "PROVIDER") {
    return (
      <main className="provider-service-page">
        <div className="provider-service-panel">
          <h2>Provider access required</h2>
          <Link to="/dashboard">Return to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="provider-service-page">
      <header className="provider-service-header">
        <Link to="/" className="provider-service-brand">
          <House size={23} /> SmartServe <span>AI</span>
        </Link>
        <Link to="/dashboard" className="provider-back-link">
          <ArrowLeft size={17} /> Dashboard
        </Link>
      </header>

      <section className="provider-service-content">
        <div className="provider-service-heading">
          <span className="provider-service-kicker">PROVIDER WORKSPACE</span>
          <h1>Publish a service</h1>
          <p>Tell customers what you offer and what they can expect to pay.</p>
        </div>

        <form className="provider-service-form" onSubmit={handleSubmit}>
          <div className="provider-form-icon">
            <Wrench size={27} />
          </div>

          <label>
            Service name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="e.g. Home plumbing repair"
              minLength={3}
              maxLength={100}
              required
            />
          </label>

          <label>
            Category
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={updateField}
              required
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Describe the work included in this service..."
              minLength={10}
              maxLength={2000}
              rows={5}
              required
            />
          </label>

          <label>
            Starting price (₹)
            <input
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={updateField}
              placeholder="e.g. 500"
              min="0"
              step="1"
              required
            />
          </label>

          {error && <p className="provider-form-error">{error}</p>}

          {success && (
            <p className="provider-form-success">
              <CheckCircle2 size={18} /> {success}
            </p>
          )}

          <button type="submit" disabled={loading}>
            <Plus size={18} />
            {loading ? "Publishing..." : "Publish service"}
          </button>

          <button
            type="button"
            className="provider-secondary-button"
            onClick={() => navigate("/services")}
          >
            View service catalogue
          </button>
        </form>
      </section>
    </main>
  );
}