import PolicyLayout from "../../components/layout/PolicyLayout";

const Disclaimer = () => {
  return (
    <PolicyLayout title="Disclaimer">
      <section className="space-y-10">
        
        <div className="bg-zinc-900/50 p-6 rounded border border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-3 uppercase flex items-center gap-2">
            Website Disclaimer
          </h2>
          <p>
            The information provided by Noctowls on this site is for general informational purposes only. All information is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.
          </p>
          <p className="mt-4 text-xs uppercase font-bold text-red-400 tracking-wide border-t border-zinc-700 pt-4">
            Under no circumstances shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided. Your use of the site is solely at your own risk.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">External Links Disclaimer</h2>
          <p>
            The Site may contain links to other websites or content belonging to third parties. Such external links are not investigated, monitored, or checked for accuracy by us. We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Affiliates Disclaimer</h2>
          <p>
            The Site may contain links to affiliate websites, and we receive an affiliate commission for any purchases made by you on the affiliate website using such links. We are a participant in the Amazon Services LLC Associates Program.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-3">Testimonials Disclaimer</h2>
          <p>
            The Site may contain testimonials by users of our products. These testimonials reflect the real-life experiences and opinions of such users. However, the experiences are personal to those particular users and may not necessarily be representative of all users.
          </p>
          <p className="mt-2 italic text-zinc-400">
            "Your individual results may vary."
          </p>
          <p className="mt-2">
            The views and opinions contained in the testimonials belong solely to the individual user and do not reflect our views and opinions.
          </p>
        </div>

      </section>
    </PolicyLayout>
  );
};

export default Disclaimer;