// ==================== HELPER FUNCTIONS ====================

// Phone validation (10 digits)
const phoneRegex = /^[0-9]{10}$/;

// Pincode validation (6 digits)
const pincodeRegex = /^[0-9]{6}$/;

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

// ==================== ADD ADDRESS VALIDATION ====================
export const validateAddAddress = (req, res, next) => {
  const errors = [];
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

  // 1. Full Name Validation
  if (!fullName || typeof fullName !== "string") {
    errors.push({
      field: "fullName",
      message: "Full name is required",
    });
  } else {
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.push({
        field: "fullName",
        message: "Full name must be between 2 and 100 characters",
      });
    }
    req.body.fullName = trimmedName;
  }

  // 2. Phone Validation
  if (!phone || typeof phone !== "string") {
    errors.push({
      field: "phone",
      message: "Phone number is required",
    });
  } else if (!phoneRegex.test(phone.trim())) {
    errors.push({
      field: "phone",
      message: "Phone number must be 10 digits",
    });
  } else {
    req.body.phone = phone.trim();
  }

  // 3. Alternate Phone Validation (Optional)
  if (alternatePhone !== undefined && alternatePhone !== null && alternatePhone !== "") {
    if (typeof alternatePhone !== "string") {
      errors.push({
        field: "alternatePhone",
        message: "Alternate phone must be a string",
      });
    } else if (!phoneRegex.test(alternatePhone.trim())) {
      errors.push({
        field: "alternatePhone",
        message: "Alternate phone must be 10 digits",
      });
    } else {
      req.body.alternatePhone = alternatePhone.trim();
    }
  }

  // 4. Address Validation
  if (!address || typeof address !== "string") {
    errors.push({
      field: "address",
      message: "Address is required",
    });
  } else {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 10 || trimmedAddress.length > 200) {
      errors.push({
        field: "address",
        message: "Address must be between 10 and 200 characters",
      });
    }
    req.body.address = trimmedAddress;
  }

  // 5. Landmark Validation (Optional)
  if (landmark !== undefined && landmark !== null) {
    if (typeof landmark !== "string") {
      errors.push({
        field: "landmark",
        message: "Landmark must be a string",
      });
    } else {
      const trimmedLandmark = landmark.trim();
      if (trimmedLandmark.length > 100) {
        errors.push({
          field: "landmark",
          message: "Landmark must not exceed 100 characters",
        });
      }
      req.body.landmark = trimmedLandmark;
    }
  }

  // 6. City Validation
  if (!city || typeof city !== "string") {
    errors.push({
      field: "city",
      message: "City is required",
    });
  } else {
    const trimmedCity = city.trim();
    if (trimmedCity.length < 2 || trimmedCity.length > 50) {
      errors.push({
        field: "city",
        message: "City must be between 2 and 50 characters",
      });
    }
    req.body.city = trimmedCity;
  }

  // 7. State Validation
  if (!state || typeof state !== "string") {
    errors.push({
      field: "state",
      message: "State is required",
    });
  } else {
    const trimmedState = state.trim();
    if (trimmedState.length < 2 || trimmedState.length > 50) {
      errors.push({
        field: "state",
        message: "State must be between 2 and 50 characters",
      });
    }
    req.body.state = trimmedState;
  }

  // 8. Pincode Validation
  if (!pincode || typeof pincode !== "string") {
    errors.push({
      field: "pincode",
      message: "Pincode is required",
    });
  } else if (!pincodeRegex.test(pincode.trim())) {
    errors.push({
      field: "pincode",
      message: "Pincode must be 6 digits",
    });
  } else {
    req.body.pincode = pincode.trim();
  }

  // 9. Address Type Validation (Optional)
  if (addressType !== undefined && addressType !== null) {
    if (typeof addressType !== "string") {
      errors.push({
        field: "addressType",
        message: "Address type must be a string",
      });
    } else if (!["home", "work", "other"].includes(addressType.toLowerCase())) {
      errors.push({
        field: "addressType",
        message: "Address type must be home, work, or other",
      });
    } else {
      req.body.addressType = addressType.toLowerCase();
    }
  }

  // 10. Is Default Validation (Optional)
  if (isDefault !== undefined && isDefault !== null) {
    if (typeof isDefault !== "boolean") {
      errors.push({
        field: "isDefault",
        message: "isDefault must be a boolean",
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== UPDATE ADDRESS VALIDATION ====================
export const validateUpdateAddress = (req, res, next) => {
  const errors = [];
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

  // All fields are optional for update, but if provided, must be valid

  // 1. Full Name
  if (fullName !== undefined && fullName !== null) {
    if (typeof fullName !== "string") {
      errors.push({
        field: "fullName",
        message: "Full name must be a string",
      });
    } else {
      const trimmedName = fullName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        errors.push({
          field: "fullName",
          message: "Full name must be between 2 and 100 characters",
        });
      }
      req.body.fullName = trimmedName;
    }
  }

  // 2. Phone
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      errors.push({
        field: "phone",
        message: "Phone must be a string",
      });
    } else if (!phoneRegex.test(phone.trim())) {
      errors.push({
        field: "phone",
        message: "Phone number must be 10 digits",
      });
    } else {
      req.body.phone = phone.trim();
    }
  }

  // 3. Alternate Phone
  if (alternatePhone !== undefined && alternatePhone !== null && alternatePhone !== "") {
    if (typeof alternatePhone !== "string") {
      errors.push({
        field: "alternatePhone",
        message: "Alternate phone must be a string",
      });
    } else if (!phoneRegex.test(alternatePhone.trim())) {
      errors.push({
        field: "alternatePhone",
        message: "Alternate phone must be 10 digits",
      });
    } else {
      req.body.alternatePhone = alternatePhone.trim();
    }
  }

  // 4. Address
  if (address !== undefined && address !== null) {
    if (typeof address !== "string") {
      errors.push({
        field: "address",
        message: "Address must be a string",
      });
    } else {
      const trimmedAddress = address.trim();
      if (trimmedAddress.length < 10 || trimmedAddress.length > 200) {
        errors.push({
          field: "address",
          message: "Address must be between 10 and 200 characters",
        });
      }
      req.body.address = trimmedAddress;
    }
  }

  // 5. Landmark
  if (landmark !== undefined && landmark !== null) {
    if (typeof landmark !== "string") {
      errors.push({
        field: "landmark",
        message: "Landmark must be a string",
      });
    } else {
      const trimmedLandmark = landmark.trim();
      if (trimmedLandmark.length > 100) {
        errors.push({
          field: "landmark",
          message: "Landmark must not exceed 100 characters",
        });
      }
      req.body.landmark = trimmedLandmark;
    }
  }

  // 6. City
  if (city !== undefined && city !== null) {
    if (typeof city !== "string") {
      errors.push({
        field: "city",
        message: "City must be a string",
      });
    } else {
      const trimmedCity = city.trim();
      if (trimmedCity.length < 2 || trimmedCity.length > 50) {
        errors.push({
          field: "city",
          message: "City must be between 2 and 50 characters",
        });
      }
      req.body.city = trimmedCity;
    }
  }

  // 7. State
  if (state !== undefined && state !== null) {
    if (typeof state !== "string") {
      errors.push({
        field: "state",
        message: "State must be a string",
      });
    } else {
      const trimmedState = state.trim();
      if (trimmedState.length < 2 || trimmedState.length > 50) {
        errors.push({
          field: "state",
          message: "State must be between 2 and 50 characters",
        });
      }
      req.body.state = trimmedState;
    }
  }

  // 8. Pincode
  if (pincode !== undefined && pincode !== null) {
    if (typeof pincode !== "string") {
      errors.push({
        field: "pincode",
        message: "Pincode must be a string",
      });
    } else if (!pincodeRegex.test(pincode.trim())) {
      errors.push({
        field: "pincode",
        message: "Pincode must be 6 digits",
      });
    } else {
      req.body.pincode = pincode.trim();
    }
  }

  // 9. Address Type
  if (addressType !== undefined && addressType !== null) {
    if (typeof addressType !== "string") {
      errors.push({
        field: "addressType",
        message: "Address type must be a string",
      });
    } else if (!["home", "work", "other"].includes(addressType.toLowerCase())) {
      errors.push({
        field: "addressType",
        message: "Address type must be home, work, or other",
      });
    } else {
      req.body.addressType = addressType.toLowerCase();
    }
  }

  // 10. Is Default
  if (isDefault !== undefined && isDefault !== null) {
    if (typeof isDefault !== "boolean") {
      errors.push({
        field: "isDefault",
        message: "isDefault must be a boolean",
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// ==================== ADDRESS ID VALIDATION ====================
export const validateAddressId = (req, res, next) => {
  const { addressId } = req.params;

  if (!addressId) {
    return res.status(400).json({
      success: false,
      message: "Address ID is required",
    });
  }

  if (!isValidObjectId(addressId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid address ID format",
    });
  }

  next();
};

// ==================== GET ADDRESSES QUERY VALIDATION ====================
export const validateGetAddresses = (req, res, next) => {
  const errors = [];
  const { type, search } = req.query;

  // Validate Type (optional)
  if (type !== undefined && type !== null) {
    if (typeof type !== "string") {
      errors.push({
        field: "type",
        message: "Type must be a string",
      });
    } else if (!["home", "work", "other"].includes(type.toLowerCase())) {
      errors.push({
        field: "type",
        message: "Type must be home, work, or other",
      });
    } else {
      req.query.type = type.toLowerCase();
    }
  }

  // Validate Search (optional)
  if (search !== undefined && search !== null) {
    if (typeof search !== "string") {
      errors.push({
        field: "search",
        message: "Search must be a string",
      });
    } else {
      const trimmedSearch = search.trim();
      if (trimmedSearch.length < 2) {
        errors.push({
          field: "search",
          message: "Search term must be at least 2 characters",
        });
      }
      req.query.search = trimmedSearch;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};