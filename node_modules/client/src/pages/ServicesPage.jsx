
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Wrench,
  Zap,
  Wind,
  Hammer,
  Refrigerator,
  House,
  ArrowRight,
  RefreshCw,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import {
  getServiceCategories,
  getServices,
} from "../services/service.service.js";
import { recommendProviders } from "../services/recommendation.service.js";
import { useAuth } from "../features/auth/AuthContext.jsx";
import "./ServicesPage.css";

const iconMap = {
  plumbing: Wrench,
  electrical: Zap,
  "ac-servicing": Wind,
  carpentry: Hammer,
  "appliance-repair": Refrigerator,
  other: House,
};

function getArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function formatPrice(service) {
  const price = service.price ?? service.basePrice ?? service.priceFrom;

  if (price === undefined || price === null || price === "") {
    return "Price on request";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price on request";
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
}

function formatProblemType(value) {
  if (!value) return "";
  return String(value).replaceAll("_", " ");
}

export default function ServicesPage() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Problem-based recommendation state
  const [problem, setProblem] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [classification, setClassification] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCatalogue() {
      setLoading(true);
      setError("");

      try {
        const [categoryResult, serviceResult] = await Promise.all([
          getServiceCategories(),
          getServices(),
        ]);

        if (!active) return;

        setCategories(getArray(categoryResult));
        setServices(getArray(serviceResult));
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load services. Check that the backend is running."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCatalogue();

    return () => {
      active = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return services.filter((service) => {
      const categorySlug =
        service.category?.slug ?? service.categorySlug ?? "";
      const categoryName =
        service.category?.name ?? service.categoryName ?? "";

      const matchesCategory =
        selectedCategory === "all" ||
        categorySlug === selectedCategory ||
        String(categoryName).toLowerCase() === selectedCategory;

      const searchableText = [
        service.name,
        service.title,
        service.description,
        categoryName,
        service.provider?.businessName,
        service.providerProfile?.businessName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(term);
    });
  }, [services, search, selectedCategory]);

  async function handleRecommend(event) {
    event.preventDefault();

    const description = problem.trim();

    if (description.length < 5) {
      setRecommendationError(
        "Please describe your problem using at least 5 characters."
      );
      return;
    }

    setRecommendationLoading(true);
    setRecommendationError("");
    setRecommendations([]);
    setClassification(null);

    try {
      const result = await recommendProviders({ description });

      setRecommendations(
        Array.isArray(result?.recommendations)
          ? result.recommendations
          : []
      );
      setClassification(result?.classification ?? null);

      if (!result?.recommendations?.length) {
        setRecommendationError(
          "No matching providers were found. Try describing the problem differently."
        );
      }
    } catch (err) {
      setRecommendationError(
        err.response?.data?.message ||
          "Unable to get recommendations. Check that the backend is running and the recommendations route is available."
      );
    } finally {
      setRecommendationLoading(false);
    }
  }

  function clearRecommendations() {
    setRecommendations([]);
    setClassification(null);
    setRecommendationError("");
    setProblem("");
  }

  return (
    <main className="services-page">
      <header className="services-topbar">
        <Link to="/" className="services-brand">
          <span className="services-brand-icon">
            <House size={21} />
          </span>
          <span>
            SmartServe<span className="brand-ai"> AI</span>
          </span>
        </Link>

        <nav className="services-nav">
          <Link to="/">Home</Link>
          <Link to="/services" className="active">
            Services
          </Link>
          {user ? (
            <Link to="/dashboard" className="services-account">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="services-account">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <section className="services-hero">
        <div className="services-hero-content">
          <span className="services-eyebrow">
            YOUR HOME, IN GOOD HANDS
          </span>

          <h1>
            What can we help
            <br />
            you <span>fix today?</span>
          </h1>

          <p>
            Find the right professional for your home repairs and maintenance,
            all in one place.
          </p>

          <label className="services-search">
            <Search size={21} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try plumbing, AC repair, electrical..."
              aria-label="Search services"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </label>

          <form className="ai-problem-form" onSubmit={handleRecommend}>
            <div className="ai-problem-heading">
              <Sparkles size={19} />
              <span>
                Describe your problem — we&apos;ll find the right professional
              </span>
            </div>

            <div className="ai-problem-input-row">
              <input
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="e.g. My AC is running but not cooling..."
                aria-label="Describe your home service problem"
                minLength={5}
                maxLength={1000}
                required
              />

              <button type="submit" disabled={recommendationLoading}>
                {recommendationLoading ? (
                  "Finding..."
                ) : (
                  <>
                    Find providers <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>

            <p>
              Get service suggestions based on your problem and available
              provider information.
            </p>
          </form>
        </div>

        <div className="services-hero-art" aria-hidden="true">
          <div className="hero-art-circle">
            <House size={100} strokeWidth={1.15} />
          </div>
          <span className="hero-art-tool tool-one">
            <Wrench size={25} />
          </span>
          <span className="hero-art-tool tool-two">
            <Zap size={25} />
          </span>
          <span className="hero-art-tool tool-three">
            <Hammer size={25} />
          </span>
        </div>
      </section>

      <section className="services-content">
        {(recommendations.length > 0 ||
          recommendationLoading ||
          recommendationError) && (
          <section className="ai-recommendations">
            <div className="ai-results-heading">
              <div>
                <span className="services-eyebrow">
                  SMART RECOMMENDATIONS
                </span>
                <h2>Professionals for your problem</h2>

                {classification?.problemType && (
                  <p className="ai-classification">
                    Identified problem:{" "}
                    {formatProblemType(classification.problemType)}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="ai-clear-button"
                onClick={clearRecommendations}
              >
                Clear results
              </button>
            </div>

            {recommendationLoading && (
              <p className="ai-results-message" role="status">
                Finding suitable professionals...
              </p>
            )}

            {recommendationError && (
              <p className="ai-results-error" role="alert">
                {recommendationError}
              </p>
            )}

            {recommendations.length > 0 && (
              <div className="services-grid ai-services-grid">
                {recommendations.map((item, index) => {
                  const providerName =
                    item.provider?.businessName ||
                    item.provider?.name ||
                    item.provider?.user?.name ||
                    "Service provider";

                  const rating = Number(
                    item.provider?.averageRating ?? 0
                  );
                  const reviewCount = Number(
                    item.provider?.totalReviews ?? 0
                  );
                  const price = item.basePrice;

                  const serviceId = item.serviceId ?? item.id;
                  const serviceName =
                    item.serviceName ?? item.name ?? "Recommended service";

                  return (
                    <article
                      className="service-card ai-recommendation-card"
                      key={serviceId ?? `${serviceName}-${index}`}
                    >
                      <div className="service-card-top">
                        <span className="service-icon">
                          <Sparkles size={25} strokeWidth={1.8} />
                        </span>
                        <span className="service-category">
                          {item.category?.name ??
                            item.categoryName ??
                            "Recommended service"}
                        </span>
                      </div>

                      <h3>{serviceName}</h3>

                      <p className="service-description">
                        {item.serviceDescription ||
                          item.description ||
                          "A service matching the problem you described."}
                      </p>

                      <div className="service-provider">
                        <span className="provider-avatar">
                          {providerName.charAt(0).toUpperCase()}
                        </span>

                        <div className="service-provider-info">
                          <span className="service-provider-name">
                            {providerName}
                          </span>

                          <span className="service-provider-rating">
                            {rating > 0 ? (
                              <>
                                <span className="service-rating-star">
                                  ★
                                </span>
                                {rating.toFixed(1)}
                                <span className="service-review-count">
                                  ({reviewCount} reviews)
                                </span>
                              </>
                            ) : (
                              <span className="service-review-count">
                                No reviews yet
                              </span>
                            )}
                          </span>

                          {item.provider?.isVerified && (
                            <span className="ai-verified-label">
                              Verified provider
                            </span>
                          )}
                        </div>
                      </div>

                      {Array.isArray(item.reasons) &&
                        item.reasons.length > 0 && (
                          <p className="ai-recommendation-reasons">
                            {item.reasons.join(" · ")}
                          </p>
                        )}

                      <div className="service-card-bottom">
                        <div className="service-price">
                          <span>Starting from</span>
                          <strong>
                            {price === null ||
                            price === undefined ||
                            price === ""
                              ? "Price on request"
                              : `₹${Number(price).toLocaleString("en-IN")}`}
                          </strong>
                        </div>

                        {user?.role === "PROVIDER" ? (
                          <Link
                            to="/dashboard"
                            className="service-book-link"
                          >
                            Dashboard <ArrowRight size={16} />
                          </Link>
                        ) : serviceId ? (
                          <Link
                            to={user ? `/book/${serviceId}` : "/login"}
                            className="service-book-link"
                          >
                            Book now <ArrowRight size={16} />
                          </Link>
                        ) : (
                          <span className="ai-booking-unavailable">
                            Booking unavailable
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="services-section-heading">
          <div>
            <span className="services-eyebrow">EXPLORE OUR SERVICES</span>
            <h2>How can we help?</h2>
            <p>Choose a category or browse available services.</p>
          </div>

          <span className="services-count">
            {loading ? "Loading..." : `${filteredServices.length} services`}
          </span>
        </div>

        <div className="category-filters">
          <button
            type="button"
            className={selectedCategory === "all" ? "selected" : ""}
            onClick={() => setSelectedCategory("all")}
          >
            All services
          </button>

          {categories.map((category) => {
            const slug = category.slug ?? category.id;

            return (
              <button
                type="button"
                key={category.id ?? slug}
                className={selectedCategory === slug ? "selected" : ""}
                onClick={() => setSelectedCategory(slug)}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="services-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="services-state">
            <span className="services-loader" />
            <p>Finding available services...</p>
          </div>
        ) : !error && filteredServices.length === 0 ? (
          <div className="services-empty">
            <span className="empty-icon">
              <Wrench size={28} />
            </span>
            <h3>No matching services yet</h3>
            <p>
              {search
                ? "Try a different search or clear your filters."
                : "There are currently no services available in this category."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
            >
              Show all services
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {filteredServices.map((service) => {
              const slug =
                service.category?.slug ??
                service.categorySlug ??
                "other";

              const ServiceIcon = iconMap[slug] ?? Wrench;
              const serviceName =
                service.name ?? service.title ?? "Home service";

              const providerName =
                service.provider?.businessName ??
                service.providerProfile?.businessName ??
                service.provider?.user?.name ??
                "Verified service provider";

              const rating = Number(
                service.provider?.averageRating ??
                  service.providerProfile?.averageRating ??
                  0
              );

              const reviewCount = Number(
                service.provider?.totalReviews ??
                  service.providerProfile?.totalReviews ??
                  0
              );

              return (
                <article className="service-card" key={service.id}>
                  <div className="service-card-top">
                    <span className="service-icon">
                      <ServiceIcon size={25} strokeWidth={1.8} />
                    </span>

                    <span className="service-category">
                      {service.category?.name ??
                        service.categoryName ??
                        "Home service"}
                    </span>
                  </div>

                  <h3>{serviceName}</h3>

                  <p className="service-description">
                    {service.description ||
                      "Professional home service to help keep your home running smoothly."}
                  </p>

                  <div className="service-provider">
                    <span className="provider-avatar">
                      {providerName.charAt(0).toUpperCase()}
                    </span>

                    <div className="service-provider-info">
                      <span className="service-provider-name">
                        {providerName}
                      </span>

                      <span className="service-provider-rating">
                        {rating > 0 ? (
                          <>
                            <span className="service-rating-star">★</span>
                            {rating.toFixed(1)}
                            <span className="service-review-count">
                              ({reviewCount} reviews)
                            </span>
                          </>
                        ) : (
                          <span className="service-review-count">
                            No reviews yet
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="service-card-bottom">
                    <div className="service-price">
                      <span>Starting from</span>
                      <strong>{formatPrice(service)}</strong>
                    </div>

                    {user?.role === "PROVIDER" ? (
                      <Link
                        to="/dashboard"
                        className="service-book-link"
                      >
                        Dashboard <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link
                        to={user ? `/book/${service.id}` : "/login"}
                        className="service-book-link"
                      >
                        Book now <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="services-help-banner">
          <div className="services-help-icon">
            <CalendarDays size={25} />
          </div>

          <div>
            <h3>Not sure which service you need?</h3>
            <p>
              Describe your issue in the recommendation box above to find
              a suitable service.
            </p>
          </div>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              document
                .querySelector(".ai-problem-form input")
                ?.focus();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Find a service <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <footer className="services-footer">
        <Link to="/" className="services-brand">
          <span className="services-brand-icon">
            <House size={18} />
          </span>
          <span>
            SmartServe<span className="brand-ai"> AI</span>
          </span>
        </Link>

        <span>Making home services simpler.</span>
      </footer>
    </main>
  );
}
