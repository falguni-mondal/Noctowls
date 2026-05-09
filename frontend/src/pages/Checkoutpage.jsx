import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  createOrder,
  verifyPayment,
  getOrderSummary,
  clearCheckoutOrder,
  selectCreateOrderLoading,
  selectVerifyPaymentLoading,
  selectOrderSummary,
  selectSummaryLoading,
} from '../store/features/user/orderSlice';

import {
  getAddresses,
  getDefaultAddress,
  deleteAddress,
  selectAddresses,
  selectDefaultAddress,
  selectAddressLoading,
  selectDeleteAddressLoading,
} from '../store/features/user/addressSlice';

import {
  applyCoupon,
  removeCoupon,
  clearCouponValidation,
  selectCouponValidation,
  selectHasCouponApplied,
  selectAppliedCoupon,
} from '../store/features/user/cartSlice';

import { selectIsAuthenticated } from '../store/features/user/authSlice';

import toastControls from '../utils/global/toastControls';

// IMPORT GOOGLE PIXEL TRACKING
import { fireGooglePurchasePixel } from '../utils/googleTracking';

// IMPORT META PIXEL TRACKING
import { trackEvent } from '../utils/pixel/pixel';

// ✅ List of Indian States for robust GST calculation (State selection preserved)
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ===================== REDUX STATE =====================
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const createLoading = useSelector(selectCreateOrderLoading);
  const verifyLoading = useSelector(selectVerifyPaymentLoading);
  const couponValidation = useSelector(selectCouponValidation);
  const orderSummary = useSelector(selectOrderSummary);
  const summaryLoading = useSelector(selectSummaryLoading);
  const addresses = useSelector(selectAddresses);
  const defaultAddress = useSelector(selectDefaultAddress);
  const addressLoading = useSelector(selectAddressLoading);
  const deleteLoading = useSelector(selectDeleteAddressLoading);
  const hasCouponApplied = useSelector(selectHasCouponApplied);
  const appliedCoupon = useSelector(selectAppliedCoupon);

  // ===================== LOCAL STATE =====================
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isGuest, setIsGuest] = useState(!isAuthenticated);

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useCustomAddress, setUseCustomAddress] = useState(true);
  const [customAddress, setCustomAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  // [!code ++] DELETE MODAL STATE
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    addressId: null
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');

  // Terms state
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Guest info
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
  });

  // ===================== EFFECTS =====================

  // Load Razorpay script
  useEffect(() => {
    if (typeof window.Razorpay !== 'undefined') {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      setRazorpayLoaded(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      toast.error(
        'Failed to load payment gateway. Please refresh the page.',
        toastControls
      );
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch checkout data
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        // Get order summary
        const summaryResult = await dispatch(getOrderSummary()).unwrap();

        // Check cart validation
        if (summaryResult.validation && !summaryResult.validation.isValid) {
          toast.error('Some items in your cart are no longer available', toastControls);

          summaryResult.validation.results
            .filter(r => !r.isValid)
            .forEach((result) => {
              toast.warning(
                `${result.productName}: ${result.reason}`,
                toastControls
              );
            });

          setTimeout(() => navigate('/cart'), 3000);
          return;
        }

        // Get addresses (only for authenticated users)
        if (isAuthenticated) {
          await dispatch(getAddresses());
          await dispatch(getDefaultAddress());
          setIsGuest(false);
        } else {
          setIsGuest(true);
          setUseCustomAddress(true);
        }
      } catch (error) {
        console.error('Checkout data fetch error:', error);
        toast.error(error || 'Failed to load checkout', toastControls);
      }
    };

    fetchCheckoutData();

    return () => {
      dispatch(clearCheckoutOrder());
      dispatch(clearCouponValidation());
    };
  }, [dispatch, isAuthenticated, navigate]);

  // Set default address
  useEffect(() => {
    if (!isGuest && addresses.length > 0) {
      // User has saved addresses - show them by default
      setUseCustomAddress(false);

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else {
        // No default, select first address
        setSelectedAddressId(addresses[0]._id);
      }
    } else if (!isGuest && addresses.length === 0) {
      // User has no addresses - show form
      setUseCustomAddress(true);
    } else if (isGuest) {
      // Guest - always show form
      setUseCustomAddress(true);
    }
  }, [defaultAddress, addresses, isGuest]);

  // Sync coupon code with applied coupon
  useEffect(() => {
    if (hasCouponApplied && appliedCoupon) {
      setCouponCode(appliedCoupon.code);
    } else {
      setCouponCode('');
    }
  }, [hasCouponApplied, appliedCoupon]);

  // ===================== HANDLERS =====================

  // [!code ++] OPEN DELETE MODAL
  const handleDeleteClick = (e, addressId) => {
    e.stopPropagation(); // Prevent radio selection
    setDeleteModal({ isOpen: true, addressId });
  };

  // [!code ++] CONFIRM DELETE
  const confirmDeleteAddress = async () => {
    if (!deleteModal.addressId) return;

    try {
      await dispatch(deleteAddress(deleteModal.addressId)).unwrap();
      toast.success("Address deleted successfully", toastControls);

      // If the deleted address was selected, unselect it
      if (selectedAddressId === deleteModal.addressId) {
        setSelectedAddressId(null);
      }
      // Close modal
      setDeleteModal({ isOpen: false, addressId: null });
    } catch (error) {
      toast.error(error || "Failed to delete address", toastControls);
    }
  };

  // Get shipping address
  const getShippingAddress = () => {
    // For guests or when custom address is chosen
    if (isGuest || useCustomAddress || addresses.length === 0) {
      return customAddress;
    }

    // For logged-in users with saved addresses
    if (!useCustomAddress && selectedAddressId) {
      const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId);
      if (selectedAddress) {
        return {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          landmark: selectedAddress.landmark || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        };
      }
    }

    return null;
  };

  // Validate form
  const validateForm = () => {
    const shippingAddress = getShippingAddress();

    if (!shippingAddress) {
      toast.error('Please select or add a shipping address', toastControls);
      return false;
    }

    if (!shippingAddress.fullName || shippingAddress.fullName.trim().length < 2) {
      toast.error('Please enter a valid full name', toastControls);
      return false;
    }

    if (!shippingAddress.phone || !/^[0-9]{10}$/.test(shippingAddress.phone)) {
      toast.error('Please enter a valid 10-digit phone number', toastControls);
      return false;
    }

    if (!shippingAddress.address || shippingAddress.address.trim().length < 10) {
      toast.error('Please enter a complete address (minimum 10 characters)', toastControls);
      return false;
    }

    if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
      toast.error('Please enter a valid city', toastControls);
      return false;
    }

    if (!shippingAddress.state || shippingAddress.state.trim().length < 2) {
      toast.error('Please select a valid state', toastControls);
      return false;
    }

    if (!shippingAddress.pincode || !/^[0-9]{6}$/.test(shippingAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode', toastControls);
      return false;
    }

    if (isGuest) {
      if (!guestInfo.name || guestInfo.name.trim().length < 2) {
        toast.error('Please enter your name', toastControls);
        return false;
      }

      if (!guestInfo.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
        toast.error('Please enter a valid email address', toastControls);
        return false;
      }
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method', toastControls);
      return false;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to terms and conditions', toastControls);
      return false;
    }

    return true;
  };

  // Calculate totals (GST Removed from Logic as requested)
  const calculateTotals = () => {
    if (!orderSummary) {
      return {
        productsSubtotal: 0,
        couponDiscount: 0,
        subtotalAfterCoupon: 0,
        codFee: 0,
        finalTotal: 0,
        payNow: 0,
        payOnDelivery: 0,
      };
    }

    const productsSubtotal = orderSummary.productsSubtotal || 0;
    const couponDiscount = orderSummary.couponDiscount || 0;
    const subtotalAfterCoupon = Math.round(productsSubtotal - couponDiscount);
    const codFee = paymentMethod === 'COD' ? 49 : 0;
    const finalTotal = subtotalAfterCoupon + codFee;

    return {
      productsSubtotal,
      couponDiscount,
      subtotalAfterCoupon,
      codFee,
      finalTotal,
      payNow: paymentMethod === 'ONLINE' ? finalTotal : codFee,
      payOnDelivery: paymentMethod === 'COD' ? subtotalAfterCoupon : 0,
    };
  };

  const totals = calculateTotals();

  // Handle Razorpay payment
  const handleRazorpayPayment = (razorpayData, orderData) => {
    if (typeof window.Razorpay === 'undefined') {
      console.error('❌ Razorpay script not loaded');
      toast.error(
        'Payment gateway not loaded. Please refresh the page and try again.',
        toastControls
      );
      return;
    }

    if (!razorpayData || !razorpayData.orderId) {
      console.error('❌ Invalid Razorpay data:', razorpayData);
      toast.error('Payment initialization failed. Please try again.', toastControls);
      return;
    }

    console.log('💳 Opening Razorpay payment modal...');

    const options = {
      key: razorpayData.keyId,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      name: 'Noctowls',
      description:
        paymentMethod === 'COD'
          ? `COD Fee - Order #${orderData.orderNumber}`
          : `Order #${orderData.orderNumber}`,
      order_id: razorpayData.orderId,
      image: '/logo.png',

      handler: async (response) => {
        console.log('✅ Payment successful, verifying...');

        try {
          const verifyResult = await dispatch(
            verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: orderData.orderId,
            })
          ).unwrap();

          // TRACK PURCHASE EVENT (META)
          trackEvent('Purchase', {
            content_name: `Order #${verifyResult.order.orderNumber}`,
            content_ids: orderSummary?.items?.map((item) => item.product._id) || [],
            content_type: 'product',
            value: totals.finalTotal,
            currency: 'INR',
            order_id: verifyResult.order.orderId,
            num_items: orderSummary?.items?.length
          });

          // TRACK PURCHASE EVENT (GOOGLE)
          fireGooglePurchasePixel({
            orderNumber: verifyResult.order.orderNumber,
            finalTotal: totals.finalTotal,
            items: orderSummary?.items,
            email: isGuest ? guestInfo.email : '',
            phone: getShippingAddress()?.phone || ''
          });

          toast.success('Payment successful! Order confirmed.', toastControls);
          // ✅ REDIRECT HERE: Only on successful verification
          navigate(`/orders/${verifyResult.order.orderId}`);
        } catch (error) {
          console.error('❌ Payment verification failed:', error);
          toast.error(error || 'Payment verification failed', toastControls);
          // Stay on page on error (or redirect to error page if you prefer)
        }
      },

      prefill: {
        name: isGuest ? guestInfo.name : getShippingAddress()?.fullName || '',
        email: isGuest ? guestInfo.email : '',
        contact: getShippingAddress()?.phone || '',
      },

      notes: {
        order_id: orderData.orderId,
        payment_method: paymentMethod,
        customer_type: isGuest ? 'guest' : 'registered',
      },

      theme: {
        color: '#2563eb',
      },

      modal: {
        ondismiss: function () {
          console.log('⚠️ Payment modal dismissed');
          // 🛑 NO REDIRECT HERE. User stays on checkout page.
          toast.warning(
            'Payment cancelled. You can retry placing the order.',
            toastControls
          );
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        toast.error(
          'Payment failed: ' + (response.error.description || 'Unknown error'),
          toastControls
        );
        // 🛑 NO REDIRECT HERE. User stays on checkout page.
      });

      razorpay.open();
      console.log('✅ Razorpay modal opened');
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      toast.error('Failed to open payment gateway.', toastControls);
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode || couponCode.trim().length < 3) {
      toast.error('Please enter a valid coupon code (minimum 3 characters)', toastControls);
      return;
    }

    try {
      await dispatch(applyCoupon(couponCode.toUpperCase())).unwrap();
      await dispatch(getOrderSummary()).unwrap();
    } catch (error) {
      console.error(error)
    }
  };

  // Remove coupon
  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
      setCouponCode('');
      await dispatch(getOrderSummary()).unwrap();
    } catch (error) {
      toast.error(error, toastControls);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (!razorpayLoaded && typeof window.Razorpay === 'undefined') {
      toast.error(
        'Payment gateway is still loading. Please wait and try again.',
        toastControls
      );
      return;
    }

    // TRACK ADD PAYMENT INFO
    trackEvent('AddPaymentInfo', {
      content_ids: orderSummary?.items?.map((item) => item.product._id) || [],
      content_type: 'product',
      currency: 'INR',
      value: totals.finalTotal,
      payment_type: paymentMethod
    });

    const shippingAddress = getShippingAddress();

    const orderData = {
      shippingAddress,
      paymentMethod,
      couponCode: hasCouponApplied ? appliedCoupon.code : undefined,
    };

    if (isGuest) {
      orderData.guestInfo = {
        name: guestInfo.name,
        email: guestInfo.email,
      };
    }

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      // Handle the payment (Open modal)
      handleRazorpayPayment(result.razorpay, result.order);
    } catch (error) {
      toast.error(error || 'Failed to create order', toastControls);
    }
  };

  // ===================== RENDER =====================

  // Loading state
  if (summaryLoading || addressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-zinc-400 text-lg">
            {!razorpayLoaded ? 'Loading payment gateway...' : 'Loading checkout...'}
          </p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!orderSummary || orderSummary.totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md mx-auto px-2.5">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">Your cart is empty</h2>
          <p className="text-zinc-400 mb-6">Add items to your cart before checkout</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 pb-28 md:pt-8 bg-black">
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        <h1 className="text-2xl md:text-4xl font-semibold text-zinc-100 mb-6 md:mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* ========== LEFT: FORMS ========== */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Guest Info Section */}
            {isGuest && (
              <div className="bg-zinc-950 rounded-lg shadow-sm p-4 border border-zinc-900">
                <h2 className="text-lg md:text-xl font-semibold text-zinc-100 mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={guestInfo.name}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, name: e.target.value })
                      }
                      className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={guestInfo.email}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, email: e.target.value })
                      }
                      className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                    />
                    <small className="text-zinc-400 text-xs mt-2 block">
                      We'll send order confirmation to this email
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="bg-zinc-950 rounded-lg shadow-sm p-4 border border-zinc-900">
              <h2 className="text-lg md:text-xl font-semibold text-zinc-100 mb-4">
                Shipping Address
              </h2>

              {!isGuest && addresses.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={!useCustomAddress}
                        onChange={() => setUseCustomAddress(false)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-zinc-300">
                        Choose from saved addresses ({addresses.length})
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={useCustomAddress}
                        onChange={() => setUseCustomAddress(true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-zinc-300">
                        Enter new address
                      </span>
                    </label>
                  </div>

                  {!useCustomAddress && (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => setSelectedAddressId(address._id)}
                          className={`border-2 rounded p-4 cursor-pointer transition-all ${selectedAddressId === address._id
                            ? 'border-blue-500 bg-zinc-900'
                            : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              checked={selectedAddressId === address._id}
                              onChange={() => setSelectedAddressId(address._id)}
                              className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-zinc-100 flex items-center">
                                  {address.fullName}
                                  {address.isDefault && (
                                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </h3>
                                {/* [!code ++] DELETE BUTTON */}
                                <button 
                                    onClick={(e) => handleDeleteClick(e, address._id)}
                                    className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-900/50 bg-red-900/20 hover:bg-red-900/40 transition-colors"
                                    title="Delete address"
                                >
                                    Delete
                                </button>
                              </div>
                              
                              <p className="text-sm text-zinc-400 mt-1">{address.address}</p>
                              {address.landmark && (
                                <p className="text-sm text-zinc-400">{address.landmark}</p>
                              )}
                              <p className="text-sm text-zinc-400">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                              <p className="text-sm text-zinc-400 mt-1">
                                Phone: <span className="font-medium text-zinc-300">{address.phone}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isGuest && addresses.length === 0 && (
                <div className="mb-4 p-3 bg-blue-950 border border-blue-700 rounded">
                  <p className="text-sm text-blue-200">
                    📍 No saved addresses yet. Your address will be saved for future orders.
                  </p>
                </div>
              )}

              {(isGuest || addresses.length === 0 || useCustomAddress) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={customAddress.fullName}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        value={customAddress.phone}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            phone: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="House No., Building Name, Street"
                      rows="3"
                      value={customAddress.address}
                      onChange={(e) =>
                        setCustomAddress({
                          ...customAddress,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., Near Central Park"
                      value={customAddress.landmark}
                      onChange={(e) =>
                        setCustomAddress({
                          ...customAddress,
                          landmark: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter city"
                        value={customAddress.city}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      {/* ✅ State Dropdown ensures backend tax logic matches correctly */}
                      <select
                        value={customAddress.state}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            state: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 transition-all outline-none"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="6-digit"
                        maxLength="6"
                        value={customAddress.pincode}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            pincode: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full px-2.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="flex items-center gap-2 p-3 bg-blue-950 border border-blue-700 rounded">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-200">
                        This address will be automatically saved to your account for future orders.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-zinc-950 rounded-lg shadow-sm p-4 border border-zinc-900">
              <h2 className="text-lg md:text-xl font-semibold text-zinc-100 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`border rounded p-4 cursor-pointer transition-all flex items-start ${paymentMethod === 'ONLINE'
                    ? 'border-blue-500 bg-zinc-900'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <input
                    type="radio"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <h3 className="font-semibold text-zinc-100">Online Payment</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Pay securely via Razorpay (Cards, UPI, Wallets, Net Banking)
                    </p>
                  </div>
                </label>

                <label
                  className={`border rounded p-4 cursor-pointer transition-all flex items-start ${paymentMethod === 'COD'
                    ? 'border-blue-500 bg-zinc-900'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <input
                    type="radio"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 mt-1 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <h3 className="font-semibold text-zinc-100">Cash on Delivery</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Pay ₹49 online as COD fee. Rest on delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ========== RIGHT: ORDER SUMMARY ========== */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-950 rounded-lg shadow-sm p-4 border border-zinc-900 lg:sticky lg:top-4">
              <h2 className="text-lg md:text-xl font-semibold text-zinc-100 mb-5">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {orderSummary.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-3 pb-3 border-b border-zinc-900 last:border-0"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Size: {item.size.label} | Qty: {item.quantity}
                      </p>
                      {item.isFreeGift && (
                        <span className="inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded-full mt-1">
                          🎁 FREE GIFT
                        </span>
                      )}
                    </div>
                    {!item.isFreeGift && (
                      <div className="text-sm font-semibold text-zinc-100">
                        ₹{item.itemTotal}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Free Gifts */}
              {orderSummary.freeGifts?.eligible && (
                <div className="bg-green-950 border border-green-700 rounded p-3 mb-4">
                  <h3 className="text-sm font-semibold text-green-100 mb-2">
                    🎁 Free Gifts
                  </h3>
                  {orderSummary.freeGifts.gifts.map((gift, index) => (
                    <p key={index} className="text-xs text-green-100 mb-1">
                      {gift.quantity}x {gift.name}{' '}
                      {gift.originalPrice > 0 && `(Worth ₹${gift.originalPrice})`}
                    </p>
                  ))}
                </div>
              )}

              {/* Coupon Section */}
              <div className="mb-4">
                {!hasCouponApplied ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500 outline-none"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || couponCode.length < 3 || couponValidation.loading}
                      className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
                    >
                      {couponValidation.loading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-950 border border-green-700 rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <span className="text-sm font-semibold text-green-100 block">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-green-200">
                          Saved ₹{totals.couponDiscount}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-400 hover:text-red-300 font-medium underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponValidation.error && (
                  <p className="text-xs text-red-400 mt-2">
                    {couponValidation.error}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-zinc-900 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Products Subtotal</span>
                  <span className="font-semibold text-zinc-100">
                    ₹{totals.productsSubtotal}
                  </span>
                </div>

                {totals.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Coupon Discount</span>
                    <span className="font-medium text-green-400">
                      - ₹{totals.couponDiscount}
                    </span>
                  </div>
                )}

                {totals.codFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">COD Fee</span>
                    <span className="font-semibold text-zinc-100">
                      ₹{totals.codFee}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-base font-semibold pt-2 border-t border-zinc-900">
                  <span className="text-zinc-100">Total Amount</span>
                  <span className="text-zinc-100">₹{totals.finalTotal}</span>
                </div>

                {paymentMethod === 'COD' && (
                  <div className="bg-amber-950 border border-amber-700 rounded p-3 space-y-1 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-200">Pay Now (COD Fee)</span>
                      <span className="font-semibold text-amber-100">
                        ₹{totals.payNow}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-200">Pay on Delivery</span>
                      <span className="font-semibold text-amber-100">
                        ₹{totals.payOnDelivery}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Place Order */}
              <div className="mt-6 space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-0.5 focus:ring-blue-500 rounded"
                  />
                  <span className="ml-2 text-xs text-zinc-400">
                    I agree to the{' '}
                    <a
                      href="/policies/terms-of-service"
                      target="_blank"
                      className="text-blue-500 hover:underline"
                    >
                      Terms & Conditions
                    </a>
                  </span>
                </label>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    createLoading ||
                    verifyLoading ||
                    !agreeToTerms ||
                    !razorpayLoaded
                  }
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {createLoading || verifyLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Loading Payment Gateway...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'COD'
                        ? `Pay ₹${totals.payNow} & Place Order`
                        : `Pay ₹${totals.finalTotal}`}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>100% Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* [!code ++] DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Delete Address?</h3>
                    <p className="text-zinc-400 text-sm">
                        Are you sure you want to remove this address? This action cannot be undone.
                    </p>
                </div>
                
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => setDeleteModal({ isOpen: false, addressId: null })}
                        className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors w-full"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDeleteAddress}
                        disabled={deleteLoading}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center gap-2 w-full shadow-lg shadow-red-900/20"
                    >
                        {deleteLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;