import PolicyLayout from "../../components/layout/PolicyLayout";

const CookiePolicy = () => {
  return (
    <PolicyLayout title="Cookie Policy">
      <p className="mb-6">
        This Cookie Policy explains how Noctowls uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-3">What are cookies?</h2>
          <p>Cookies are small data files placed on your computer or mobile device. They are widely used to make websites work efficiently and provide reporting information. Cookies set by us are "first-party cookies". Cookies set by others (like analytics) are "third-party cookies".</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Why do we use cookies?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., shopping cart, login).</li>
            <li><strong>Performance/Analytics:</strong> To track traffic patterns and improve site performance.</li>
            <li><strong>Advertising:</strong> To serve relevant ads and track campaign success.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">How can I control cookies?</h2>
          <p>You have the right to decide whether to accept or reject cookies using your browser settings. Essential cookies cannot be rejected as they are strictly necessary for services.</p>
          <p className="mt-2 text-sm text-zinc-400">
            <strong>Browser Controls:</strong> Check the help menu of Chrome, Firefox, Safari, Edge, or Opera to learn how to manage cookies.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Updates & Contact</h2>
          <p>We may update this policy periodically. Please revisit regularly. For questions, contact us at:</p>
          <div className="mt-4 p-4 bg-zinc-950 border-l-4 border-red-600">
            <p className="text-white font-bold">Noctowls</p>
            <p>2nd floor, Arushi complex, ITI Aambagan, Muchipara</p>
            <p>Durgapur, West Bengal 713212, India</p>
            <p>Phone: 8348341112</p>
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default CookiePolicy;