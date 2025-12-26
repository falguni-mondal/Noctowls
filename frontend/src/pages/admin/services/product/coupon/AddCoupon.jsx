import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { Icon } from '@iconify/react';
import MiniLoading from '../../../../../utils/loader/MiniLoading';
import toastControls from "../../../../../utils/global/toastControls";
import { 
  createCoupon, 
  clearError, 
  clearSuccessMessage,
  selectActionLoading,
  selectSuccessMessage,
  selectError
} from '../../../../../store/features/admin/adminCouponSlice';

// ==================== VALIDATION CONSTANTS ====================
const VALIDATION_LIMITS = {
  CODE_MIN_LENGTH: 3,
  CODE_MAX_LENGTH: 20,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 200,
  MAX_FIXED_DISCOUNT: 10000,
  MAX_PERCENTAGE: 100,
  MIN_PER_USER_LIMIT: 1,
  MAX_PER_USER_LIMIT: 1000,
  MIN_MAX_TOTAL_USAGE: 1,
  MAX_MAX_TOTAL_USAGE: 100000,
};

// ==================== DATE CONVERSION HELPER ====================
/**
 * Convert local date and time to UTC ISO string for backend
 * @param {string} localDate - Date in YYYY-MM-DD format (from date input)
 * @param {string} localTime - Time in HH:MM format (from time input)
 * @returns {string} - ISO 8601 UTC datetime string
 */
const convertLocalToUTC = (localDate, localTime) => {
  if (!localDate || !localTime) return null;
  
  // Create date object from local date and time
  // Browser automatically interprets this as local timezone
  const dateTimeString = `${localDate}T${localTime}:00`;
  const date = new Date(dateTimeString);
  
  // Return ISO string (automatically converts to UTC)
  return date.toISOString();
};

const AddCoupon = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const loading = useSelector(selectActionLoading);
  const successMessage = useSelector(selectSuccessMessage);
  const error = useSelector(selectError);

  // Form state
  const [reveal, setReveal] = useState({
    discountType: false,
    applyType: false,
    usageLimitType: false,
  });

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: '',
    applyType: 'each-product',
    usageLimitType: 'once-per-user',
    perUserLimit: 1,
    maxTotalUsage: 100,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    description: '',
    isActive: true,
    minPurchaseAmount: 0,
    minItemsRequired: 0,
  });

  // Error state
  const [validationErrors, setValidationErrors] = useState({
    code: [],
    discount: [],
    dates: [],
    usage: [],
    general: [],
  });

  // Refs
  const formRef = useRef(null);

  // Track if user has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ==================== HELPER FUNCTIONS ====================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setHasUnsavedChanges(true);

    // Clear related errors
    setValidationErrors(prev => ({
      ...prev,
      [field]: [],
      general: prev.general.filter(err => !err.toLowerCase().includes(field))
    }));
  };

  // Prevent number input from changing on scroll
  const handleNumberInputWheel = (e) => {
    e.target.blur();
  };

  // Enforce max values on number inputs
  const handleNumberInputChange = (field, value, max) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > max) {
      handleInputChange(field, max);
    } else {
      handleInputChange(field, value);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'fixed',
      discountValue: '',
      applyType: 'each-product',
      usageLimitType: 'once-per-user',
      perUserLimit: 1,
      maxTotalUsage: 100,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      description: '',
      isActive: true,
      minPurchaseAmount: 0,
      minItemsRequired: 0,
    });

    setValidationErrors({
      code: [],
      discount: [],
      dates: [],
      usage: [],
      general: [],
    });

    setReveal({
      discountType: false,
      applyType: false,
      usageLimitType: false,
    });

    setHasUnsavedChanges(false);
  };

  const validateForm = () => {
    const newErrors = {
      code: [],
      discount: [],
      dates: [],
      usage: [],
      general: [],
    };

    // Validate coupon code
    const trimmedCode = formData.code.trim();
    if (!trimmedCode || trimmedCode.length < VALIDATION_LIMITS.CODE_MIN_LENGTH) {
      newErrors.code.push(`Coupon code must be at least ${VALIDATION_LIMITS.CODE_MIN_LENGTH} characters long`);
    }
    if (trimmedCode.length > VALIDATION_LIMITS.CODE_MAX_LENGTH) {
      newErrors.code.push(`Coupon code cannot exceed ${VALIDATION_LIMITS.CODE_MAX_LENGTH} characters`);
    }
    if (!/^[A-Z0-9]+$/.test(trimmedCode.toUpperCase())) {
      newErrors.code.push('Coupon code must contain only uppercase letters and numbers');
    }

    // Validate description
    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc || trimmedDesc.length < VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH) {
      newErrors.general.push(`Description must be at least ${VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH} characters long`);
    }
    if (trimmedDesc.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      newErrors.general.push(`Description cannot exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`);
    }

    // Validate discount value
    const discountVal = parseFloat(formData.discountValue);
    if (!formData.discountValue || isNaN(discountVal) || discountVal <= 0) {
      newErrors.discount.push('Discount value must be greater than 0');
    } else {
      if (formData.discountType === 'percentage' && discountVal > VALIDATION_LIMITS.MAX_PERCENTAGE) {
        newErrors.discount.push(`Percentage discount cannot exceed ${VALIDATION_LIMITS.MAX_PERCENTAGE}%`);
      }
      if (formData.discountType === 'fixed' && discountVal > VALIDATION_LIMITS.MAX_FIXED_DISCOUNT) {
        newErrors.discount.push(`Fixed discount cannot exceed ₹${VALIDATION_LIMITS.MAX_FIXED_DISCOUNT.toLocaleString()}`);
      }
    }

    // Validate usage limits
    if (formData.usageLimitType === 'multiple-per-user') {
      const perUserLimit = parseInt(formData.perUserLimit);
      if (!formData.perUserLimit || isNaN(perUserLimit) || perUserLimit < VALIDATION_LIMITS.MIN_PER_USER_LIMIT) {
        newErrors.usage.push(`Per user limit must be at least ${VALIDATION_LIMITS.MIN_PER_USER_LIMIT}`);
      }
      if (perUserLimit > VALIDATION_LIMITS.MAX_PER_USER_LIMIT) {
        newErrors.usage.push(`Per user limit cannot exceed ${VALIDATION_LIMITS.MAX_PER_USER_LIMIT}`);
      }
    }

    if (formData.usageLimitType === 'max-total') {
      const maxTotal = parseInt(formData.maxTotalUsage);
      if (!formData.maxTotalUsage || isNaN(maxTotal) || maxTotal < VALIDATION_LIMITS.MIN_MAX_TOTAL_USAGE) {
        newErrors.usage.push(`Maximum total usage must be at least ${VALIDATION_LIMITS.MIN_MAX_TOTAL_USAGE}`);
      }
      if (maxTotal > VALIDATION_LIMITS.MAX_MAX_TOTAL_USAGE) {
        newErrors.usage.push(`Maximum total usage cannot exceed ${VALIDATION_LIMITS.MAX_MAX_TOTAL_USAGE.toLocaleString()}`);
      }
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.dates.push('Start date is required');
    }
    if (!formData.startTime) {
      newErrors.dates.push('Start time is required');
    }
    if (!formData.endDate) {
      newErrors.dates.push('End date is required');
    }
    if (!formData.endTime) {
      newErrors.dates.push('End time is required');
    }

    // Validate date logic
    if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (isNaN(startDateTime.getTime())) {
        newErrors.dates.push('Start date and time must be valid');
      }
      if (isNaN(endDateTime.getTime())) {
        newErrors.dates.push('End date and time must be valid');
      }
      
      if (endDateTime <= startDateTime) {
        newErrors.dates.push('End date and time must be after start date and time');
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({
      code: [],
      discount: [],
      dates: [],
      usage: [],
      general: [],
    });

    // Validate form
    const errors = validateForm();
    const hasErrors = Object.values(errors).some(arr => arr.length > 0);

    if (hasErrors) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors", toastControls);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ✅ FIXED: Prepare data for API with proper UTC conversion
    const couponData = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      applyType: formData.applyType,
      usageLimitType: formData.usageLimitType,
      startsAt: convertLocalToUTC(formData.startDate, formData.startTime), // ✅ Fixed
      expiresAt: convertLocalToUTC(formData.endDate, formData.endTime),     // ✅ Fixed
      isActive: formData.isActive,
      minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
      minItemsRequired: parseInt(formData.minItemsRequired) || 0,
    };

    // Add conditional fields based on usage limit type
    if (formData.usageLimitType === 'multiple-per-user') {
      couponData.perUserLimit = parseInt(formData.perUserLimit);
    } else if (formData.usageLimitType === 'max-total') {
      couponData.maxTotalUsage = parseInt(formData.maxTotalUsage);
    }

    // Dispatch create coupon action
    await dispatch(createCoupon(couponData));
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate("/admin/coupons");
      }
    } else {
      navigate("/admin/coupons");
    }
  };

  // ==================== EFFECTS ====================

  // Handle success
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, {
        ...toastControls,
        onClose: () => dispatch(clearSuccessMessage())
      });
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [successMessage, dispatch]);

  // Handle backend errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || "Failed to add coupon!";
      toast.error(errorMessage, {
        ...toastControls,
        onClose: () => dispatch(clearError())
      });

      if (error.errors && Array.isArray(error.errors)) {
        const backendErrors = {
          code: [],
          discount: [],
          dates: [],
          usage: [],
          general: [],
        };

        error.errors.forEach(err => {
          const field = err.field;
          const message = err.message;

          if (field === 'code') {
            backendErrors.code.push(message);
          } else if (field === 'discountValue' || field === 'discountType') {
            backendErrors.discount.push(message);
          } else if (field === 'startsAt' || field === 'expiresAt') {
            backendErrors.dates.push(message);
          } else if (field === 'perUserLimit' || field === 'maxTotalUsage' || field === 'usageLimitType') {
            backendErrors.usage.push(message);
          } else {
            backendErrors.general.push(message);
          }
        });

        setValidationErrors(backendErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [error, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown')) {
        setReveal({
          discountType: false,
          applyType: false,
          usageLimitType: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ==================== USAGE LIMIT OPTIONS ====================

  const getUsageLimitLabel = () => {
    switch (formData.usageLimitType) {
      case 'once-per-user':
        return 'Once Per User';
      case 'multiple-per-user':
        return `Multiple Per User (${formData.perUserLimit}x)`;
      case 'max-total':
        return `Max Total Uses (${formData.maxTotalUsage})`;
      default:
        return 'Select Usage Limit';
    }
  };

  // ==================== RENDER ====================

  const allErrors = [
    ...validationErrors.code, 
    ...validationErrors.discount, 
    ...validationErrors.dates,
    ...validationErrors.usage,
    ...validationErrors.general
  ];

  return (
    <div className='px-3 py-10' id='add-coupon-page'>
      <h1 className='ad-coupon-heading text-2xl font-semibold mb-3'>
        Add Coupon
      </h1>

      <form id='add-coupon-form' onSubmit={handleSubmit} ref={formRef}>
        
        {/* Error Messages */}
        {allErrors.length > 0 && (
          <section 
            className="mb-5 p-4 bg-red-950/30 border border-red-800 rounded"
            role="alert"
            aria-live="polite"
          >
            <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
              <Icon icon="material-symbols:error-outline" className="text-xl" />
              Please fix the following errors:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
              {allErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Coupon Code */}
        <section className='mb-8'>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <Icon icon="mdi:ticket-percent" className="text-xl text-indigo-400" />
            Coupon Code
          </h2>
          <div className='space-y-4'>
            <div>
              <label htmlFor='code' className='block text-sm text-zinc-400 mb-2'>
                Code <span className="text-red-400">*</span>
              </label>
              <input
                type='text'
                id='code'
                name='code'
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                disabled={loading}
                placeholder='e.g., SAVE50, WELCOME2024'
                maxLength={VALIDATION_LIMITS.CODE_MAX_LENGTH}
                className={`w-full h-10 px-3 bg-zinc-900 border ${
                  validationErrors.code.length > 0 ? 'border-red-500' : 'border-zinc-800'
                } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 uppercase disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Use uppercase letters and numbers only ({VALIDATION_LIMITS.CODE_MIN_LENGTH}-{VALIDATION_LIMITS.CODE_MAX_LENGTH} characters)
              </p>
            </div>

            <div>
              <label htmlFor='description' className='block text-sm text-zinc-400 mb-2'>
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                placeholder={`Brief description of this coupon (${VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH}-${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters)`}
                maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
                rows={3}
                className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed'
              />
              <p className="text-xs text-zinc-500 mt-1">
                {formData.description.length}/{VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters
              </p>
            </div>
          </div>
        </section>

        {/* Discount Settings */}
        <section className='mb-8'>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <Icon icon="mdi:sale" className="text-xl text-green-400" />
            Discount Settings
          </h2>
          <div className='space-y-4'>
            {/* Discount Type */}
            <div>
              <label className='block text-sm text-zinc-400 mb-2'>
                Discount Type <span className="text-red-400">*</span>
              </label>
              <div className='relative custom-dropdown'>
                <button
                  type='button'
                  onClick={() => !loading && setReveal(prev => ({ ...prev, discountType: !prev.discountType }))}
                  disabled={loading}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='capitalize'>
                    {formData.discountType === 'fixed' ? 'Fixed Price (₹)' : 'Percentage (%)'}
                  </span>
                  <Icon 
                    icon="iconamoon:arrow-down-2-duotone" 
                    className={`text-xl transition-transform ${reveal.discountType ? 'rotate-180' : ''}`}
                  />
                </button>
                {reveal.discountType && (
                  <div className='absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-[3px] overflow-hidden z-10 shadow-xl'>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('discountType', 'fixed');
                        setReveal(prev => ({ ...prev, discountType: false }));
                      }}
                      className='w-full h-10 px-3 text-sm text-left hover:bg-zinc-800 transition'
                    >
                      Fixed Price (₹)
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('discountType', 'percentage');
                        setReveal(prev => ({ ...prev, discountType: false }));
                      }}
                      className='w-full h-10 px-3 text-sm text-left hover:bg-zinc-800 transition'
                    >
                      Percentage (%)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label htmlFor='discountValue' className='block text-sm text-zinc-400 mb-2'>
                Discount Value <span className="text-red-400">*</span>
              </label>
              <div className='relative'>
                <input
                  type='number'
                  id='discountValue'
                  name='discountValue'
                  value={formData.discountValue}
                  onChange={(e) => handleNumberInputChange(
                    'discountValue', 
                    e.target.value,
                    formData.discountType === 'percentage' ? VALIDATION_LIMITS.MAX_PERCENTAGE : VALIDATION_LIMITS.MAX_FIXED_DISCOUNT
                  )}
                  onWheel={handleNumberInputWheel}
                  disabled={loading}
                  min='0'
                  max={formData.discountType === 'percentage' ? VALIDATION_LIMITS.MAX_PERCENTAGE : VALIDATION_LIMITS.MAX_FIXED_DISCOUNT}
                  step={formData.discountType === 'percentage' ? '1' : '10'}
                  placeholder={formData.discountType === 'fixed' ? 'Enter amount in ₹' : 'Enter percentage'}
                  className={`w-full h-10 px-3 ${formData.discountType === 'fixed' ? 'pl-8' : 'pr-8'} bg-zinc-900 border ${
                    validationErrors.discount.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {formData.discountType === 'fixed' && (
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'>₹</span>
                )}
                {formData.discountType === 'percentage' && (
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500'>%</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {formData.discountType === 'fixed' 
                  ? `Enter the fixed discount amount in rupees (max ₹${VALIDATION_LIMITS.MAX_FIXED_DISCOUNT.toLocaleString()})` 
                  : `Enter the discount percentage (0-${VALIDATION_LIMITS.MAX_PERCENTAGE}%)`}
              </p>
            </div>

            {/* Apply Type */}
            <div>
              <label className='block text-sm text-zinc-400 mb-2'>
                Apply To <span className="text-red-400">*</span>
              </label>
              <div className='relative custom-dropdown'>
                <button
                  type='button'
                  onClick={() => !loading && setReveal(prev => ({ ...prev, applyType: !prev.applyType }))}
                  disabled={loading}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='capitalize'>
                    {formData.applyType === 'each-product' ? 'Each Product' : 'Each Order'}
                  </span>
                  <Icon 
                    icon="iconamoon:arrow-down-2-duotone" 
                    className={`text-xl transition-transform ${reveal.applyType ? 'rotate-180' : ''}`}
                  />
                </button>
                {reveal.applyType && (
                  <div className='absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-[3px] overflow-hidden z-10 shadow-xl'>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('applyType', 'each-product');
                        setReveal(prev => ({ ...prev, applyType: false }));
                      }}
                      className='w-full px-3 py-2 text-sm text-left hover:bg-zinc-800 transition'
                    >
                      <div>
                        <p className="font-medium">Each Product</p>
                        <p className="text-xs text-zinc-500">Discount applies to each item in cart</p>
                      </div>
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('applyType', 'each-order');
                        setReveal(prev => ({ ...prev, applyType: false }));
                      }}
                      className='w-full px-3 py-2 text-sm text-left hover:bg-zinc-800 transition'
                    >
                      <div>
                        <p className="font-medium">Each Order</p>
                        <p className="text-xs text-zinc-500">Discount applies once per order</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Usage Limit */}
        <section className='mb-8'>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <Icon icon="mdi:counter" className="text-xl text-amber-400" />
            Usage Limit
          </h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm text-zinc-400 mb-2'>
                Limit Type <span className="text-red-400">*</span>
              </label>
              <div className='relative custom-dropdown'>
                <button
                  type='button'
                  onClick={() => !loading && setReveal(prev => ({ ...prev, usageLimitType: !prev.usageLimitType }))}
                  disabled={loading}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span>{getUsageLimitLabel()}</span>
                  <Icon 
                    icon="iconamoon:arrow-down-2-duotone" 
                    className={`text-xl transition-transform ${reveal.usageLimitType ? 'rotate-180' : ''}`}
                  />
                </button>
                {reveal.usageLimitType && (
                  <div className='absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-[3px] overflow-hidden z-10 shadow-xl'>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('usageLimitType', 'once-per-user');
                        setReveal(prev => ({ ...prev, usageLimitType: false }));
                      }}
                      className='w-full px-3 py-3 text-sm text-left hover:bg-zinc-800 transition border-b border-zinc-800'
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Icon icon="mdi:account-check" className="text-blue-400" />
                          Once Per User
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Each user can use this coupon only once</p>
                      </div>
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('usageLimitType', 'multiple-per-user');
                        setReveal(prev => ({ ...prev, usageLimitType: false }));
                      }}
                      className='w-full px-3 py-3 text-sm text-left hover:bg-zinc-800 transition border-b border-zinc-800'
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Icon icon="mdi:account-multiple-check" className="text-green-400" />
                          Multiple Per User
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Set how many times each user can use this coupon</p>
                      </div>
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        handleInputChange('usageLimitType', 'max-total');
                        setReveal(prev => ({ ...prev, usageLimitType: false }));
                      }}
                      className='w-full px-3 py-3 text-sm text-left hover:bg-zinc-800 transition'
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Icon icon="mdi:counter" className="text-purple-400" />
                          Max Total Uses
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Set maximum total uses across all users</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Conditional inputs based on usage limit type */}
            {formData.usageLimitType === 'multiple-per-user' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                <label htmlFor='perUserLimit' className='block text-sm text-zinc-400 mb-2'>
                  Uses Per User <span className="text-red-400">*</span>
                </label>
                <input
                  type='number'
                  id='perUserLimit'
                  name='perUserLimit'
                  value={formData.perUserLimit}
                  onChange={(e) => handleNumberInputChange('perUserLimit', e.target.value, VALIDATION_LIMITS.MAX_PER_USER_LIMIT)}
                  onWheel={handleNumberInputWheel}
                  disabled={loading}
                  min={VALIDATION_LIMITS.MIN_PER_USER_LIMIT}
                  max={VALIDATION_LIMITS.MAX_PER_USER_LIMIT}
                  placeholder='e.g., 3'
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.usage.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Each user can use this coupon up to {formData.perUserLimit} {formData.perUserLimit === 1 ? 'time' : 'times'} 
                  (max {VALIDATION_LIMITS.MAX_PER_USER_LIMIT})
                </p>
              </div>
            )}

            {formData.usageLimitType === 'max-total' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                <label htmlFor='maxTotalUsage' className='block text-sm text-zinc-400 mb-2'>
                  Maximum Total Uses <span className="text-red-400">*</span>
                </label>
                <input
                  type='number'
                  id='maxTotalUsage'
                  name='maxTotalUsage'
                  value={formData.maxTotalUsage}
                  onChange={(e) => handleNumberInputChange('maxTotalUsage', e.target.value, VALIDATION_LIMITS.MAX_MAX_TOTAL_USAGE)}
                  onWheel={handleNumberInputWheel}
                  disabled={loading}
                  min={VALIDATION_LIMITS.MIN_MAX_TOTAL_USAGE}
                  max={VALIDATION_LIMITS.MAX_MAX_TOTAL_USAGE}
                  placeholder='e.g., 100'
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.usage.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  This coupon can be used a total of {formData.maxTotalUsage.toLocaleString()} {formData.maxTotalUsage === 1 ? 'time' : 'times'} across all users
                  (max {VALIDATION_LIMITS.MAX_MAX_TOTAL_USAGE.toLocaleString()})
                </p>
              </div>
            )}

            {formData.usageLimitType === 'once-per-user' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:information" className="text-blue-400 text-xl mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">One-Time Use Per User</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Each user can use this coupon only once. Perfect for first-time customer discounts or exclusive one-time offers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Validity Period */}
        <section className='mb-8'>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <Icon icon="mdi:calendar-clock" className="text-xl text-blue-400" />
            Validity Period
          </h2>
          <div className='space-y-4'>
            {/* Start Date & Time */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label htmlFor='startDate' className='block text-sm text-zinc-400 mb-2'>
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type='date'
                  id='startDate'
                  name='startDate'
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  disabled={loading}
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>
              <div>
                <label htmlFor='startTime' className='block text-sm text-zinc-400 mb-2'>
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type='time'
                  id='startTime'
                  name='startTime'
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  disabled={loading}
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label htmlFor='endDate' className='block text-sm text-zinc-400 mb-2'>
                  End Date <span className="text-red-400">*</span>
                </label>
                <input
                  type='date'
                  id='endDate'
                  name='endDate'
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  disabled={loading}
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>
              <div>
                <label htmlFor='endTime' className='block text-sm text-zinc-400 mb-2'>
                  End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type='time'
                  id='endTime'
                  name='endTime'
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  disabled={loading}
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>
            </div>

            {/* ✅ Display formatted date range with timezone info */}
            {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400 mb-1">
                  Coupon will be valid (in your local time):
                </p>
                <p className="text-sm">
                  {new Date(`${formData.startDate}T${formData.startTime}`).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                  {' to '}
                  {new Date(`${formData.endDate}T${formData.endTime}`).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
                <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                  <Icon icon="mdi:information-outline" className="text-blue-400" />
                  Times are shown in your local timezone and will be converted to UTC when saved
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Status */}
        <section className='mb-8'>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <Icon icon="mdi:toggle-switch" className="text-xl text-purple-400" />
            Status
          </h2>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => !loading && handleInputChange('isActive', !formData.isActive)}
              disabled={loading}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                formData.isActive ? 'bg-green-600' : 'bg-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={`Toggle coupon status. Currently ${formData.isActive ? 'active' : 'inactive'}`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.isActive ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className='text-sm'>
              {formData.isActive ? (
                <span className="text-green-400">Active (Usable once validity period starts)</span>
              ) : (
                <span className="text-zinc-400">Inactive (Disabled)</span>
              )}
            </span>
          </div>
        </section>

        {/* Submit Buttons */}
        <section className="w-full mt-10 flex flex-col gap-2" id='add-coupon-btns'>
          <button
            type='submit'
            disabled={loading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative tracking-wide transition-colors"
            aria-label="Add coupon"
          >
            {loading ? <MiniLoading /> : 'Add Coupon'}
          </button>
          
          <button
            onClick={handleCancel}
            type='button'
            disabled={loading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-zinc-700 text-sm font-medium hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed relative tracking-wide transition-colors"
            aria-label="Cancel and go back"
          >
            Cancel
          </button>
        </section>
      </form>
    </div>
  );
};

export default AddCoupon;