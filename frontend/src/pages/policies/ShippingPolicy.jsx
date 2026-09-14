import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const ShippingPolicy = () => {
  return (
    <PolicyLayout title="Shipping & Delivery">
      <p className="lead text-lg text-zinc-600 leading-relaxed mb-8">
        This Shipping & Delivery Policy is part of our Terms and Conditions ("Terms") and should therefore be read alongside our main <Link to="/policies/terms-of-service" className="text-red-600 font-bold hover:underline">Terms of Service</Link>. Please review this policy carefully before purchasing our products.
      </p>

      {/* Light Theme "At a Glance" Box */}
      <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-xl mb-10 shadow-sm">
        <h3 className="text-[#0f0f0f] font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
          At a Glance
        </h3>
        <ul className="space-y-4 text-sm">
          <li className="flex justify-between border-b border-zinc-100 pb-3">
            <span className="text-zinc-600 font-medium">Processing Time</span>
            <span className="text-[#0f0f0f] font-bold">2-3 Business Days</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-3">
            <span className="text-zinc-600 font-medium">Estimated Delivery</span>
            <span className="text-[#0f0f0f] font-bold">4-7 Business Days</span>
          </li>
          <li className="flex justify-between pt-1">
            <span className="text-zinc-600 font-medium">Shipping Cost</span>
            <span className="text-red-600 font-bold">FREE (Prepaid Orders)</span>
          </li>
        </ul>
      </div>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Shipping Options</h2>
          <p className="text-zinc-600 leading-relaxed">We offer various shipping options. In some cases, a third-party supplier may manage our inventory and be responsible for shipping your products.</p>
          
          {/* Light Theme Highlight Box */}
          <div className="mt-5 p-5 bg-zinc-50 rounded-r-lg border-l-4 border-red-600 shadow-sm">
            <h4 className="font-bold text-[#0f0f0f] mb-1">Free Shipping</h4>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We offer free shipping for <strong className="text-[#0f0f0f]">prepaid orders only</strong>. Free shipping is available within India on all orders.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Do You Deliver Internationally?</h2>
          <p className="text-zinc-600 leading-relaxed">No. We strictly do not offer international shipping at this time.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Shipping Restrictions</h2>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li>We ship strictly within India.</li>
            <li>We do not deliver to certain remote regions, military addresses, or specific PIN codes.</li>
            <li>Cash on Delivery (COD) restrictions apply to certain areas.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Delays</h2>
          <p className="text-zinc-600 leading-relaxed">
            If delivery is delayed for any reason, we will let you know as soon as possible and will advise you of a revised estimated date for delivery. During holidays or sales, slight delays may occur.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Contact & Escalation Support</h2>
          <p className="text-zinc-600 leading-relaxed">
            We’re here to ensure your Noctowls order reaches you safely and on time. If you experience any issues related to shipping – such as delays, damaged packaging, or missing items – please don’t hesitate to reach out.
          </p>
          <ul className="mt-4 space-y-2 text-zinc-600">
            <li><strong className="text-[#0f0f0f]">Email:</strong> support@noctowls.com</li>
            <li><strong className="text-[#0f0f0f]">Contact Form:</strong> <Link to="/contact" className="text-red-600 font-bold hover:underline">Visit our Contact Us page</Link></li>
            <li><strong className="text-[#0f0f0f]">Response Time:</strong> Typically 24-48 business hours.</li>
          </ul>
          
          {/* Light Theme Escalation Box */}
          <div className="mt-5 p-6 border border-zinc-200 rounded-xl bg-white shadow-sm">
            <span className="text-[#0f0f0f] font-bold block mb-2 uppercase tracking-wider text-sm">Escalation Process</span>
            <p className="text-sm text-zinc-600 leading-relaxed">
              If you feel your concern hasn’t been resolved satisfactorily, you may escalate it by replying with <strong className="text-[#0f0f0f]">“URGENT – ESCALATION”</strong> in the subject line of your email. A senior support representative will prioritize your case.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Questions about Returns?</h2>
          <p className="text-zinc-600">
            If you have questions about returns, please review our <Link to="/policies/refund-policy" className="text-red-600 font-bold hover:underline">Return Policy</Link>.
          </p>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default ShippingPolicy;