
import { prisma } from "../../config/database.js";

export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function getServices(req, res, next) {
  try {
    const { category, search } = req.query;

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(category
          ? { category: { slug: String(category), isActive: true } }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: "insensitive" } },
                {
                  description: {
                    contains: String(search),
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        provider: { isAvailable: true },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            serviceArea: true,
            isVerified: true,
            isAvailable: true,
            averageRating: true,
            totalReviews: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, services });
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : null;
    const categoryId = req.body.categoryId;
    const rawPrice = req.body.basePrice;

    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Service name must contain 2 to 120 characters.",
      });
    }

    if (typeof categoryId !== "string" || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "A service category is required.",
      });
    }

    if (description && description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 2000 characters.",
      });
    }

    let basePrice = null;

    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
      basePrice = Number(rawPrice);

      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Base price must be a valid non-negative number.",
        });
      }
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (!provider) {
      return res.status(403).json({
        success: false,
        message: "Create your provider profile before listing services.",
      });
    }

    const category = await prisma.serviceCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "The selected category is unavailable.",
      });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        basePrice,
        providerId: provider.id,
        categoryId: category.id,
      },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service,
    });
  } catch (error) {
    next(error);
  }
}