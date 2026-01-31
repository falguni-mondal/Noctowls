import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout title="Privacy Policy">
      <p className="mb-8">
        This Privacy Notice for Noctowls describes how and why we might access, collect, store, use, and/or share your personal information when you use our services.
      </p>

      {/* Summary Box */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-12 shadow-lg shadow-black/50">
        <h3 className="text-white text-lg font-bold uppercase mb-4 border-b border-zinc-700 pb-2">Summary of Key Points</h3>
        <ul className="space-y-4 text-sm">
          <li><strong>What we collect:</strong> Personal info you provide (name, email, payment info via gateways) and automatic info (IP, device data).</li>
          <li><strong>Sensitive info:</strong> We do <span className="text-green-400">NOT</span> process sensitive personal information (race, religion, etc).</li>
          <li><strong>Sharing:</strong> We share data with vendors (payment processors, shipping partners) solely to fulfill services.</li>
          <li><strong>Security:</strong> We use organizational and technical measures to protect your data.</li>
          <li><strong>Your Rights:</strong> You can review, update, or delete your data at any time.</li>
        </ul>
      </div>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-bold text-white mb-3">1. What Information Do We Collect?</h2>
          <p><strong>Personal Information you disclose:</strong> Names, phone numbers, emails, addresses, billing info, and feedback.</p>
          <p className="mt-2"><strong>Payment Data:</strong> All payment data is handled securely by <strong>Razorpay</strong> and <strong>Cashfree Payments</strong>. We do not store your debit/credit card details.</p>
          <p className="mt-2"><strong>Automatic Collection:</strong> Log usage, IP address, device characteristics, location data (for shipping/analytics), and cookies.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">2. How Do We Process Your Information?</h2>
          <p>We process your info to provide services, fulfill orders, prevent fraud, communicate with you, and improve our products. This includes personalized shopping experiences and targeted advertising based on your preferences.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">3. Sharing Personal Information</h2>
          <p>We may share data with specific third-party vendors to perform services for us (e.g., Payment Processors, Order Fulfillment, Analytics). We have contracts ensuring they safeguard your data.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">4. Cookies</h2>
          <p>We use cookies to maintain security, prevent crashes, and assist with basic site functions. We also use third-party cookies (like Google Analytics) for marketing. You can control cookies via your browser settings. For more details, see our <Link to="/policies/cookie-policy" className="text-red-500 hover:underline">Cookie Policy</Link>.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">10. Pre-Order & Made-to-Order Clause</h2>
          <p>By placing pre-orders or custom orders, you acknowledge that production and shipping timelines may vary, and you agree to data processing required to fulfill these specific orders.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">16. Review, Update, or Delete Data</h2>
          <p>You have the right to request access to your personal information, correct inaccuracies, or delete your data. To exercise these rights, please visit our <Link to="/contact" className="text-red-500 hover:underline">Contact Page</Link>.</p>
        </div>

        <div className="bg-zinc-950 p-6 rounded border border-zinc-800 text-sm mt-8">
          <h4 className="text-white font-bold mb-2 uppercase">Company Information</h4>
          <p><strong>Legal Name:</strong> Priyanka Ghosh</p>
          <p><strong>Trade Name:</strong> Noctowls</p>
          <p><strong>GSTIN:</strong> 19BNYPG7506F1ZJ</p>
          <p><strong>Address:</strong> 2nd Floor, Arushi Complex, Muchipara, ITI Ambagan, 713212 Durgapur, West Bengal, India</p>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;