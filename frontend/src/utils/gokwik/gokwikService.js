import userApi from "../../configs/userAxiosConfig"; 
import { toast } from "react-toastify";
import toastControls from "../../utils/global/toastControls";

// =========================================================
// HELPER: DYNAMICALLY LOAD GOKWIK SCRIPT
// =========================================================
const loadGokwikScript = () => {
  return new Promise((resolve, reject) => {
    if (window.gokwikSdk) {
      resolve();
      return;
    }

    // Check if script is already added but loading
    const existingScript = document.getElementById("gokwik-script");
    if (existingScript) {
      existingScript.addEventListener("load", resolve);
      return;
    }

    const script = document.createElement("script");
    script.id = "gokwik-script";
    // Use Sandbox or Production URL based on your env
    script.src = "https://sandbox.gokwik.co/kwikit.js"; 
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load GoKwik SDK"));
    document.head.appendChild(script);
  });
};

// =========================================================
// 1. CALL YOUR BACKEND TO GET SIGNATURE
// =========================================================
const fetchGokwikSignature = async (totalAmount) => {
  try {
    const response = await userApi.post("/gokwik/sign-request", { totalAmount });
    return response.data; 
  } catch (error) {
    console.error("Signature Fetch Error:", error);
    throw new Error("Failed to initialize secure checkout.");
  }
};

// =========================================================
// 2. OPEN GOKWIK MODAL
// =========================================================
export const openGokwikCheckout = async ({ totalAmount, onSuccess, onClose }) => {
  try {
    // A. Ensure SDK is loaded before doing anything
    if (!window.gokwikSdk) {
        // toast.info("Initializing Secure Checkout...", toastControls);
        await loadGokwikScript();
    }

    // B. Get Signature from Backend
    const signResponse = await fetchGokwikSignature(totalAmount);
    
    if (!signResponse.success) {
      throw new Error("Invalid signature response");
    }

    const { merchantId, signature, requestId, timestamp, environment } = signResponse.data;

    // C. Configuration Object
    const gokwikConfig = {
      merchant_id: merchantId,
      request_id: requestId,
      nonce: timestamp,   
      signature: signature,
      amount: totalAmount.toString(),
      merchant_param1: "payment_login", 
      env: environment,   
    };

    // D. Initialize
    window.gokwikSdk.init(gokwikConfig);

    // E. Listen for Events
    window.gokwikSdk.on("login_success", (response) => {
      console.log("✅ GoKwik Login Success:", response);
      if (onSuccess) onSuccess(response);
    });

    window.gokwikSdk.on("modal_close", () => {
      console.log("❌ GoKwik Modal Closed");
      if (onClose) onClose();
    });

  } catch (error) {
    console.error("GoKwik Init Error:", error);
    toast.error("Could not load checkout system. Check your connection.", toastControls);
  }
};