
import { prisma } from "../../config/database.js";
import { classifyRequest } from "./request-classifier.js";

// These are candidate category slugs, not claims that every category
// exists in the database. Prisma will return only actual matching records.
const categorySlugMap = {
  plumbing: ["plumbing"],
  electrical: ["electrical", "electrical-repair"],
  "ac-servicing": ["ac-servicing", "ac-service", "air-conditioning"],
  carpentry: ["carpentry"],
  "appliance-repair": ["appliance-repair", "appliance-servicing"],
  other: ["other", "home-maintenance", "general-maintenance"],
};

const chennaiLocalities = [
  "chromepet",
  "velachery",
  "mylapore",
  "adyar",
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function areaMatches(providerArea, requestedArea) {
  if (!requestedArea) return true;

  const provider = normalize(providerArea);
  const requested = normalize(requestedArea);

  if (!provider) return false;

  if (provider.includes(requested) || requested.includes(provider)) {
    return true;
  }

  if (requested === "chennai") {
    return (
      provider.includes("chennai") ||
      chennaiLocalities.some((locality) => provider.includes(locality))
    );
  }

  return false;
}

function calculateExpertiseMatch(service, classification, description) {
  const serviceText = normalize(
    `${service.name} ${service.description ?? ""}`,
  );

  // Prioritize words describing the identified item and issue.
  // Include the original description as additional matching context.
  const relevantText = normalize(
    `${classification.affectedItem ?? ""} ${
      classification.issue ?? ""
    } ${description}`,
  );

  const words = relevantText
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  const uniqueWords = [...new Set(words)];

  if (uniqueWords.length === 0) return 0;

  const matches = uniqueWords.filter((word) =>
    serviceText.includes(word),
  ).length;

  return Math.min(matches / Math.min(uniqueWords.length, 5), 1);
}

function matchesSpecificFault(service, faultType) {
  const text = normalize(
    `${service.name} ${service.description ?? ""}`
  );

  const rules = {
    remote_pairing: [
      "electronics",
      "electronic",
      "remote",
      "control",
      "connection",
      "pairing",
    ],
    water_flow: [
      "plumbing",
      "bathroom",
      "water connection",
      "water flow",
      "pipe",
      "tap",
      "drainage",
    ],
    insufficient_heating: [
      "electrical",
      "heater",
      "heating",
      "geyser",
      "water heater",
      "appliance",
      "fault repair",
    ],
    ac_not_cooling: [
      "ac cooling",
      "cooling repair",
      "not cool",
      "cooling problem",
    ],
    ac_water_leak: [
      "ac water leakage",
      "water leakage",
      "ac leak",
    ],
    electrical_fault: [
      "electrical",
      "switch",
      "socket",
      "wiring",
      "lighting",
    ],
    plumbing_fault: [
      "plumbing",
      "pipe",
      "tap",
      "drainage",
      "water leakage",
    ],
    carpentry_fault: [
      "furniture",
      "door",
      "hinge",
      "cabinet",
      "carpentry",
    ],
    appliance_fault: [
      "repair",
      "electronics",
      "appliance",
    ],
    routine_maintenance: [
      "servicing",
      "maintenance",
      "inspection",
    ],
  };

  const keywords = rules[faultType];

  // Unknown/general requests retain the existing category behaviour.
  if (!keywords) return true;

  return keywords.some((keyword) => text.includes(keyword));
}


export async function recommendProviders(req, res, next) {
  try {
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    const serviceArea =
      typeof req.body.serviceArea === "string"
        ? req.body.serviceArea.trim()
        : "";

    const rawMaxPrice = req.body.maxPrice;

    if (description.length < 5 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Problem description must contain 5 to 1000 characters.",
      });
    }

    if (serviceArea.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Service area cannot exceed 200 characters.",
      });
    }

    let maxPrice = null;

    if (
      rawMaxPrice !== undefined &&
      rawMaxPrice !== null &&
      rawMaxPrice !== ""
    ) {
      maxPrice = Number(rawMaxPrice);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum price must be a valid non-negative number.",
        });
      }
    }

    // Step 1: Understand the user's natural-language problem with Ollama.
    const classification = await classifyRequest(description);

    if (!classification) {
      return res.status(422).json({
        success: false,
        message:
          "We could not identify this problem. Please describe what is going wrong.",
        classification: null,
        recommendations: [],
      });
    }

    // Step 2: Do not recommend home-service providers for unrelated
    // requests or unclear descriptions.
    if (
      !classification.isHomeService ||
      classification.needsClarification ||
      !classification.serviceCategory ||
      classification.serviceCategory === "none"
    ) {
      return res.json({
        success: true,
        classification,
        filters: {
          serviceArea: serviceArea || null,
          maxPrice,
        },
        eligibleCount: 0,
        recommendations: [],
        note:
          classification.userMessage ||
          "Please describe your home-service problem more clearly.",
      });
    }

    // Step 3: Safety takes priority over ordinary booking recommendations.
    if (classification.safetyWarning?.trim()) {
      return res.json({
        success: true,
        classification,
        filters: {
          serviceArea: serviceArea || null,
          maxPrice,
        },
        eligibleCount: 0,
        recommendations: [],
        note: classification.safetyWarning,
      });
    }

    // Step 4: Translate the AI category into candidate database category
    // slugs. Do not rely on problemType matching an old regex rule.
    const categorySlugs =
      categorySlugMap[classification.serviceCategory];

    if (!categorySlugs) {
      return res.json({
        success: true,
        classification,
        filters: {
          serviceArea: serviceArea || null,
          maxPrice,
        },
        eligibleCount: 0,
        recommendations: [],
        note:
          "This service category is not supported yet. Please try another home-service description.",
      });
    }

    // Step 5: Retrieve actual active services and available providers.
    // All displayed recommendations must come from the database.
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        category: {
          slug: {
            in: categorySlugs,
          },
          isActive: true,
        },
        provider: {
          isAvailable: true,
          user: {
            isActive: true,
          },
        },
        ...(maxPrice !== null
          ? {
              basePrice: {
                not: null,
                lte: maxPrice,
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            description: true,
            serviceArea: true,
            isVerified: true,
            averageRating: true,
            totalReviews: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // The AI selects the broad service category. The database determines
    // which services exist; the area filter is applied to provider profiles.
    const areaEligibleServices = services.filter((service) =>
  areaMatches(service.provider.serviceArea, serviceArea),
);

const eligibleServices = areaEligibleServices.filter((service) =>
  matchesSpecificFault(service, classification.faultType),
);

    if (eligibleServices.length === 0) {
  return res.json({
    success: true,
    classification,
    filters: { serviceArea: serviceArea || null, maxPrice },
    eligibleCount: 0,
    recommendations: [],
    note:
      areaEligibleServices.length === 0
        ? "We understood your problem, but no available providers were found for these filters. Try another area or remove the maximum-price filter."
        : "We understood the specific fault, but the current service catalogue has no sufficiently relevant service for it. Please try another description or add a suitable service to the catalogue.",
  });
}

    const prices = eligibleServices
      .map((service) =>
        service.basePrice === null ? null : Number(service.basePrice),
      )
      .filter((price) => price !== null && Number.isFinite(price));

    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxEligiblePrice = prices.length ? Math.max(...prices) : 0;

    // Step 6: Preserve the existing provider-ranking approach.
    const recommendations = eligibleServices.map((service) => {
      const provider = service.provider;
      const rating = Number(provider.averageRating ?? 0);
      const reviewCount = Math.max(0, provider.totalReviews ?? 0);
      const price =
        service.basePrice === null ? null : Number(service.basePrice);

      const ratingScore =
        (Math.min(Math.max(rating, 0), 5) / 5) * 35;

      const reviewConfidence =
        (reviewCount / (reviewCount + 10)) * 20;

      const verificationScore = provider.isVerified ? 10 : 0;

      const expertiseScore =
        calculateExpertiseMatch(service, classification, description) * 20;

      let priceScore = 7.5;

      if (price !== null && maxEligiblePrice > minPrice) {
        priceScore =
          ((maxEligiblePrice - price) /
            (maxEligiblePrice - minPrice)) *
          15;
      } else if (price !== null && maxEligiblePrice === minPrice) {
        priceScore = 15;
      }

      const rankingScore = Number(
        (
          ratingScore +
          reviewConfidence +
          verificationScore +
          expertiseScore +
          priceScore
        ).toFixed(2),
      );

      const reasons = [];

      if (provider.isVerified) reasons.push("Verified provider");
      if (rating > 0) reasons.push(`${rating.toFixed(1)}/5 profile rating`);
      if (reviewCount > 0) {
        reasons.push(`${reviewCount} reported reviews`);
      }
      if (price !== null) reasons.push("Listed service price");

      return {
        serviceId: service.id,
        serviceName: service.name,
        serviceDescription: service.description,
        basePrice: price,
        category: service.category,
        rankingScore,
        reasons,
        provider: {
          id: provider.id,
          businessName: provider.businessName,
          name: provider.user.name,
          description: provider.description,
          serviceArea: provider.serviceArea,
          isVerified: provider.isVerified,
          averageRating: rating,
          totalReviews: reviewCount,
        },
      };
    });

    recommendations.sort(
      (a, b) =>
        b.rankingScore - a.rankingScore ||
        (a.basePrice ?? Infinity) - (b.basePrice ?? Infinity),
    );

    return res.json({
      success: true,
      classification,
      filters: {
        serviceArea: serviceArea || null,
        maxPrice,
      },
      eligibleCount: recommendations.length,
      recommendations: recommendations.slice(0, 10),
      note:
        "AI classifies the problem category. Available services are verified against the database, and providers are ranked using profile ratings, reviews, verification, price, and textual expertise matching.",
    });
  } catch (error) {
    next(error);
  }
}
