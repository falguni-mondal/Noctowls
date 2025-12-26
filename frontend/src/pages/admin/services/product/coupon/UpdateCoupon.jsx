import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import { Icon } from '@iconify/react';
import MiniLoading from '../../../../../utils/loader/MiniLoading';
import Loader from '../../../../../utils/loader/Loader';
import toastControls from "../../../../../utils/global/toastControls";
import { 
  getCouponById,
  updateCoupon,
  clearError,
  clearSuccessMessage,
  selectActionLoading,
  selectSuccessMessage,
  selectError,
  selectCurrentCoupon,
  selectLoading,
} from '../../../../../store/features/admin/adminCouponSlice';

const UpdateCoupon = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const loading = useSelector(selectLoading);
  const actionLoading = useSelector(selectActionLoading);
  const successMessage = useSelector(selectSuccessMessage);
  const error = useSelector(selectError);
  const currentCoupon = useSelector(selectCurrentCoupon);

  // Form state
  const [reveal, setReveal] = useState({
    discountType: false,
    applyType: false,
    usageLimitType: false,
  });

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: 0,
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
  });

  // Track if coupon has been used
  const [hasBeenUsed, setHasBeenUsed] = useState(false);

  // Error state (local validation)
  const [validationErrors, setValidationErrors] = useState({
    code: [],
    discount: [],
    dates: [],
    usage: [],
    general: [],
  });

  // Refs
  const formRef = useRef(null);

  // ==================== LOAD COUPON DATA ====================

  useEffect(() => {
    if (id) {
      dispatch(getCouponById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentCoupon) {
      // Check if coupon has been used
      const isUsed = currentCoupon.totalUsedCount > 0;
      setHasBeenUsed(isUsed);

      // Format dates
      const startsAt = new Date(currentCoupon.startsAt);
      const expiresAt = new Date(currentCoupon.expiresAt);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setFormData({
        code: currentCoupon.code,
        discountType: currentCoupon.discountType,
        discountValue: currentCoupon.discountValue,
        applyType: currentCoupon.applyType,
        usageLimitType: currentCoupon.usageLimitType,
        perUserLimit: currentCoupon.perUserLimit || 1,
        maxTotalUsage: currentCoupon.maxTotalUsage || 100,
        startDate: formatDate(startsAt),
        startTime: formatTime(startsAt),
        endDate: formatDate(expiresAt),
        endTime: formatTime(expiresAt),
        description: currentCoupon.description,
        isActive: currentCoupon.isActive,
      });
    }
  }, [currentCoupon]);

  // ==================== HELPER FUNCTIONS ====================

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

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

  const validateForm = () => {
    const newErrors = {
      code: [],
      discount: [],
      dates: [],
      usage: [],
      general: [],
    };

    // Validate coupon code
    if (!formData.code || formData.code.trim().length < 3) {
      newErrors.code.push('Coupon code must be at least 3 characters long');
    }
    if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code.push('Coupon code must contain only uppercase letters and numbers');
    }

    // Validate discount value
    if (formData.discountValue <= 0) {
      newErrors.discount.push('Discount value must be greater than 0');
    }
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discount.push('Percentage discount cannot exceed 100%');
    }
    if (formData.discountType === 'fixed' && formData.discountValue > 10000) {
      newErrors.discount.push('Fixed discount seems too high (max ₹10,000)');
    }

    // Validate usage limits
    if (formData.usageLimitType === 'multiple-per-user') {
      if (!formData.perUserLimit || formData.perUserLimit <= 0) {
        newErrors.usage.push('Per user limit must be greater than 0');
      }
      if (formData.perUserLimit > 1000) {
        newErrors.usage.push('Per user limit seems too high (max 1000)');
      }
    }

    if (formData.usageLimitType === 'max-total') {
      if (!formData.maxTotalUsage || formData.maxTotalUsage <= 0) {
        newErrors.usage.push('Maximum total usage must be greater than 0');
      }
      if (formData.maxTotalUsage > 100000) {
        newErrors.usage.push('Maximum total usage seems too high (max 100,000)');
      }

      // Prevent reducing below current usage
      if (currentCoupon && formData.maxTotalUsage < currentCoupon.totalUsedCount) {
        newErrors.usage.push(
          `Cannot set limit below current usage (${currentCoupon.totalUsedCount} times used)`
        );
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

      if (endDateTime <= startDateTime) {
        newErrors.dates.push('End date and time must be after start date and time');
      }
    }

    // Validate description
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.general.push('Description must be at least 10 characters long');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare data for API
    const couponData = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      applyType: formData.applyType,
      usageLimitType: formData.usageLimitType,
      startsAt: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
      expiresAt: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
      isActive: formData.isActive,
    };

    // Add conditional fields based on usage limit type
    if (formData.usageLimitType === 'multiple-per-user') {
      couponData.perUserLimit = parseInt(formData.perUserLimit);
    } else if (formData.usageLimitType === 'max-total') {
      couponData.maxTotalUsage = parseInt(formData.maxTotalUsage);
    }

    // Dispatch update coupon action
    await dispatch(updateCoupon({ id, couponData }));
  };

  // ==================== EFFECTS ====================

  // Handle success
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, toastControls);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
        navigate('/admin/coupons');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch, navigate]);

  // Handle backend errors
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update coupon!", toastControls);

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
      } else {
        setValidationErrors(prev => ({
          ...prev,
          general: [error.message || 'An error occurred while updating the coupon']
        }));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

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

  // Show loading while fetching coupon
  if (loading && !currentCoupon) {
    return (
      <div className='px-3 py-10 flex justify-center items-center min-h-screen'>
        <Loader />
      </div>
    );
  }

  // Show error if coupon not found
  if (!loading && !currentCoupon) {
    return (
      <div className='px-3 py-10'>
        <div className="bg-red-950/30 border border-red-800 rounded p-6 text-center">
          <Icon icon="mdi:alert-circle" className="text-6xl text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Coupon Not Found</h2>
          <p className="text-zinc-400 mb-4">The coupon you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/coupons')}
            className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
          >
            Back to Coupons
          </button>
        </div>
      </div>
    );
  }

  const allErrors = [
    ...validationErrors.code, 
    ...validationErrors.discount, 
    ...validationErrors.dates,
    ...validationErrors.usage,
    ...validationErrors.general
  ];

  return (
    <div className='px-3 py-10' id='update-coupon-page'>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate('/admin/coupons')}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition"
        >
          <Icon icon="mdi:arrow-left" className="text-xl" />
        </button>
        <h1 className='ad-coupon-heading text-2xl font-semibold'>
          Update Coupon
        </h1>
      </div>

      {/* Usage Warning */}
      {hasBeenUsed && (
        <div className="mb-5 p-4 bg-amber-950/30 border border-amber-800 rounded">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:alert" className="text-2xl text-amber-400 mt-0.5" />
            <div>
              <h3 className="text-amber-400 font-medium mb-1">Coupon In Use</h3>
              <p className="text-sm text-amber-300/80">
                This coupon has been used <strong>{currentCoupon.totalUsedCount}</strong> {currentCoupon.totalUsedCount === 1 ? 'time' : 'times'} by{' '}
                <strong>{currentCoupon.userUsageHistory?.length || 0}</strong> {currentCoupon.userUsageHistory?.length === 1 ? 'user' : 'users'}.
                Be careful when modifying discount values or usage limits.
              </p>
            </div>
          </div>
        </div>
      )}

      <form id='update-coupon-form' onSubmit={handleSubmit} ref={formRef}>
        
        {/* Error Messages */}
        {allErrors.length > 0 && (
          <section className="mb-5 p-4 bg-red-950/30 border border-red-800 rounded">
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
                placeholder='e.g., SAVE50, WELCOME2024'
                className={`w-full h-10 px-3 bg-zinc-900 border ${
                  validationErrors.code.length > 0 ? 'border-red-500' : 'border-zinc-800'
                } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 uppercase`}
              />
              <p className="text-xs text-zinc-500 mt-1">Use uppercase letters and numbers only</p>
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
                placeholder='Brief description of this coupon (min 10 characters)'
                rows={3}
                className='w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm focus:outline-none focus:border-indigo-500 resize-none'
              />
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
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setReveal(prev => ({ ...prev, discountType: !prev.discountType }))}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500'
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
                  <div className='absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-[3px] overflow-hidden z-10'>
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
                  onChange={(e) => handleInputChange('discountValue', e.target.value)}
                  onWheel={handleNumberInputWheel}
                  min='0'
                  max={formData.discountType === 'percentage' ? '100' : '10000'}
                  step={formData.discountType === 'percentage' ? '1' : '10'}
                  placeholder={formData.discountType === 'fixed' ? 'Enter amount in ₹' : 'Enter percentage'}
                  className={`w-full h-10 px-3 ${formData.discountType === 'fixed' ? 'pl-8' : 'pr-8'} bg-zinc-900 border ${
                    validationErrors.discount.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
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
                  ? 'Enter the fixed discount amount in rupees' 
                  : 'Enter the discount percentage (0-100)'}
              </p>
            </div>

            {/* Apply Type */}
            <div>
              <label className='block text-sm text-zinc-400 mb-2'>
                Apply To <span className="text-red-400">*</span>
              </label>
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setReveal(prev => ({ ...prev, applyType: !prev.applyType }))}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500'
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
                  <div className='absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-[3px] overflow-hidden z-10'>
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
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setReveal(prev => ({ ...prev, usageLimitType: !prev.usageLimitType }))}
                  className='w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-[3px] text-sm text-left flex items-center justify-between focus:outline-none focus:border-indigo-500'
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
                  onChange={(e) => handleInputChange('perUserLimit', e.target.value)}
                  onWheel={handleNumberInputWheel}
                  min='1'
                  max='1000'
                  placeholder='e.g., 3'
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.usage.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Each user can use this coupon up to {formData.perUserLimit} {formData.perUserLimit === 1 ? 'time' : 'times'}
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
                  onChange={(e) => handleInputChange('maxTotalUsage', e.target.value)}
                  onWheel={handleNumberInputWheel}
                  min={currentCoupon?.totalUsedCount || 1}
                  max='100000'
                  placeholder='e.g., 100'
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.usage.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  This coupon can be used a total of {formData.maxTotalUsage} {formData.maxTotalUsage === 1 ? 'time' : 'times'} across all users
                  {currentCoupon?.totalUsedCount > 0 && (
                    <span className="text-amber-400"> (Already used {currentCoupon.totalUsedCount} {currentCoupon.totalUsedCount === 1 ? 'time' : 'times'})</span>
                  )}
                </p>
              </div>
            )}

            {formData.usageLimitType === 'once-per-user' && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-4">
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:information" className="text-blue-400 text-xl mt-0.5" />
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
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
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
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
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
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
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
                  className={`w-full h-10 px-3 bg-zinc-900 border ${
                    validationErrors.dates.length > 0 ? 'border-red-500' : 'border-zinc-800'
                  } rounded-[3px] text-sm focus:outline-none focus:border-indigo-500`}
                />
              </div>
            </div>

            {/* Display formatted date range */}
            {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400 mb-1">Coupon will be valid:</p>
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
              onClick={() => handleInputChange('isActive', !formData.isActive)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                formData.isActive ? 'bg-green-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.isActive ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className='text-sm'>
              {formData.isActive ? (
                <span className="text-green-400">Active (Coupon is enabled)</span>
              ) : (
                <span className="text-zinc-400">Inactive (Coupon is disabled)</span>
              )}
            </span>
          </div>
        </section>

        {/* Submit Buttons */}
        <section className="w-full mt-10 flex flex-col gap-2" id='update-coupon-btns'>
          <button
            type='submit'
            disabled={actionLoading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative tracking-wide"
          >
            {actionLoading ? <MiniLoading /> : 'Update Coupon'}
          </button>
          
          <button
            onClick={() => navigate("/admin/coupons")}
            type='button'
            disabled={actionLoading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-zinc-700 text-sm font-medium hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed relative tracking-wide"
          >
            Cancel
          </button>
        </section>
      </form>
    </div>
  );
};

export default UpdateCoupon;