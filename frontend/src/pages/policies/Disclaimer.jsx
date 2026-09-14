import PolicyLayout from "../../components/layout/PolicyLayout";

const Disclaimer = () => {
  return (
    <PolicyLayout title="Disclaimer">
      <section className="space-y-10">
        
        {/* Light theme highlighted card */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-zinc-200 shadow-sm">
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3 uppercase flex items-center gap-2">
            Website Disclaimer
          </h2>
          <p className="text-zinc-600 leading-relaxed">
            The information provided by Noctowls on this site is for general informational purposes only. All information is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.
          </p>
          <p className="mt-5 text-xs uppercase font-bold text-red-600 tracking-wider border-t border-zinc-200 pt-5">
            Under no circumstances shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided. Your use of the site is solely at your own risk.
          </p>
        </div>

        <div>
          {/* Light theme heading */}
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">External Links Disclaimer</h2>
          <p className="text-zinc-600 leading-relaxed">
            The Site may contain links to other websites or content belonging to third parties. Such external links are not investigated, monitored, or checked for accuracy by us. We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Affiliates Disclaimer</h2>
          <p className="text-zinc-600 leading-relaxed">
            The Site may contain links to affiliate websites, and we receive an affiliate commission for any purchases made by you on the affiliate website using such links. We are a participant in the Amazon Services LLC Associates Program.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0f0f0f] mb-3">Testimonials Disclaimer</h2>
          <p className="text-zinc-600 leading-relaxed">
            The Site may contain testimonials by users of our products. These testimonials reflect the real-life experiences and opinions of such users. However, the experiences are personal to those particular users and may not necessarily be representative of all users.
          </p>
          <p className="mt-3 italic text-zinc-500 font-medium">
            "Your individual results may vary."
          </p>
          <p className="mt-3 text-zinc-600 leading-relaxed">
            The views and opinions contained in the testimonials belong solely to the individual user and do not reflect our views and opinions.
          </p>
        </div>

      </section>
    </PolicyLayout>
  );
};

export default Disclaimer;