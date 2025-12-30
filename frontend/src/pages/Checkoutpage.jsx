import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  createOrder,
  verifyPayment,
  validateCoupon,
  getOrderSummary,
  clearCouponValidation,
  clearCheckoutOrder,
  selectCheckoutOrder,
  selectRazorpayDetails,
  selectCreateOrderLoading,
  selectVerifyPaymentLoading,
  selectCouponValidation,
  selectOrderSummary,
  selectSummaryLoading,
  selectOrderError,
} from '../store/features/user/orderSlice';
import {
  getAddresses,
  getDefaultAddress,
  selectAddresses,
  selectDefaultAddress,
} from '../store/features/user/addressSlice';
import toastControls from '../utils/global/toastControls';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const checkoutOrder = useSelector(selectCheckoutOrder);
  const razorpayDetails = useSelector(selectRazorpayDetails);
  const createLoading = useSelector(selectCreateOrderLoading);
  const verifyLoading = useSelector(selectVerifyPaymentLoading);
  const couponValidation = useSelector(selectCouponValidation);
  const orderSummary = useSelector(selectOrderSummary);
  const summaryLoading = useSelector(selectSummaryLoading);
  const orderError = useSelector(selectOrderError);
  const addresses = useSelector(selectAddresses);
  const defaultAddress = useSelector(selectDefaultAddress);

  // Local state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [customAddress, setCustomAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Guest info (for non-logged-in users)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
  });
  const [isGuest, setIsGuest] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    // Get order summary
    dispatch(getOrderSummary());

    // Try to get addresses (will work only for logged-in users)
    dispatch(getAddresses()).then((result) => {
      if (result.type.endsWith('rejected')) {
        // User is not logged in - guest checkout
        setIsGuest(true);
        setUseCustomAddress(true);
      } else {
        // User is logged in
        setIsGuest(false);
        dispatch(getDefaultAddress());
      }
    });

    // Cleanup on unmount
    return () => {
      dispatch(clearCheckoutOrder());
      dispatch(clearCouponValidation());
    };
  }, [dispatch]);

  // Set default address when available
  useEffect(() => {
    if (defaultAddress && !useCustomAddress) {
      setSelectedAddressId(defaultAddress._id);
    }
  }, [defaultAddress, useCustomAddress]);

  // Handle coupon validation
  const handleValidateCoupon = async () => {
    if (!couponCode || couponCode.trim().length < 3) {
      toast.error('Please enter a valid coupon code', toastControls);
      return;
    }

    try {
      await dispatch(validateCoupon(couponCode.toUpperCase())).unwrap();
      setIsCouponApplied(true);
      toast.success('Coupon applied successfully!', toastControls);
    } catch (error) {
      toast.error(error, toastControls);
      setIsCouponApplied(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    dispatch(clearCouponValidation());
    setCouponCode('');
    setIsCouponApplied(false);
    toast.info('Coupon removed', toastControls);
  };

  // Get shipping address
  const getShippingAddress = () => {
    if (useCustomAddress) {
      return customAddress;
    }

    const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId);
    if (selectedAddress) {
      return {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      };
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

    // Validate shipping address
    if (!shippingAddress.fullName || shippingAddress.fullName.trim().length < 2) {
      toast.error('Please enter a valid full name', toastControls);
      return false;
    }

    if (!shippingAddress.phone || !/^[0-9]{10}$/.test(shippingAddress.phone)) {
      toast.error('Please enter a valid 10-digit phone number', toastControls);
      return false;
    }

    if (!shippingAddress.address || shippingAddress.address.trim().length < 10) {
      toast.error('Please enter a complete address', toastControls);
      return false;
    }

    if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
      toast.error('Please enter a valid city', toastControls);
      return false;
    }

    if (!shippingAddress.state || shippingAddress.state.trim().length < 2) {
      toast.error('Please enter a valid state', toastControls);
      return false;
    }

    if (!shippingAddress.pincode || !/^[0-9]{6}$/.test(shippingAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode', toastControls);
      return false;
    }

    // Validate guest info (if guest)
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

    // Validate payment method
    if (!paymentMethod) {
      toast.error('Please select a payment method', toastControls);
      return false;
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      toast.error('Please agree to terms and conditions', toastControls);
      return false;
    }

    return true;
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = (razorpayData, orderData) => {
    const options = {
      key: razorpayData.keyId,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      name: 'Your Store Name',
      description:
        paymentMethod === 'COD'
          ? `COD Fee - Order #${orderData.orderNumber}`
          : `Order #${orderData.orderNumber}`,
      order_id: razorpayData.orderId,
      image: '/logo.png', // Your logo

      handler: async (response) => {
        try {
          const verifyResult = await dispatch(
            verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: orderData.orderId,
            })
          ).unwrap();

          toast.success('Payment successful! Order confirmed.', toastControls);
          navigate(`/orders/${verifyResult.order.orderId}`);
        } catch (error) {
          toast.error(error || 'Payment verification failed', toastControls);
        }
      },

      prefill: {
        name: isGuest ? guestInfo.name : getShippingAddress()?.fullName,
        email: isGuest ? guestInfo.email : '',
        contact: getShippingAddress()?.phone,
      },

      notes: {
        order_id: orderData.orderId,
        payment_method: paymentMethod,
        customer_type: isGuest ? 'guest' : 'registered',
      },

      theme: {
        color: '#3399cc',
      },

      modal: {
        ondismiss: function () {
          toast.error('Payment cancelled', toastControls);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      toast.error('Payment failed: ' + response.error.description, toastControls);
    });

    razorpay.open();
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    const shippingAddress = getShippingAddress();

    const orderData = {
      shippingAddress,
      paymentMethod,
      couponCode: isCouponApplied ? couponCode.toUpperCase() : undefined,
    };

    // Add guest info if guest
    if (isGuest) {
      orderData.guestInfo = {
        name: guestInfo.name,
        email: guestInfo.email,
      };
    }

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();

      // Open Razorpay payment modal
      handleRazorpayPayment(result.razorpay, result.order);
    } catch (error) {
      toast.error(error || 'Failed to create order', toastControls);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!orderSummary) {
      return {
        productsSubtotal: 0,
        couponDiscount: 0,
        subtotalAfterCoupon: 0,
        codFee: 0,
        finalTotal: 0,
      };
    }

    const productsSubtotal = orderSummary.productsSubtotal;
    const couponDiscount = isCouponApplied
      ? couponValidation.discount?.amount || 0
      : 0;
    const subtotalAfterCoupon = productsSubtotal - couponDiscount;
    const codFee = paymentMethod === 'COD' ? 50 : 0;
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

  // Show loading
  if (summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Show error if cart is empty
  if (!orderSummary || orderSummary.totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart before checkout</p>
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-3">
        <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Info Section (Only for Guests) */}
            {isGuest && (
              <div className="bg-zinc-900 rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
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
                      className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      required
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
                      className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                    <small className="text-zinc-300 text-xs mt-2 block">
                      We'll send order confirmation to this email
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="bg-zinc-900 rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
                Shipping Address
              </h2>

              {/* Address Selection (for logged-in users) */}
              {!isGuest && addresses.length > 0 && (
                <>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={!useCustomAddress}
                        onChange={() => setUseCustomAddress(false)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-zinc-300">
                        Use saved address
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
                        Use different address
                      </span>
                    </label>
                  </div>

                  {!useCustomAddress && (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => setSelectedAddressId(address._id)}
                          className={`border-2 rounded p-4 cursor-pointer transition-all ${
                            selectedAddressId === address._id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-zinc-700'
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
                              <h3 className="font-semibold text-zinc-100 flex items-center">
                                {address.fullName}
                                {address.isDefault && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                              {address.landmark && (
                                <p className="text-sm text-gray-600">{address.landmark}</p>
                              )}
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Phone: <span className="font-medium">{address.phone}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Custom Address Form */}
              {(useCustomAddress || isGuest) && (
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
                        className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
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
                        className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
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
                      className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                      required
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
                      className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                        className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter state"
                        value={customAddress.state}
                        onChange={(e) =>
                          setCustomAddress({
                            ...customAddress,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
                      />
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
                        className="w-full px-4 py-2.5 border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-zinc-900 rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`border rounded p-4 cursor-pointer transition-all flex items-start ${
                    paymentMethod === 'ONLINE'
                      ? 'border-blue-500 bg-zinc-800'
                      : 'border-zinc-600 hover:border-zinc-700'
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
                    <p className="text-sm text-gray-300 mt-1">
                      Pay securely via Razorpay (Cards, UPI, Wallets, Net Banking)
                    </p>
                  </div>
                </label>

                <label
                  className={`border rounded p-4 cursor-pointer transition-all flex items-start ${
                    paymentMethod === 'COD'
                      ? 'border-blue-500 bg-zinc-800'
                      : 'border-zinc-600 hover:border-zinc-700'
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
                    <p className="text-sm text-gray-300 mt-1">
                      Pay ₹50 online as COD fee. Rest on delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-xl font-semibold text-zinc-100 mb-5">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {orderSummary.items.map((item) => (
                  <div key={item._id} className="flex gap-3 pb-3 border-b-[0.5px] border-gray-700 last:border-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Size: {item.size.label} | Qty: {item.quantity}
                      </p>
                      {item.isFreeGift && (
                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
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
                  <h3 className="text-sm font-semibold text-green-100 mb-3">🎁 Free Gifts</h3>
                  {orderSummary.freeGifts.gifts.map((gift, index) => (
                    <p key={index} className="text-xs text-green-100 mb-1">
                      {gift.quantity}x {gift.name} {gift.originalPrice === 0 ? "" : `Worth ₹${gift.originalPrice}`}
                    </p>
                  ))}
                </div>
              )}

              {/* Coupon Section */}
              <div className="mb-4">
                {!isCouponApplied ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      className="flex-1 px-3 py-2 text-sm border border-zinc-700 rounded focus:ring focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={couponValidation.loading || !couponCode}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {couponValidation.loading ? 'Validating...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-800">
                        {couponCode}
                      </span>
                      <span className="text-sm text-green-700">
                        -₹{couponValidation.discount?.amount}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 mt-8 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Products Subtotal</span>
                  <span className="font-semibold text-zinc-100">
                    ₹{totals.productsSubtotal}
                  </span>
                </div>

                {totals.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-medium text-green-600">- ₹{totals.couponDiscount}</span>
                  </div>
                )}

                {totals.codFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">COD Fee</span>
                    <span className="font-semibold text-zinc-100">₹{totals.codFee}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-semibold pt-2 mt-2">
                  <span className="text-zinc-100">Total Amount</span>
                  <span className="text-zinc-100">₹{totals.finalTotal}</span>
                </div>

                {paymentMethod === 'COD' && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-1 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-800">Pay Now (COD Fee)</span>
                      <span className="font-semibold text-amber-900">₹{totals.payNow}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-800">Pay on Delivery</span>
                      <span className="font-semibold text-amber-900">
                        ₹{totals.payOnDelivery}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Place Order */}
              <div className="mt-8 space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-0.5 focus:ring-blue-500 rounded"
                  />
                  <span className="ml-2 text-xs text-zinc-300">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Terms & Conditions
                    </a>
                  </span>
                </label>

                <button
                  onClick={handlePlaceOrder}
                  disabled={createLoading || verifyLoading || !agreeToTerms}
                  className="w-full bg-red-600 text-zinc-100 py-3 rounded font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {createLoading || verifyLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'COD'
                        ? `Pay ₹${totals.payNow} & Place Order`
                        : `Pay ₹${totals.finalTotal}`}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>100% Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;