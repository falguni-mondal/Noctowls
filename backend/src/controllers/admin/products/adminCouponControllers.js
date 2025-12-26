import Coupon from "../../../models/coupon-model.js";

// ==================== CREATE COUPON - ✅ CLEANED ====================
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      applyType,
      startsAt,
      expiresAt,
      usageLimitType,
      perUserLimit,
      maxTotalUsage,
      isActive,
      minPurchaseAmount,
      minItemsRequired,
      applicableCategories,
    } = req.body;

    // ✅ ONLY business logic validation (unique code check)
    const existingCoupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim() 
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
        errors: [
          { field: "code", message: "This coupon code is already in use" }
        ]
      });
    }

    // ✅ Prepare coupon data (middleware already validated format)
    const couponData = {
      code: code.toUpperCase().trim(),
      description: description?.trim() || "Get discount on your purchase",
      discountType,
      discountValue: parseFloat(discountValue),
      applyType,
      startsAt: new Date(startsAt),
      expiresAt: new Date(expiresAt),
      usageLimitType,
      isActive: isActive !== undefined ? isActive : true,
      minPurchaseAmount: minPurchaseAmount || 0,
      minItemsRequired: minItemsRequired || 0,
      applicableCategories: applicableCategories || [],
      createdBy: req.user,
    };

    // Add conditional fields
    if (usageLimitType === 'multiple-per-user') {
      couponData.perUserLimit = parseInt(perUserLimit);
    } else if (usageLimitType === 'max-total') {
      couponData.maxTotalUsage = parseInt(maxTotalUsage);
    }

    // Create coupon (model will validate schema)
    const coupon = await Coupon.create(couponData);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};

// ==================== GET ALL COUPONS ====================
export const getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      order = "desc",
      search,
    } = req.query;

    const query = {};
    const now = new Date();

    if (status === "active") {
      query.isActive = true;
      query.startsAt = { $lte: now };
      query.expiresAt = { $gt: now };
      query.$or = [
        { usageLimitType: { $ne: 'max-total' } },
        { $expr: { $lt: ['$totalUsedCount', '$maxTotalUsage'] } }
      ];
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "expired") {
      query.expiresAt = { $lte: now };
    } else if (status === "upcoming") {
      query.startsAt = { $gt: now };
      query.isActive = true;
    } else if (status === "exhausted") {
      query.usageLimitType = 'max-total';
      query.$expr = { $gte: ['$totalUsedCount', '$maxTotalUsage'] };
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name email"),
      Coupon.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      coupons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};

// ==================== GET ACTIVE COUPONS ====================
export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findActiveCoupons();

    return res.status(200).json({
      success: true,
      coupons,
      count: coupons.length,
    });
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active coupons",
      error: error.message,
    });
  }
};

// ==================== GET COUPON BY ID ====================
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id).populate("createdBy", "name email");

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};

// ==================== GET COUPON STATS ====================
export const getCouponStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await Coupon.getCouponStats(id);

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching coupon stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch coupon statistics",
      error: error.message,
    });
  }
};

// ==================== UPDATE COUPON - ✅ CLEANED ====================
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ Fetch current coupon for business logic validation
    const currentCoupon = await Coupon.findById(id);

    if (!currentCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // ✅ ONLY business logic validation (unique code check)
    if (updates.code) {
      const existingCoupon = await Coupon.findOne({
        code: updates.code.toUpperCase().trim(),
        _id: { $ne: id },
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
          errors: [
            { field: "code", message: "This coupon code is already in use" }
          ]
        });
      }

      updates.code = updates.code.toUpperCase().trim();
    }

    // ✅ Trim description if provided
    if (updates.description) {
      updates.description = updates.description.trim();
    }

    // ✅ Parse dates if provided
    if (updates.startsAt) {
      updates.startsAt = new Date(updates.startsAt);
    }
    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }

    // ✅ Parse numbers if provided
    if (updates.discountValue !== undefined) {
      updates.discountValue = parseFloat(updates.discountValue);
    }
    if (updates.perUserLimit !== undefined) {
      updates.perUserLimit = parseInt(updates.perUserLimit);
    }
    if (updates.maxTotalUsage !== undefined) {
      updates.maxTotalUsage = parseInt(updates.maxTotalUsage);
    }
    if (updates.minPurchaseAmount !== undefined) {
      updates.minPurchaseAmount = parseFloat(updates.minPurchaseAmount);
    }
    if (updates.minItemsRequired !== undefined) {
      updates.minItemsRequired = parseInt(updates.minItemsRequired);
    }

    // ✅ BUSINESS LOGIC: Prevent decreasing maxTotalUsage below current usage
    if (updates.maxTotalUsage !== undefined && currentCoupon.usageLimitType === 'max-total') {
      if (updates.maxTotalUsage < currentCoupon.totalUsedCount) {
        return res.status(400).json({
          success: false,
          message: "Cannot decrease usage limit below current usage",
          errors: [
            { 
              field: "maxTotalUsage", 
              message: `Cannot set limit below current usage (${currentCoupon.totalUsedCount} times used). You can only increase the limit.` 
            }
          ]
        });
      }
    }

    // ✅ Update coupon (model will validate schema)
    const coupon = await Coupon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};

// ==================== DELETE COUPON ====================
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      deletedCoupon: {
        code: coupon.code,
        id: coupon._id
      }
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};

// ==================== TOGGLE COUPON STATUS ====================
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Toggle status
    if (coupon.isActive) {
      await coupon.deactivate();
    } else {
      try {
        await coupon.activate();
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: [
            { field: "isActive", message: error.message }
          ]
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      coupon,
    });
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle coupon status",
      error: error.message,
    });
  }
};

// ==================== CLEANUP EXPIRED COUPONS ====================
export const cleanupExpiredCoupons = async (req, res) => {
  try {
    const result = await Coupon.cleanupExpiredCoupons();

    return res.status(200).json({
      success: true,
      message: `${result.deactivated} expired coupons deactivated`,
      result,
    });
  } catch (error) {
    console.error("Error cleaning up coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cleanup expired coupons",
      error: error.message,
    });
  }
};

// ==================== GET COUPON DASHBOARD STATS ====================
export const getCouponDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      upcomingCoupons,
      exhaustedCoupons,
      mostUsedCoupons,
      recentCoupons,
      usageByType,
    ] = await Promise.all([
      Coupon.countDocuments(),

      Coupon.countDocuments({
        isActive: true,
        startsAt: { $lte: now },
        expiresAt: { $gt: now },
        $or: [
          { usageLimitType: { $ne: 'max-total' } },
          { $expr: { $lt: ['$totalUsedCount', '$maxTotalUsage'] } }
        ]
      }),

      Coupon.countDocuments({
        expiresAt: { $lte: now },
      }),

      Coupon.countDocuments({
        startsAt: { $gt: now },
        isActive: true,
      }),

      Coupon.countDocuments({
        usageLimitType: 'max-total',
        $expr: { $gte: ['$totalUsedCount', '$maxTotalUsage'] }
      }),

      Coupon.find()
        .sort({ totalUsedCount: -1 })
        .limit(5)
        .select("code totalUsedCount maxTotalUsage usageLimitType perUserLimit discountType discountValue applyType"),

      Coupon.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("code discountType discountValue applyType usageLimitType createdAt"),

      Coupon.aggregate([
        {
          $group: {
            _id: '$usageLimitType',
            count: { $sum: 1 },
            totalUsage: { $sum: '$totalUsedCount' }
          }
        }
      ])
    ]);

    const totalUsageResult = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalUsage: { $sum: '$totalUsedCount' },
          uniqueUsers: { $sum: { $size: '$userUsageHistory' } }
        }
      }
    ]);

    const totalUsage = totalUsageResult[0]?.totalUsage || 0;
    const uniqueUsers = totalUsageResult[0]?.uniqueUsers || 0;

    return res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalCoupons,
          activeCoupons,
          expiredCoupons,
          upcomingCoupons,
          exhaustedCoupons,
          totalUsage,
          uniqueUsers,
        },
        mostUsedCoupons,
        recentCoupons,
        usageByType: usageByType.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalUsage: item.totalUsage
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// ==================== GET COUPON USAGE ====================
export const getCouponUsage = async (req, res) => {
  try {
    const { userId, deviceId } = req.query;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Either userId or deviceId is required",
      });
    }

    if (userId && deviceId) {
      return res.status(400).json({
        success: false,
        message: "Provide either userId or deviceId, not both",
      });
    }

    let query;
    if (userId) {
      query = { 'userUsageHistory.user': userId };
    } else {
      query = { 'userUsageHistory.deviceId': deviceId };
    }

    const coupons = await Coupon.find(query).select(
      'code discountType discountValue usageLimitType perUserLimit maxTotalUsage userUsageHistory'
    );

    const usage = coupons.map(coupon => {
      let usageEntry;
      
      if (userId) {
        usageEntry = coupon.userUsageHistory.find(
          entry => entry.user && entry.user.toString() === userId
        );
      } else {
        usageEntry = coupon.userUsageHistory.find(
          entry => entry.deviceId === deviceId
        );
      }

      return {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageLimitType: coupon.usageLimitType,
        perUserLimit: coupon.perUserLimit,
        maxTotalUsage: coupon.maxTotalUsage,
        usageCount: usageEntry?.usageCount || 0,
        lastUsedAt: usageEntry?.lastUsedAt,
        remainingUses: coupon.getUserRemainingUses(userId || null, deviceId || null),
      };
    });

    const totalUsage = usage.reduce((sum, item) => sum + item.usageCount, 0);

    return res.status(200).json({
      success: true,
      identifier: userId ? { type: 'user', userId } : { type: 'guest', deviceId },
      totalUsage,
      couponsUsed: usage.length,
      usage,
    });
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon usage",
      error: error.message,
    });
  }
};

// ==================== VALIDATE COUPON FOR USER ====================
export const validateCouponForUser = async (req, res) => {
  try {
    const { code } = req.params;
    const { userId, deviceId } = req.query;

    if (!userId && !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Either userId or deviceId is required",
      });
    }

    if (userId && deviceId) {
      return res.status(400).json({
        success: false,
        message: "Provide either userId or deviceId, not both",
      });
    }

    const coupon = await Coupon.findValidCoupon(code);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unavailable coupon",
      });
    }

    try {
      coupon.validateForUser(userId || null, deviceId || null);
      
      const remainingUses = coupon.getUserRemainingUses(userId || null, deviceId || null);

      return res.status(200).json({
        success: true,
        message: "Coupon is valid",
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          applyType: coupon.applyType,
          usageLimitType: coupon.usageLimitType,
          remainingUses,
          minPurchaseAmount: coupon.minPurchaseAmount,
          minItemsRequired: coupon.minItemsRequired,
          expiresAt: coupon.expiresAt,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to validate coupon",
    });
  }
};