
import { prisma } from "../../config/database.js";

export async function createReview(req, res, next) {
  try {
    const { bookingId } = req.params;
    const rating = Number(req.body.rating);
    const comment =
      typeof req.body.comment === "string" ? req.body.comment.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5.",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Review cannot exceed 2000 characters.",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerId: true,
        providerId: true,
        status: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own bookings.",
      });
    }

    if (booking.status !== "COMPLETED") {
      return res.status(409).json({
        success: false,
        message: "Only completed bookings can be reviewed.",
      });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        rating,
        comment: comment || null,
      },
    });

    const aggregate = await prisma.review.aggregate({
      where: {
        providerId: booking.providerId,
        status: "VISIBLE",
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.providerProfile.update({
      where: { id: booking.providerId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This booking has already been reviewed.",
      });
    }

    next(error);
  }
}

export async function getProviderReviews(req, res, next) {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: req.params.providerId },
      select: { id: true },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        providerId: provider.id,
        status: "VISIBLE",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        customer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
}