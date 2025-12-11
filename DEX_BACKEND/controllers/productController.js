import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ======================== CREATE PRODUCT (Supports Hostels) ========================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      subCategory,
      price,
      stock,
      description,
      isHostel,
      location,
      caretakerPhone,
      roomType,
      availability,
      distanceFromCampus,
      amenities,
    } = req.body;

    if (!name || !category || !price) {
      return res
        .status(400)
        .json({ message: "Name, category and price are required" });
    }

    const imagePaths =
      req.files?.length > 0
        ? req.files.map((file) => `/uploads/products/${file.filename}`)
        : [];

    if (imagePaths.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const isHostelBool = isHostel === "true" || isHostel === true;

    // Safe amenities parsing
    let parsedAmenities = [];
    if (isHostelBool && amenities) {
      try {
        parsedAmenities = Array.isArray(amenities)
          ? amenities
          : JSON.parse(amenities || "[]");
      } catch (e) {
        parsedAmenities = [];
      }
    }

    let detailsData = null;
    if (!isHostelBool && req.body.details) {
      try {
        if (typeof req.body.details === "string") {
          const parsed = JSON.parse(req.body.details);
          // Validate that parsed object is a plain object and not array or other dangerous types
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && 
              parsed.constructor === Object) {
            detailsData = parsed;
          }
        } else if (req.body.details && typeof req.body.details === "object" && 
                   !Array.isArray(req.body.details) && req.body.details.constructor === Object) {
          detailsData = req.body.details;
        }
      } catch (err) {
        detailsData = null;
      }
    }

    const productData = {
      name,
      category: isHostelBool ? "Hostels" : category,
      subCategory: isHostelBool ? null : subCategory || null,
      price: parseFloat(price),
      stock: isHostelBool ? null : parseInt(stock || 0),
      description: description || null,
      images: imagePaths,
      deployed: false,
      seller: { connect: { id: req.user.id } },
      isHostel: isHostelBool,
      location: isHostelBool ? location : null,
      caretakerPhone: isHostelBool ? caretakerPhone : null,
      roomType: isHostelBool ? roomType : null,
      availability: isHostelBool ? availability || "Available Now" : null,
      distanceFromCampus:
        isHostelBool && distanceFromCampus
          ? parseFloat(distanceFromCampus)
          : null,
      amenities: parsedAmenities,
      ...(isHostelBool
        ? { bookingStatus: "available" }
        : { bookingStatus: "none" }),
      bookedBy: null,
      bookedAt: null,
      bookingNotes: null,
      details: detailsData,
    };

    const product = await prisma.product.create({ data: productData });
    res.status(201).json(product);
  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== UPDATE PRODUCT (Supports Hostels) – FULLY FIXED ========================
export const updateProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const {
      name,
      category,
      subCategory,
      price,
      stock,
      description,
      isHostel,
      location,
      caretakerPhone,
      roomType,
      availability,
      distanceFromCampus,
      amenities,
    } = req.body;

    const isHostelBool = isHostel === "true" || isHostel === true;

    // Safe amenities parsing
    let parsedAmenities = product.amenities || [];
    if (isHostelBool && amenities) {
      try {
        parsedAmenities = Array.isArray(amenities)
          ? amenities
          : JSON.parse(amenities || "[]");
      } catch (e) {
        parsedAmenities = product.amenities || [];
      }
    }

    // ────── IMAGE HANDLING – FULLY BULLETPROOF ──────
    let finalImages = [];

    // Parse existingImages
    const imagesToKeep = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : typeof req.body.existingImages === "string" &&
        req.body.existingImages.trim() !== ""
      ? JSON.parse(req.body.existingImages)
      : [];

    console.log("📸 Images to keep:", imagesToKeep);

    // Parse deletedImages 🔥 ADD THIS
    let imagesToDelete = [];
    if (req.body.deletedImages) {
      try {
        imagesToDelete = Array.isArray(req.body.deletedImages)
          ? req.body.deletedImages
          : JSON.parse(req.body.deletedImages || "[]");
      } catch (e) {
        imagesToDelete = [];
      }
    }

    console.log("🗑️ Images to delete:", imagesToDelete);

    // Keep only images that are in imagesToKeep
    finalImages = product.images.filter((img) => imagesToKeep.includes(img));

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newPaths = req.files.map((f) => `/uploads/products/${f.filename}`);
      finalImages = [...finalImages, ...newPaths];
    }

    // If no images remain, keep originals
    if (finalImages.length === 0) {
      finalImages = product.images;
    }

    // Delete files from disk 🔥 IMPROVED
    // In updateProduct function, improve error handling:
    product.images.forEach((imgPath) => {
      if (imagesToDelete.includes(imgPath)) {
        const fullPath = path.join(".", imgPath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log("✅ Deleted image from disk:", fullPath);
          }
        } catch (err) {
          console.error("❌ Error deleting image:", fullPath, err);
        }
      }
    });

    console.log("🔍 Existing product.details:", product.details);
    console.log("🔍 Received req.body.details:", req.body.details);
    
    let detailsData = product.details;
    if (!isHostelBool && req.body.details !== undefined) {
      try {
        if (typeof req.body.details === "string") {
          const parsed = JSON.parse(req.body.details);
          // Validate that parsed object is a plain object and not array or other dangerous types
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && 
              parsed.constructor === Object) {
            detailsData = parsed;
          }
        } else if (req.body.details && typeof req.body.details === "object" && 
                   !Array.isArray(req.body.details) && req.body.details.constructor === Object) {
          detailsData = req.body.details;
        }
        console.log("✅ Parsed detailsData:", detailsData);
      } catch (err) {
        console.log("❌ Error parsing details, keeping original");
        detailsData = product.details;
      }
    } else {
      console.log("⚠️ No details in request, keeping existing:", detailsData);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name || product.name,
        category: isHostelBool ? "Hostels" : category || product.category,
        subCategory: isHostelBool ? null : subCategory || product.subCategory,
        details: detailsData,
        price: price ? parseFloat(price) : product.price,
        stock: isHostelBool ? null : stock ? parseInt(stock) : product.stock,
        description: description || product.description,
        images: finalImages, // 🔥 Update with final images
        seller: { connect: { id: req.user.id } },
        isHostel: isHostelBool,
        location: isHostelBool ? location : null,
        caretakerPhone: isHostelBool ? caretakerPhone : null,
        roomType: isHostelBool ? roomType : null,
        availability: isHostelBool ? availability : null,
        distanceFromCampus:
          isHostelBool && distanceFromCampus
            ? parseFloat(distanceFromCampus)
            : null,
        amenities: parsedAmenities,
        ...(isHostelBool
          ? { bookingStatus: "available" }
          : { bookingStatus: "none" }),
      },
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== BOOK HOSTEL ========================
export const bookHostel = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const buyerId = req.user.id;
    const { message } = req.body;

    const hostel = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!hostel || !hostel.isHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    if (hostel.bookingStatus !== "available") {
      return res
        .status(400)
        .json({ message: "This room is no longer available" });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        bookedBy: buyerId,
        bookedAt: new Date(),
        bookingStatus: "pending",
        availability: "Fully Booked",
        bookingNotes: message || "No message from student",
      },
    });

    await prisma.notification.create({
      data: {
        sellerId: hostel.sellerId,
        title: "New Hostel Booking!",
        message: `${req.user.name} booked your ${hostel.roomType} at ${hostel.name}`,
        type: "booking",
      },
    });

    res.json({
      success: true,
      message: "Booking request sent! Caretaker will contact you soon.",
      hostel: updated,
    });
  } catch (err) {
    console.error("Book Hostel Error:", err);
    res.status(500).json({ message: "Booking failed" });
  }
};

// ======================== GET MY BOOKINGS (For Students) ========================
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.product.findMany({
      where: {
        isHostel: true,
        bookedBy: req.user.id,
      },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, profilePic: true },
        },
      },
      orderBy: { bookedAt: "desc" },
    });

    res.json(bookings);
  } catch (err) {
    console.error("getMyBookings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== GET INCOMING BOOKINGS (For Hostel Owners) ========================
export const getIncomingBookings = async (req, res) => {
  try {
    const bookings = await prisma.product.findMany({
      where: {
        isHostel: true,
        sellerId: req.user.id,
        bookingStatus: { in: ["pending", "confirmed"] },
      },
      orderBy: { bookedAt: "desc" },
    });

    const result = await Promise.all(
      bookings.map(async (booking) => {
        let buyer = null;
        if (booking.bookedBy) {
          buyer = await prisma.user.findUnique({
            where: { id: booking.bookedBy },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              profilePic: true,
              isVerified: true,
            },
          });
        }

        return {
          ...booking,
          buyer: buyer || {
            name: "Unknown Student",
            phone: "N/A",
            profilePic: null,
          },
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("getIncomingBookings ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================== CONFIRM / REJECT BOOKING ========================
export const manageBooking = async (req, res) => {
  try {
    const { productId, action } = req.body;
    const hostelId = parseInt(productId);

    const hostel = await prisma.product.findUnique({
      where: { id: hostelId },
    });

    if (!hostel || hostel.sellerId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (action === "confirm") {
      await prisma.product.update({
        where: { id: hostelId },
        data: { bookingStatus: "confirmed" },
      });

      await prisma.notification.create({
        data: {
          buyerId: hostel.bookedBy,
          title: "Hostel Booking Confirmed!",
          message: `Your booking for ${
            hostel.name
          } has been confirmed! Contact caretaker: ${
            hostel.caretakerPhone || "N/A"
          }`,
          type: "booking",
        },
      });

      return res.json({ message: "Booking confirmed successfully" });
    }

    if (action === "reject") {
      await prisma.product.update({
        where: { id: hostelId },
        data: {
          bookedBy: null,
          bookedAt: null,
          bookingStatus: "available",
          availability: "Available Now",
          bookingNotes: null,
        },
      });

      return res.json({ message: "Booking rejected and room reopened" });
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("manageBooking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== OTHER FUNCTIONS ========================
export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      include: {
        seller: {
          select: { id: true, name: true, profilePic: true, phone: true, productCategory: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (err) {
    console.error("getProducts Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProduct = async (req, res) => {
  const { id } = req.params;

  if (
    id === "my" ||
    id === "by-seller" ||
    id === "category" ||
    isNaN(parseInt(id))
  ) {
    return res.status(404).json({ message: "Route not found" });
  }

  try {
    const productId = parseInt(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePic: true,
            isVerified: true,
            productCategory: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("getProduct Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================== FINAL BULLETPROOF DELETE PRODUCT ========================
export const deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const sellerId = req.user.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sellerId: true,
        images: true,
        name: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId !== sellerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // DELETE ALL DEPENDENT DATA FIRST — NO MORE FOREIGN KEY ERRORS
    await prisma.$transaction(async (tx) => {
      // Remove from wishlists
      await tx.wishlist.deleteMany({
        where: { productId: product.id },
      });

      // Delete all reviews
      await tx.review.deleteMany({
        where: { productId: product.id },
      });

      // Now safe to delete product
      await tx.product.delete({
        where: { id: product.id },
      });
    });

    // Clean up images from disk
    product.images.forEach((imgPath) => {
      const filePath = path.join(".", imgPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted image:", filePath);
      }
    });

    res.json({
      message: `"${product.name}" has been permanently deleted (including wishlist & reviews)`,
    });
  } catch (err) {
    console.error("deleteProduct Error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const deployProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.sellerId !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { deployed: true },
      include: {
        seller: {
          select: { id: true, name: true, profilePic: true, phone: true, productCategory: true },
        },
      },
    });

    res.json({
      message: "Product deployed successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("deployProduct Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllDeployedProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        deployed: true,
        isHostel: false,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            profilePic: true,
            isVerified: true,
            createdAt: true,
            productCategory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add trust metrics to each product
    const enrichedProducts = await Promise.all(
      products.map(async (p) => {
        let reviewCount = 0;
        let avgRating = 0;
        
        try {
          reviewCount = await prisma.sellerReview.count({
            where: { sellerId: p.sellerId },
          });
          const reviews = await prisma.sellerReview.findMany({
            where: { sellerId: p.sellerId },
            select: { rating: true },
          });
          avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        } catch (err) {
          console.log('Review fetch error:', err.message);
        }

        return {
          ...p,
          sellerRating: Math.round(avgRating * 10) / 10,
          reviewCount,
          sellerVerified: p.seller.isVerified,
          sellerMemberSince: new Date(p.seller.createdAt).getFullYear(),
        };
      })
    );

    res.json({ products: enrichedProducts });
  } catch (err) {
    console.error("getAllDeployedProducts Error:", err);
    res.status(500).json({ message: "Failed to load products" });
  }
};

export const undeployProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.sellerId !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    if (!product.deployed) {
      return res.status(400).json({ message: "Product is not deployed" });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { deployed: false },
    });

    res.json({
      message: "Product removed from shop",
      product: updated,
    });
  } catch (err) {
    console.error("undeployProduct Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: parseInt(sellerId),
        deployed: true,
        isHostel: false,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            phone: true,
            isVerified: true,
            productCategory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (err) {
    console.error("getProductsBySellerId Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
