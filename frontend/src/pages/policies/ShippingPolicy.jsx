import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const ShippingPolicy = () => {
  return (
    <PolicyLayout title="Shipping & Delivery">
      <p className="lead text-lg text-zinc-100 mb-8">
        This Shipping & Delivery Policy is part of our Terms and Conditions ("Terms") and should therefore be read alongside our main <Link to="/policies/terms-of-service" className="text-red-500 hover:underline">Terms of Service</Link>. Please review this policy carefully before purchasing our products.
      </p>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg mb-10">
        <h3 className="text-white font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
          At a Glance
        </h3>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between border-b border-zinc-800 pb-2">
            <span>Processing Time</span>
            <span className="text-white font-bold">2-3 Business Days</span>
          </li>
          <li className="flex justify-between border-b border-zinc-800 pb-2">
            <span>Estimated Delivery</span>
            <span className="text-white font-bold">4-7 Business Days</span>
          </li>
          <li className="flex justify-between pt-2">
            <span>Shipping Cost</span>
            <span className="text-red-500 font-bold">FREE (Prepaid Orders)</span>
          </li>
        </ul>
      </div>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-3">Shipping Options</h2>
          <p>We offer various shipping options. In some cases, a third-party supplier may manage our inventory and be responsible for shipping your products.</p>
          <div className="mt-4 p-4 bg-zinc-900 rounded border-l-4 border-red-600">
            <h4 className="font-bold text-white mb-1">Free Shipping</h4>
            <p className="text-sm">
              We offer free shipping for <strong>prepaid orders only</strong>. Free shipping is available within India on all orders.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Do You Deliver Internationally?</h2>
          <p>No. We strictly do not offer international shipping at this time.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Shipping Restrictions</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>We ship strictly within India.</li>
            <li>We do not deliver to certain remote regions, military addresses, or specific PIN codes.</li>
            <li>Cash on Delivery (COD) restrictions apply to certain areas.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Delays</h2>
          <p>
            If delivery is delayed for any reason, we will let you know as soon as possible and will advise you of a revised estimated date for delivery. During holidays or sales, slight delays may occur.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Contact & Escalation Support</h2>
          <p>
            We’re here to ensure your Noctowls order reaches you safely and on time. If you experience any issues related to shipping – such as delays, damaged packaging, or missing items – please don’t hesitate to reach out.
          </p>
          <ul className="mt-4 space-y-2">
            <li><strong>Email:</strong> support@noctowls.com</li>
            <li><strong>Contact Form:</strong> <Link to="/contact" className="text-red-500 hover:underline">Visit our Contact Us page</Link></li>
            <li><strong>Response Time:</strong> Typically 24-48 business hours.</li>
          </ul>
          <div className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-950">
            <span className="text-white font-bold block mb-1">Escalation Process</span>
            <p className="text-sm">
              If you feel your concern hasn’t been resolved satisfactorily, you may escalate it by replying with <strong>“URGENT – ESCALATION”</strong> in the subject line of your email. A senior support representative will prioritize your case.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Questions about Returns?</h2>
          <p>
            If you have questions about returns, please review our <Link to="/policies/refund-policy" className="text-red-500 hover:underline">Return Policy</Link>.
          </p>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default ShippingPolicy;