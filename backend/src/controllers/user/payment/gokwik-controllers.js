import crypto from "crypto";

// =========================================================================
// GENERATE CHECKSUM FOR GOKWIK INITIALIZATION
// =========================================================================
export const createGokwikSignature = async (req, res) => {
  try {
    // 1. Extract Request Data
    // 'totalAmount' is required to ensure the signature matches the transaction value
    const { totalAmount } = req.body;
    
    // 2. Get Credentials from Environment Variables
    const merchantId = process.env.GOKWIK_MERCHANT_ID;
    const secretKey = process.env.GOKWIK_APP_SECRET;

    if (!merchantId || !secretKey) {
        console.error("❌ GoKwik Error: Missing Credentials in .env");
        return res.status(500).json({ 
            success: false, 
            message: "Server payment configuration error." 
        });
    }

    // 3. Generate Unique Request Data
    // Request ID: Unique identifier for this specific checkout attempt
    const requestId = `GK_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const timestamp = Date.now().toString();

    // 4. Construct the Payload String
    // ⚠️ CRITICAL: The order of parameters must match GoKwik's requirement exactly.
    // Standard Pattern: merchant_id + request_id + amount + secret_key + timestamp
    const payloadString = `${merchantId}${requestId}${totalAmount || "0"}${secretKey}${timestamp}`;

    // 5. Generate SHA-256 Signature
    // This creates a secure hash that the frontend sends to GoKwik to prove authenticity
    const signature = crypto
      .createHash("sha256")
      .update(payloadString)
      .digest("hex");

    // 6. Return Data to Frontend
    return res.status(200).json({
      success: true,
      data: {
        merchantId,
        requestId,
        timestamp,
        signature,
        // Helper flag to tell frontend which script to load
        environment: process.env.GOKWIK_BASE_URL?.includes("sandbox") ? "sandbox" : "production"
      }
    });

  } catch (error) {
    console.error("GoKwik Signature Generation Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to generate payment signature." 
    });
  }
};