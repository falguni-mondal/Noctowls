import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout title="Privacy Policy">
      <p className="mb-8 text-zinc-600 leading-relaxed">
        This Privacy Notice for Noctowls describes how and why we might access, collect, store, use, and/or share your personal information when you use our services.
      </p>

      {/* Summary Box - Light Theme */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-12 shadow-sm">
        <h3 className="text-[#0f0f0f] text-lg font-bold uppercase mb-4 border-b border-zinc-200 pb-3">Summary of Key Points</h3>
        <ul className="space-y-4 text-sm text-zinc-600">
          <li><strong className="text-[#0f0f0f]">What we collect:</strong> Personal info you provide (name, email, payment info via gateways) and automatic info (IP, device data).</li>
          <li><strong className="text-[#0f0f0f]">Sensitive info:</strong> We do <span className="text-green-600 font-bold">NOT</span> process sensitive personal information (race, religion, etc).</li>
          <li><strong className="text-[#0f0f0f]">Sharing:</strong> We share data with vendors (payment processors, shipping partners) solely to fulfill services.</li>
          <li><strong className="text-[#0f0f0f]">Security:</strong> We use organizational and technical measures to protect your data.</li>
          <li><strong className="text-[#0f0f0f]">Your Rights:</strong> You can review, update, or delete your data at any time.</li>
        </ul>
      </div>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">1. What Information Do We Collect?</h2>
          <p className="text-zinc-600 leading-relaxed"><strong className="text-[#0f0f0f]">Personal Information you disclose:</strong> Names, phone numbers, emails, addresses, billing info, and feedback.</p>
          <p className="mt-2 text-zinc-600 leading-relaxed"><strong className="text-[#0f0f0f]">Payment Data:</strong> All payment data is handled securely by <strong className="text-[#0f0f0f]">Razorpay</strong> and <strong className="text-[#0f0f0f]">Cashfree Payments</strong>. We do not store your debit/credit card details.</p>
          <p className="mt-2 text-zinc-600 leading-relaxed"><strong className="text-[#0f0f0f]">Automatic Collection:</strong> Log usage, IP address, device characteristics, location data (for shipping/analytics), and cookies.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">2. How Do We Process Your Information?</h2>
          <p className="text-zinc-600 leading-relaxed">We process your info to provide services, fulfill orders, prevent fraud, communicate with you, and improve our products. This includes personalized shopping experiences and targeted advertising based on your preferences.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">3. Sharing Personal Information</h2>
          <p className="text-zinc-600 leading-relaxed">We may share data with specific third-party vendors to perform services for us (e.g., Payment Processors, Order Fulfillment, Analytics). We have contracts ensuring they safeguard your data.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">4. Cookies</h2>
          <p className="text-zinc-600 leading-relaxed">We use cookies to maintain security, prevent crashes, and assist with basic site functions. We also use third-party cookies (like Google Analytics) for marketing. You can control cookies via your browser settings. For more details, see our <Link to="/policies/cookie-policy" className="text-red-600 font-bold hover:underline">Cookie Policy</Link>.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">10. Pre-Order & Made-to-Order Clause</h2>
          <p className="text-zinc-600 leading-relaxed">By placing pre-orders or custom orders, you acknowledge that production and shipping timelines may vary, and you agree to data processing required to fulfill these specific orders.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">16. Review, Update, or Delete Data</h2>
          <p className="text-zinc-600 leading-relaxed">You have the right to request access to your personal information, correct inaccuracies, or delete your data. To exercise these rights, please visit our <Link to="/contact" className="text-red-600 font-bold hover:underline">Contact Page</Link>.</p>
        </div>

        {/* Company Info Box - Light Theme */}
        <div className="bg-zinc-50 p-6 md:p-8 rounded-xl border border-zinc-200 text-sm mt-8 shadow-sm">
          <h4 className="text-[#0f0f0f] font-bold mb-3 uppercase tracking-wider">Company Information</h4>
          <div className="space-y-1.5 text-zinc-600">
            <p><strong className="text-[#0f0f0f]">Legal Name:</strong> Priyanka Ghosh</p>
            <p><strong className="text-[#0f0f0f]">Trade Name:</strong> Noctowls</p>
            <p><strong className="text-[#0f0f0f]">GSTIN:</strong> 19BNYPG7506F1ZJ</p>
            <p><strong className="text-[#0f0f0f]">Address:</strong> 2nd Floor, Arushi Complex, Muchipara, ITI Ambagan, 713212 Durgapur, West Bengal, India</p>
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;