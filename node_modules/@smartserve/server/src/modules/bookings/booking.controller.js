
import { prisma } from "../../config/database.js";

export async function createBooking(req, res, next) {
  try {
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";
    const address =
      typeof req.body.address === "string" ? req.body.address.trim() : "";
    const serviceId = req.body.serviceId;
    const rawScheduledAt = req.body.scheduledAt;

    if (description.length < 10 || description.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Describe the problem in 10 to 3000 characters.",
      });
    }

    if (address.length < 5 || address.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid service address.",
      });
    }

    if (typeof serviceId !== "string" || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Select a service before booking.",
      });
    }

    let scheduledAt = null;

    if (rawScheduledAt !== undefined && rawScheduledAt !== null && rawScheduledAt !== "") {
      scheduledAt = new Date(rawScheduledAt);

      if (
        typeof rawScheduledAt !== "string" ||
        Number.isNaN(scheduledAt.getTime()) ||
        scheduledAt <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be a valid future date and time.",
        });
      }
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        isActive: true,
        provider: {
          isAvailable: true,
          user: { isActive: true },
        },
      },
      select: {
        id: true,
        providerId: true,
        basePrice: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Selected service is unavailable.",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        providerId: service.providerId,
        serviceId: service.id,
        description,
        address,
        scheduledAt,
        estimatedPrice: service.basePrice,
      },
      include: {
        service: { select: { id: true, name: true } },
        provider: {
          select: { id: true, businessName: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Booking request created.",
      booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    let where = {};

    if (req.user.role === "CUSTOMER") {
      where = { customerId: req.user.id };
    } else if (req.user.role === "PROVIDER") {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!profile) {
        return res.json({ success: true, bookings: [] });
      }

      where = { providerId: profile.id };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { 
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        customer: {
          select: { id: true, name: true },
        },
        service: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true, slug: true } },
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses =
      req.user.role === "CUSTOMER"
        ? ["CANCELLED"]
        : ["ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "That status change is not allowed for your role.",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      req.user.role === "CUSTOMER" &&
      booking.customerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot modify another customer's booking.",
      });
    }

    if (req.user.role === "PROVIDER") {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!profile || booking.providerId !== profile.id) {
        return res.status(403).json({
          success: false,
          message: "This booking is not assigned to your profile.",
        });
      }
    }

    const transitions = {
      PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
      ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED"],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!transitions[booking.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change booking from ${booking.status} to ${status}.`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: "Booking status updated.",
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
}