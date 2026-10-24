
import { prisma } from "../../config/database.js";

export async function getProviders(req, res, next) {
  try {
    const providers = await prisma.providerProfile.findMany({
      where: {
        isAvailable: true,
        user: { isActive: true },
      },
      select: {
        id: true,
        businessName: true,
        description: true,
        serviceArea: true,
        isVerified: true,
        isAvailable: true,
        averageRating: true,
        totalReviews: true,
        user: { select: { name: true } },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            basePrice: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [{ isVerified: "desc" }, { averageRating: "desc" }],
    });

    res.json({ success: true, providers });
  } catch (error) {
    next(error);
  }
}

export async function updateProviderProfile(req, res, next) {
  try {
    const { businessName, description, serviceArea, isAvailable } = req.body;

    const data = {};

    if (businessName !== undefined) {
      if (
        typeof businessName !== "string" ||
        businessName.trim().length < 2 ||
        businessName.trim().length > 120
      ) {
        return res.status(400).json({
          success: false,
          message: "Business name must contain 2 to 120 characters.",
        });
      }

      data.businessName = businessName.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Description must be text up to 2000 characters.",
        });
      }

      data.description = description.trim() || null;
    }

    if (serviceArea !== undefined) {
      if (typeof serviceArea !== "string" || serviceArea.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Service area must be text up to 200 characters.",
        });
      }

      data.serviceArea = serviceArea.trim() || null;
    }

    if (isAvailable !== undefined) {
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be true or false.",
        });
      }

      data.isAvailable = isAvailable;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update.",
      });
    }

    const existing = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const provider = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data,
    });

    res.json({
      success: true,
      message: "Provider profile updated.",
      provider,
    });
  } catch (error) {
    next(error);
  }
}