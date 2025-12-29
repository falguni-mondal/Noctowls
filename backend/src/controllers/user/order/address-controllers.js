import Address from "../../../models/address-model.js";

// ==================== GET ALL ADDRESSES ====================
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user;
    const { type, search } = req.query;

    let addresses;

    // Search addresses
    if (search) {
      addresses = await Address.searchAddresses(userId, search);
    }
    // Filter by type
    else if (type) {
      addresses = await Address.getAddressesByType(userId, type);
    }
    // Get all addresses
    else {
      addresses = await Address.getUserAddresses(userId);
    }

    return res.status(200).json({
      success: true,
      addresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
};

// ==================== GET DEFAULT ADDRESS ====================
export const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user;

    const address = await Address.getDefaultAddress(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "No default address found",
      });
    }

    return res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    console.error("Error fetching default address:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch default address",
      error: error.message,
    });
  }
};

// ==================== GET ADDRESS BY ID ====================
export const getAddressById = async (req, res) => {
  try {
    const userId = req.user;
    const { addressId } = req.params;

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch address",
      error: error.message,
    });
  }
};

// ==================== ADD ADDRESS ====================
export const addAddress = async (req, res) => {
  try {
    const userId = req.user;
    const {
      fullName,
      phone,
      alternatePhone,
      address,
      landmark,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    // Check if user has any addresses
    const existingAddressCount = await Address.countUserAddresses(userId);

    // If this is the first address, make it default
    const shouldBeDefault = existingAddressCount === 0 || isDefault;

    const newAddress = await Address.create({
      user: userId,
      fullName,
      phone,
      alternatePhone: alternatePhone || "",
      address,
      landmark: landmark || "",
      city,
      state,
      pincode,
      addressType: addressType || "home",
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error adding address:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
    });
  }
};

// ==================== UPDATE ADDRESS ====================
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user;
    const { addressId } = req.params;
    const updateData = req.body;

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "fullName",
      "phone",
      "alternatePhone",
      "address",
      "landmark",
      "city",
      "state",
      "pincode",
      "addressType",
      "isDefault",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        address[field] = updateData[field];
      }
    });

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Error updating address:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};

// ==================== DELETE ADDRESS ====================
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user;
    const { addressId } = req.params;

    await Address.deleteAddress(addressId, userId);

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== SET DEFAULT ADDRESS ====================
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user;
    const { addressId } = req.params;

    const address = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await address.setAsDefault();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set default address",
      error: error.message,
    });
  }
};

// ==================== GET ADDRESS STATISTICS ====================
export const getAddressStatistics = async (req, res) => {
  try {
    const userId = req.user;

    const totalAddresses = await Address.countUserAddresses(userId);
    const defaultAddress = await Address.getDefaultAddress(userId);

    const addressesByType = await Address.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$addressType", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      statistics: {
        totalAddresses,
        hasDefaultAddress: !!defaultAddress,
        byType: addressesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching address statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};