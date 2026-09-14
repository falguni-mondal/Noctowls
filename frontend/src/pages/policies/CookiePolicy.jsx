import PolicyLayout from "../../components/layout/PolicyLayout";

const CookiePolicy = () => {
  return (
    <PolicyLayout title="Cookie Policy">
      {/* Light theme body text */}
      <p className="mb-6 text-zinc-600 leading-relaxed">
        This Cookie Policy explains how Noctowls uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
      </p>

      <section className="space-y-8">
        <div>
          {/* Light theme heading */}
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">What are cookies?</h2>
          <p className="text-zinc-600 leading-relaxed">Cookies are small data files placed on your computer or mobile device. They are widely used to make websites work efficiently and provide reporting information. Cookies set by us are "first-party cookies". Cookies set by others (like analytics) are "third-party cookies".</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Why do we use cookies?</h2>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li><strong className="text-[#0f0f0f]">Essential Cookies:</strong> Required for the website to function (e.g., shopping cart, login).</li>
            <li><strong className="text-[#0f0f0f]">Performance/Analytics:</strong> To track traffic patterns and improve site performance.</li>
            <li><strong className="text-[#0f0f0f]">Advertising:</strong> To serve relevant ads and track campaign success.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">How can I control cookies?</h2>
          <p className="text-zinc-600 leading-relaxed">You have the right to decide whether to accept or reject cookies using your browser settings. Essential cookies cannot be rejected as they are strictly necessary for services.</p>
          <p className="mt-2 text-sm text-zinc-500">
            <strong className="text-[#0f0f0f]">Browser Controls:</strong> Check the help menu of Chrome, Firefox, Safari, Edge, or Opera to learn how to manage cookies.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Updates & Contact</h2>
          <p className="text-zinc-600 leading-relaxed">We may update this policy periodically. Please revisit regularly. For questions, contact us at:</p>
          
          {/* Light theme contact card */}
          <div className="mt-4 p-5 bg-zinc-50 border-l-4 border-red-600 rounded-r-lg shadow-sm">
            <p className="text-[#0f0f0f] font-bold mb-1">Noctowls</p>
            <div className="text-zinc-600 text-sm space-y-1">
              <p>2nd floor, Arushi complex, ITI Aambagan, Muchipara</p>
              <p>Durgapur, West Bengal 713212, India</p>
              <p className="pt-1 font-medium">Phone: <span className="text-[#0f0f0f]">8348341112</span></p>
            </div>
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default CookiePolicy;