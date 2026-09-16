import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react'; 

import {
  createOrder,
  verifyPayment,
  getOrderSummary,
  clearCheckoutOrder,
  checkFlashSaleStatus, 
  selectCreateOrderLoading,
  selectVerifyPaymentLoading,
  selectOrderSummary,
  selectSummaryLoading,
  selectFlashSale, 
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

// List of Indian States for robust GST calculation (State selection preserved)
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
  const flashSale = useSelector(selectFlashSale);

  // ===================== LOCAL STATE =====================
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isGuest, setIsGuest] = useState(!isAuthenticated);

  // Timer & Popup State
  const [timeLeft, setTimeLeft] = useState(''); 
  const [showCongratsPopup, setShowCongratsPopup] = useState(false); 
  const [hasPopupBeenShown, setHasPopupBeenShown] = useState(false); 

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

  // DELETE MODAL STATE
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
        // 🔥 Trigger Flash Sale check the moment they hit the page
        await dispatch(checkFlashSaleStatus()).unwrap();

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

  // 🔥 NEW: Flash Sale Live Countdown Timer & Congrats Popup
  useEffect(() => {
    let interval;
    if (flashSale.isEligible && flashSale.expiresAt) {
      
      // Show popup once if eligible
      if (!hasPopupBeenShown) {
        setShowCongratsPopup(true);
        setHasPopupBeenShown(true);
      }

      const updateTimer = () => {
        const now = new Date().getTime();
        const expire = new Date(flashSale.expiresAt).getTime();
        const distance = expire - now;

        if (distance <= 0) {
          clearInterval(interval);
          setTimeLeft('');
          // Re-fetch to clear the state and recalculate normal prices
          dispatch(checkFlashSaleStatus());
          dispatch(getOrderSummary());
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft('');
    }

    return () => clearInterval(interval);
  }, [flashSale.isEligible, flashSale.expiresAt, dispatch, hasPopupBeenShown]);


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

  // OPEN DELETE MODAL
  const handleDeleteClick = (e, addressId) => {
    e.stopPropagation(); // Prevent radio selection
    setDeleteModal({ isOpen: true, addressId });
  };

  // CONFIRM DELETE
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

  // Calculate Sequential Totals
  const calculateTotals = () => {
    if (!orderSummary) {
      return {
        productsSubtotal: 0,
        phase00DiscountAmount: 0,
        couponDiscount: 0,
        subtotalAfterCoupon: 0,
        codFee: 0,
        finalTotal: 0,
        payNow: 0,
        payOnDelivery: 0,
      };
    }

    const productsSubtotal = orderSummary.productsSubtotal || 0;
    let phase00DiscountAmount = 0;

    // Check timer validity to apply math on frontend
    const now = new Date().getTime();
    const expire = flashSale.expiresAt ? new Date(flashSale.expiresAt).getTime() : 0;
    
    if (flashSale.isEligible && expire > now) {
      // Calculate quantity of phase-00 products only
      const phase00Qty = orderSummary.items
        .filter(item => !item.isFreeGift && item.product?.group === 'phase-00')
        .reduce((sum, item) => sum + item.quantity, 0);
      
      // ₹50 off PER quantity!
      phase00DiscountAmount = phase00Qty * 50;
    }

    // Phase-00 deduction happens BEFORE the coupon
    const subtotalAfterPhase00 = Math.max(0, productsSubtotal - phase00DiscountAmount);

    const couponDiscount = orderSummary.couponDiscount || 0;
    const subtotalAfterCoupon = Math.max(0, subtotalAfterPhase00 - couponDiscount);
    const codFee = paymentMethod === 'COD' ? 49 : 0;
    const finalTotal = subtotalAfterCoupon + codFee;

    return {
      productsSubtotal,
      phase00DiscountAmount,
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

      // Premium Black Theme for Razorpay
      theme: {
        color: '#0f0f0f',
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

  // Loading state (Light theme)
  if (summaryLoading || addressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f0f0f] mb-4"></div>
          <p className="text-[#0f0f0f] font-medium text-lg">
            {!razorpayLoaded ? 'Loading payment gateway...' : 'Loading checkout...'}
          </p>
        </div>
      </div>
    );
  }

  // Empty cart state (Light theme)
  if (!orderSummary || orderSummary.totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center max-w-md mx-auto px-2.5">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-[#0f0f0f] mb-4">Your cart is empty</h2>
          <p className="text-zinc-500 mb-6 font-medium">Add items to your cart before checkout</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-[#0f0f0f] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-md"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    // Light theme main wrapper
    <div className="min-h-screen pt-4 pb-28 md:pt-8 bg-[#f4f4f4] font-sans relative">

      {/* 🔥 NEW: OFFER POPUP MODAL WITH CSS SPRINKLES */}
      {showCongratsPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-sm">
          {/* Dynamic Styles for Pure CSS Sprinkles */}
          <style>{`
            @keyframes sprinkle-fall {
              0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            .sprinkle {
              position: absolute;
              top: -10%;
              animation: sprinkle-fall linear forwards;
            }
          `}</style>
          
          {/* Container for Sprinkles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className="sprinkle rounded-sm" 
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899'][Math.floor(Math.random() * 6)],
                  width: `${Math.random() * 6 + 4}px`,
                  height: `${Math.random() * 12 + 6}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`,
                }}
              />
            ))}
          </div>

          <div className="bg-white border-4 border-amber-400 rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-90 duration-300 relative z-10 text-center flex flex-col items-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-black text-[#0f0f0f] uppercase tracking-wide mb-2">Offer Unlocked!</h2>
            <p className="text-zinc-600 font-medium mb-6 leading-relaxed text-sm">
              Because you're purchasing a <span className="font-bold text-amber-500">Phase-00</span> product, you get an instant <span className="font-bold text-[#0f0f0f] text-base">₹50 OFF</span> per item!
            </p>
            <button 
              onClick={() => setShowCongratsPopup(false)}
              className="bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 w-full"
            >
              Claim My Discount
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-6">

        {/* 🔥 NEW: Phase-00 Flash Sale Marquee */}
        {flashSale.isEligible && timeLeft && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 shadow-lg shadow-amber-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2">
              <Icon icon="solar:stopwatch-bold" className="text-2xl animate-pulse" />
              <span className="font-black tracking-wide uppercase text-sm md:text-base">Phase-00 Offer Active!</span>
            </div>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/50"></div>
            <span className="font-medium text-sm text-center">You unlocked ₹50 OFF per Phase-00 item. Ends in <span className="font-black text-xl tabular-nums ml-1 bg-white/20 px-2 rounded-md">{timeLeft}</span></span>
          </div>
        )}

        <h1 className="text-2xl md:text-4xl font-black text-[#0f0f0f] uppercase tracking-wide mb-6 md:mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* ========== LEFT: FORMS ========== */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Guest Info Section */}
            {isGuest && (
              <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-zinc-200">
                <h2 className="text-lg md:text-xl font-bold text-[#0f0f0f] mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={guestInfo.name}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={guestInfo.email}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                    />
                    <small className="text-zinc-500 font-medium text-xs mt-2 ml-1 block">
                      We'll send your order confirmation to this email
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-zinc-200">
              <h2 className="text-lg md:text-xl font-bold text-[#0f0f0f] mb-5">
                Shipping Address
              </h2>

              {!isGuest && addresses.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4 mb-5 border-b border-zinc-100 pb-5">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={!useCustomAddress}
                        onChange={() => setUseCustomAddress(false)}
                        className="w-4 h-4 text-[#0f0f0f] focus:ring-[#0f0f0f]"
                      />
                      <span className="ml-2 text-sm font-bold text-[#0f0f0f]">
                        Saved addresses ({addresses.length})
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={useCustomAddress}
                        onChange={() => setUseCustomAddress(true)}
                        className="w-4 h-4 text-[#0f0f0f] focus:ring-[#0f0f0f]"
                      />
                      <span className="ml-2 text-sm font-bold text-[#0f0f0f]">
                        Enter new address
                      </span>
                    </label>
                  </div>

                  {!useCustomAddress && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => setSelectedAddressId(address._id)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedAddressId === address._id
                            ? 'border-[#0f0f0f] bg-zinc-50 shadow-sm'
                            : 'border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-sm'
                            }`}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              checked={selectedAddressId === address._id}
                              onChange={() => setSelectedAddressId(address._id)}
                              className="w-4 h-4 text-[#0f0f0f] mt-1 focus:ring-[#0f0f0f]"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-[#0f0f0f] flex flex-wrap items-center gap-2">
                                  {address.fullName}
                                  {address.isDefault && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                                      Default
                                    </span>
                                  )}
                                </h3>
                                {/* DELETE BUTTON */}
                                <button 
                                    onClick={(e) => handleDeleteClick(e, address._id)}
                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors font-medium"
                                    title="Delete address"
                                >
                                    Delete
                                </button>
                              </div>
                              
                              <div className="text-sm font-medium text-zinc-600 mt-2 space-y-0.5">
                                <p>{address.address}</p>
                                {address.landmark && <p>{address.landmark}</p>}
                                <p>
                                  {address.city}, {address.state} - <span className="font-bold text-[#0f0f0f]">{address.pincode}</span>
                                </p>
                                <p className="mt-2 text-[#0f0f0f] font-bold flex items-center gap-1">
                                  <Icon icon="solar:phone-bold" className="text-zinc-400" /> {address.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isGuest && addresses.length === 0 && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold" className="text-lg" />
                    No saved addresses yet. Your new address will be saved securely for future orders.
                  </p>
                </div>
              )}

              {(isGuest || addresses.length === 0 || useCustomAddress) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                        Full Name <span className="text-red-600">*</span>
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
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                        Phone Number <span className="text-red-600">*</span>
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
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                      Address <span className="text-red-600">*</span>
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
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none resize-none font-medium shadow-sm"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
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
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                        City <span className="text-red-600">*</span>
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
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                            State <span className="text-red-600">*</span>
                          </label>
                          <select
                            value={customAddress.state}
                            onChange={(e) =>
                              setCustomAddress({
                                ...customAddress,
                                state: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] transition-all outline-none font-bold shadow-sm"
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
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">
                            Pincode <span className="text-red-600">*</span>
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
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 transition-all outline-none font-medium shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="flex items-center gap-2 mt-4 ml-1">
                      <Icon icon="solar:check-circle-bold" className="text-green-600 text-lg" />
                      <p className="text-xs font-bold text-zinc-500">
                        Address will be automatically saved for future orders.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-zinc-200">
              <h2 className="text-lg md:text-xl font-bold text-[#0f0f0f] mb-5">
                Payment Method
              </h2>
              <div className="space-y-4">
                <label
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start ${paymentMethod === 'ONLINE'
                    ? 'border-[#0f0f0f] bg-zinc-50 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-400'
                    }`}
                >
                  <input
                    type="radio"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-[#0f0f0f] mt-1 focus:ring-[#0f0f0f]"
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-[#0f0f0f]">Online Payment</h3>
                    <p className="text-sm font-medium text-zinc-500 mt-1">
                      Pay securely via Razorpay (Cards, UPI, Wallets, Netbanking)
                    </p>
                    {/* Trust badges */}
                    <div className="mt-3 flex items-center gap-3">
                        <Icon icon="logos:visa" className="text-xl" />
                        <Icon icon="logos:mastercard" className="text-xl" />
                        <Icon icon="logos:google-pay" className="text-2xl" />
                        <Icon icon="logos:phonepe" className="text-xl" />
                    </div>
                  </div>
                </label>

                <label
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start ${paymentMethod === 'COD'
                    ? 'border-[#0f0f0f] bg-zinc-50 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-400'
                    }`}
                >
                  <input
                    type="radio"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-[#0f0f0f] mt-1 focus:ring-[#0f0f0f]"
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-[#0f0f0f] flex items-center gap-2">
                        Cash on Delivery
                        {paymentMethod === 'COD' && <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">Fee Applies</span>}
                    </h3>
                    <p className="text-sm font-medium text-zinc-500 mt-1">
                      Pay ₹49 online as COD confirmation fee. Pay the rest on delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ========== RIGHT: ORDER SUMMARY ========== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-zinc-200 lg:sticky lg:top-4">
              <h2 className="text-lg md:text-xl font-bold text-[#0f0f0f] mb-5 border-b border-zinc-100 pb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {orderSummary.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4"
                  >
                    <div className="relative shrink-0">
                        <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-200 shadow-sm"
                        />
                        {/* Quantity badge */}
                        <span className="absolute -top-2 -right-2 bg-[#0f0f0f] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">
                            {item.quantity}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#0f0f0f] line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-xs font-medium text-zinc-500 mt-1">
                        Size: <span className="uppercase font-bold text-[#0f0f0f]">{item.size.label}</span>
                      </p>
                      {item.isFreeGift && (
                        <span className="inline-block text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                          🎁 FREE GIFT
                        </span>
                      )}
                    </div>
                    {!item.isFreeGift && (
                      <div className="text-sm font-black text-[#0f0f0f]">
                        ₹{item.itemTotal.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Free Gifts Banner */}
              {orderSummary.freeGifts?.eligible && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 mb-5 shadow-sm">
                  <h3 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Icon icon="solar:gift-bold" className="text-base" /> Free Gifts
                  </h3>
                  {orderSummary.freeGifts.gifts.map((gift, index) => (
                    <p key={index} className="text-xs font-medium text-green-700/90 mb-1 flex items-center justify-between">
                      <span><span className="font-bold">{gift.quantity}x</span> {gift.name}</span>
                      {gift.originalPrice > 0 && <span className="line-through opacity-70">₹{gift.originalPrice}</span>}
                    </p>
                  ))}
                </div>
              )}

              {/* Coupon Section */}
              <div className="mb-6 border-b border-zinc-100 pb-6">
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
                      className="flex-1 px-4 py-2.5 text-sm font-medium bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0f0f0f] focus:border-[#0f0f0f] text-[#0f0f0f] placeholder-zinc-400 outline-none uppercase shadow-sm transition-colors"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || couponCode.length < 3 || couponValidation.loading}
                      className="px-6 py-2.5 text-sm font-bold bg-[#0f0f0f] text-white rounded-lg hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      {couponValidation.loading ? 'Applying' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon="mdi:ticket-percent" className="text-xl text-green-600" />
                      <div>
                        <span className="text-sm font-bold text-green-800 block uppercase tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          Saved ₹{totals.couponDiscount}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:text-red-700 font-bold underline transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponValidation.error && (
                  <p className="text-xs font-bold text-red-600 mt-2 ml-1">
                    {couponValidation.error}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm font-medium text-zinc-600">
                  <span>Products Subtotal</span>
                  <span className="font-bold text-[#0f0f0f]">
                    ₹{totals.productsSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 🔥 NEW: Phase-00 Discount Line Item */}
                {totals.phase00DiscountAmount > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>⚡ Phase-00 Discount</span>
                    <span>
                      - ₹{totals.phase00DiscountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {totals.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Coupon Discount</span>
                    <span>
                      - ₹{totals.couponDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {totals.codFee > 0 && (
                  <div className="flex justify-between text-sm font-medium text-zinc-600">
                    <span>COD Fee</span>
                    <span className="font-bold text-[#0f0f0f]">
                      ₹{totals.codFee}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-black pt-4 border-t border-zinc-200 mt-4 text-[#0f0f0f]">
                  <span>Total Amount</span>
                  <span>₹{totals.finalTotal.toLocaleString('en-IN')}</span>
                </div>

                {paymentMethod === 'COD' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 mt-4 shadow-sm">
                    <div className="flex justify-between text-xs font-bold text-amber-900 border-b border-amber-200/50 pb-2">
                      <span>Pay Now (COD Fee)</span>
                      <span>
                        ₹{totals.payNow.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-amber-900 pt-1">
                      <span>Pay on Delivery</span>
                      <span>
                        ₹{totals.payOnDelivery.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Place Order */}
              <div className="mt-8 space-y-4">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-red-600 mt-0.5 focus:ring-red-500 rounded border-zinc-300"
                  />
                  <span className="ml-2.5 text-xs font-medium text-zinc-500 group-hover:text-zinc-600 transition-colors">
                    I agree to the{' '}
                    <a
                      href="/policies/terms-of-service"
                      target="_blank"
                      className="text-[#0f0f0f] font-bold hover:text-red-600 underline"
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
                  className="w-full bg-[#0f0f0f] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2"
                >
                  {createLoading || verifyLoading ? (
                    <>
                      <Icon icon="eos-icons:loading" className="text-xl" />
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Icon icon="eos-icons:loading" className="text-xl" />
                      Loading Gateway...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'COD'
                        ? `Pay ₹${totals.payNow} & Place Order`
                        : `Pay ₹${totals.finalTotal.toLocaleString('en-IN')}`}
                        <Icon icon="solar:arrow-right-linear" className="text-lg" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-green-700 uppercase tracking-widest bg-green-50 py-2 rounded-lg border border-green-100">
                    <Icon icon="solar:lock-keyhole-bold" className="text-sm" />
                    <span>100% Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl w-full max-w-sm p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
                        <Icon icon="solar:trash-bin-trash-bold" className="text-2xl text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">Delete Address?</h3>
                    <p className="text-zinc-500 text-sm font-medium">
                        Are you sure you want to remove this address? This action cannot be undone.
                    </p>
                </div>
                
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => setDeleteModal({ isOpen: false, addressId: null })}
                        className="px-5 py-3 text-sm font-bold text-zinc-600 hover:text-[#0f0f0f] bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors w-full"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDeleteAddress}
                        disabled={deleteLoading}
                        className="px-5 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 w-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleteLoading ? (
                            <>
                                <Icon icon="eos-icons:loading" className="text-lg" />
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