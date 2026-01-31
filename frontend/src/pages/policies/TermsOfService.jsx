import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const TermsOfService = () => {
  const tocItems = [
    "Our Services", "Intellectual Property Rights", "User Representation", "User Registration",
    "Products", "Purchases and Payment", "Return Policy", "Prohibited Activities",
    "User-Generated Contributions", "Contribution Licence", "Guidelines for Reviews", "Social Media",
    "Third-Party Websites and Content", "Services Management", "Privacy Policy", "Copyright Infringements",
    "Term and Termination", "Modification and Interruptions", "Governing Law", "Dispute Resolution",
    "Corrections", "Disclaimer", "Limitations of Liability", "Indemnification", "User Data",
    "Electronic Communications, Transactions and Signatures", "SMS Text Messaging", "Miscellaneous", "Handling Time Promise",
    "Community Contribution Clause", "Contact Us"
  ];

  return (
    <PolicyLayout title="Terms of Service">
      {/* Introduction */}
      <div className="mb-12 space-y-6 text-sm md:text-base">
        <div className="border-l-4 border-red-600 pl-6 py-2 bg-zinc-900/30 rounded-r-lg">
          <h3 className="text-white font-bold uppercase tracking-wide mb-2">Agreement to Our Legal Terms</h3>
          <p>
            We are <strong>Noctowls</strong> ('Company', 'we', 'us', or 'our'). We operate the website <span className="text-white">https://www.noctowls.com</span> (the 'Site'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms') (collectively, the 'Services').
          </p>
        </div>

        <p className="italic text-zinc-400">
          "Noctowls is an e-commerce platform ordering premium-quality desk mats and accessories designed to enhance your personal desk setup. Our products are built with performance, comfort, and aesthetics in mind."
        </p>

        <p>
          You can contact us by phone at <strong>+918348341112</strong>, email at <a href="mailto:help.noctowls@gmail.com" className="text-red-500 hover:underline">help.noctowls@gmail.com</a>, or by mail to <strong>2nd floor, Arushi complex, ITI Aambagan, Muchipara, Durgapur, West Bengal 713212, India</strong>.
        </p>

        <p>
          These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ('you'), and Noctowls, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. <strong className="text-white">IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong>
        </p>

        <div className="bg-zinc-900 p-4 rounded border border-zinc-800 text-xs text-zinc-400">
          <p>"Users will be notified through a banner on the website homepage."</p>
          <p className="mt-2">
            The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services. We recommend that you print a copy of these Legal Terms for your records.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl mb-16 shadow-lg">
        <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-800 pb-2">Table of Contents</h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {tocItems.map((item, index) => (
            <a 
              key={index} 
              href={`#section-${index + 1}`} 
              className="flex items-start gap-3 hover:text-red-500 transition-colors group"
            >
              <span className="text-zinc-600 font-mono text-xs pt-0.5 group-hover:text-red-800">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-16">

        {/* 1. Our Services */}
        <section id="section-1">
          <h2 className="text-2xl font-bold text-white mb-4">1. Our Services</h2>
          <p>The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>
        </section>

        {/* 2. IP Rights */}
        <section id="section-2">
          <h2 className="text-2xl font-bold text-white mb-4">2. Intellectual Property Rights</h2>
          <h3 className="text-lg font-bold text-white mb-2">Our intellectual property</h3>
          <p className="mb-4">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').</p>
          <p className="mb-4">Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties around the world. The Content and Marks are provided in or through the Services 'AS IS' for your personal, non-commercial use or internal business purpose only.</p>
          
          <h3 className="text-lg font-bold text-white mb-2 mt-6">Your use of our Services</h3>
          <p>Subject to your compliance with these Legal Terms, including the 'PROHIBITED ACTIVITIES' section below, we grant you a non-exclusive, non-transferable, revocable license to:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>access the Services; and</li>
            <li>download or print a copy of any portion of the Content to which you have properly gained access.</li>
          </ul>
          <p className="mb-4">Solely for your personal, non-commercial use or internal business purpose.</p>
          <p className="mb-4">Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>
          <p className="mb-4">If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: <a href="mailto:help.noctowls@gmail.com" className="text-red-500 hover:underline">help.noctowls@gmail.com</a>. If we ever grant you the permission to post, reproduce, or publicly display any part or our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.</p>
          <p>We reserve all rights not expressly granted to you in and to the Services, Content, and Marks. Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms, and your right to use our Services will terminate immediately.</p>

          <h3 className="text-lg font-bold text-white mb-2 mt-6">Your submissions and contributions</h3>
          <p className="mb-4">Please review this section and the 'PROHIBITED ACTIVITIES' section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when you post or upload any content through the Services.</p>
          
          <p className="mb-4"><strong>Submissions:</strong> By directly sending us any question, comment, suggestion, Idea, Feedback, or other Information about the Services ('Submissions'), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</p>
          
          <p className="mb-4"><strong>Contributions:</strong> The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality during which you may create, submit, post, display, transmit, publish, distribute, or broadcast content and materials to us or through the Services, including but not limited to text, writings, video, audio, photographs, music, graphics, comments, reviews, rating suggestions, personal information, or other material ('Contributions'). Any Submission that is publicly posted shall also be treated as a contribution. You understand that contributions may be viewable by other users of the Services and possibly through third-party websites.</p>
          
          <p className="mb-4"><strong>When you post Contributions, you grant us a licence (including use of your name, trademarks, and logos):</strong> By posting any Contributions, you grant us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and licence to: use, copy, reproduce, distribute, sell, resell, publish, broadcast, retitle, store, publicly perform, publicly display, reformat, translate, excerpt (in whole or in part), and exploit your Contributions (including, without limitation, your Image, name, and voice) for any purpose, commercial, advertising, or otherwise, to prepare derivative works with, or Incorporate Into other works, your contributions, and to sublicense the licences granted in this section. Our use and distribution may be in any media formats and through any media channels. This license includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial images you provide.</p>
          
          <p className="mb-2"><strong>You are responsible for what you post or upload:</strong> By sending us Submissions and/or posting Contributions through any part of the Services or making Contributions accessible through the Services by linking your account through the Services to any of your social networking accounts, you:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>confirm that you have read and agree with our 'PROHIBITED ACTIVITIES' and will not post, send, publish, upload, or transmit through the Services any Submission nor post any illegal Contribution, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading;</li>
            <li>to the extent permissible by applicable law, waive any and all moral rights to any such Submission and/or Contribution;</li>
            <li>warrant that any such Submission and/or Contributions are original to you or that you have the necessary rights and licenses to submit such Submissions and/or Contributions and that you have full authority to grant us the above-mentioned rights in relation to your Submissions and/or Contributions; and</li>
            <li>warrant and represent that your Submissions and/or Contributions do not constitute confidential information.</li>
          </ul>
          <p className="mb-4">You are solely responsible for your Submissions and/or Contributions, and you expressly agree to reimburse us for any and all losses that we may suffer because you breach (a) this section, (b) any third party's intellectual property rights, or (c) applicable law.</p>
          
          <p><strong>We may remove or edit your Content:</strong> Although we have no obligation to monitor any Contributions, we shall have the right to remove or edit any Contributions at any time without notice if, in our reasonable opinion, we consider such Contributions harmful or in breach of these Legal Terms. If we remove or edit any such Contributions, we may also suspend or disable your account and report you to the authorities.</p>
          
          <h3 className="text-lg font-bold text-white mb-2 mt-6">Copyright infringement</h3>
          <p>We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately refer to the 'COPYRIGHT INFRINGEMENTS' section below.</p>
        </section>

        {/* 3. User Rep */}
        <section id="section-3">
          <h2 className="text-2xl font-bold text-white mb-4">3. User Representations</h2>
          <p className="mb-4">By using the Services, you represent and warrant that:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>all registration information you submit will be true, accurate, and current. And complete;</li>
            <li>you will maintain the accuracy of such information and promptly update such registration information as necessary;</li>
            <li>you have the legal capacity and you agree to comply with these Legal Terms;</li>
            <li>you are not a minor in the jurisdiction in which you reside;</li>
            <li>you will not access the Services through automated or non-human means, whether through a bot, script or otherwise;</li>
            <li>you will not use the Services for any illegal or unauthorised purpose; and</li>
            <li>your use of the Services will not violate any applicable law or regulation.</li>
          </ol>
          <p className="mt-4">If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</p>
        </section>

        {/* 4. User Registration */}
        <section id="section-4">
          <h2 className="text-2xl font-bold text-white mb-4">4. User Registration</h2>
          <p>You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>
        </section>

        {/* 5. Products */}
        <section id="section-5">
          <h2 className="text-2xl font-bold text-white mb-4">5. Products</h2>
          <p>We make every effort to display as accurately as possible the colours, features, specifications, and details of the products available on the services. However, we do not guarantee that the colours, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors, and your electronic display may not accurately reflect the actual colours and details of the products. All products are subject to availability, and we cannot guarantee that Items will be in stock. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.</p>
        </section>

        {/* 6. Purchases and Payment */}
        <section id="section-6">
          <h2 className="text-2xl font-bold text-white mb-4">6. Purchases and Payment</h2>
          <p className="mb-2">We accept the following forms of payment:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>UPI, Wallets, Net Banking</li>
            <li>Visa</li>
            <li>Mastercard</li>
          </ul>
          <p className="mb-4">You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update your account and payment Information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in Indian Rupees (INR).</p>
          <p className="mb-4">You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.</p>
          <p>We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.</p>
        </section>

        {/* 7. Return Policy */}
        <section id="section-7">
          <h2 className="text-2xl font-bold text-white mb-4">7. Return Policy</h2>
          <p>Please review our Return Policy prior to making any purchases: <Link to="/policies/refund-policy" className="text-red-500 hover:underline">Return Policy</Link>.</p>
        </section>

        {/* 8. Prohibited Activities */}
        <section id="section-8">
          <h2 className="text-2xl font-bold text-white mb-4">8. Prohibited Activities</h2>
          <p className="mb-4">You may not access or use the Services for any purpose other than for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
          <p className="mb-2">As a user of the Services, you agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
            <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any content, or enforce limitations on the use of the Services and/or the Content contained therein.</li>
            <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
            <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
            <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
            <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
            <li>Engage in unauthorized framing of or linking to the Services.</li>
            <li>Upload or transmit (or attempt to upload or transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting or repetitive text), That interferes with any party's uninterrupted use and enjoyment of the Services or modes, Impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.</li>
            <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data-gathering and extraction tools.</li>
            <li>Delete the copyright or other proprietary rights notice from any Content.</li>
            <li>Attempt to impersonate another user or person, or use the username of another user.</li>
            <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ('gifs'), 1 x 1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as 'spyware' or 'passive collection mechanisms' or 'pcms').</li>
            <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
            <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
            <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services. Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other programming languages or code.</li>
            <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
            <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including, without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorized script or other software.</li>
            <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
            <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means to send unsolicited email, or create user accounts by automated means or under false pretenses.</li>
            <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
            <li>Use the Services to advertise or offer to sell goods and services.</li>
            <li>Sell or otherwise transfer your profile.</li>
          </ul>
        </section>

        {/* 9. User Generated */}
        <section id="section-9">
          <h2 className="text-2xl font-bold text-white mb-4">9. User-Generated Contributions</h2>
          <p className="mb-4">The Services may Invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments. Suggestions, personal Information, or other material (collectively, 'Contributions'). Contributions may be viewable by other users or the Services and through third-party websites. As such, any contributions you transmit may be treated as non-confidential and non-proprietary. When you create or make available any Contributions, you thereby represent and warrant that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The creation, distribution, transmission, public display, or performance. And the accessing, downloading, or copying of your Contributions does not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.</li>
            <li>You are the creator and owner or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Services, and other users of the Services to use your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
            <li>You have the written consent, release, and/or permission of each and every identifiable person in your Contributions to use the name or likeness of each and every such identifiable person to enable inclusion and use of your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
            <li>Your Contributions are not false, Inaccurate, or misleading.</li>
            <li>Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.</li>
            <li>Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).</li>
            <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
            <li>Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote violence against a specific person or class of people.</li>
            <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
            <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
            <li>Your Contributions do not violate any applicable law concerning child pornography, or are otherwise intended to protect the health or well-being of minors.</li>
            <li>Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.</li>
            <li>Your Contributions do not otherwise violate, or link to material that violates, any provision of these Legal Terms, or any applicable law or regulation.</li>
          </ul>
          <p className="mt-4">Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things, termination or suspension of your rights to use the Services.</p>
        </section>

        {/* 10. Contribution Licence */}
        <section id="section-10">
          <h2 className="text-2xl font-bold text-white mb-4">10. Contribution Licence</h2>
          <p className="mb-4">By posting your Contributions to any part of the Services, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive. Transferable, royalty-free. Fully-paid, worldwide rights, and license to host, use. Copy, reproduce, disclose. Sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reform, translate, transmit, excerpt (in whole or in part), and distribute such Contributions (including, without limitation, your image and voice) for any purpose, commercial. Advertising, or otherwise, and to prepare derivative works of. Or incorporate into other works, such as Contributions, and grant and authorize sublicences of the foregoing. The use and distribution may occur in any media formats and through any media channels.</p>
          <p className="mb-4">This license will apply to any form, media, or technology now known or hereafter developed, and includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial Images you provide. You waive all moral rights in your Contributions, and you warrant that moral rights have not otherwise been asserted in your Contributions.</p>
          <p className="mb-4">We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any Intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for your Contributions to the Services, and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.</p>
          <p>We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise change any Contributions; (2) to re-categorize any Contributions to place them in more appropriate locations on the Services; and (3) to pre-screen or delete any contributions at any time and for any reason, without notice. We have no obligation to monitor your Contributions.</p>
        </section>

        {/* 11. Guidelines for Reviews */}
        <section id="section-11">
          <h2 className="text-2xl font-bold text-white mb-4">11. Guidelines for Reviews</h2>
          <p className="mb-2">We may provide you with areas on the services to leave reviews or ratings. When posting a review, you must comply with the following criteria:</p>
          <ol className="list-decimal pl-5 mb-4 space-y-1">
            <li>you should have firsthand experience with the person/entity being reviewed;</li>
            <li>your reviews should not contain offensive profanity, or abusive, racist, offensive, or hateful language;</li>
            <li>your reviews should not contain discriminatory references based on religion, race, gender, national origin, age, marital status, sexual orientation, or disability;</li>
            <li>your reviews should not contain references to illegal activity;</li>
            <li>you should not be affiliated with competitors if posting negative reviews;</li>
            <li>you should not make any conclusions as to the legality of conduct;</li>
            <li>you may not post any false or misleading statements; and</li>
            <li>you may not organise a campaign encouraging others to post reviews, whether positive or negative.</li>
          </ol>
          <p>We may accept, reject, or remove reviews in our sole discretion. We have absolutely no obligation to screen reviews or to delete reviews, even if anyone considers reviews objectionable or inaccurate. Reviews are not endorsed by us, and do not necessarily represent our opinions or the views of any of our affiliates or partners. We do not assume liability for any review or for any damages, liabilities, or losses resulting from any review. By posting a review, you hereby grant us a perpetual, non-exclusive, worldwide, royalty-free, fully paid, assignable, and sublicensable right and license to reproduce, modify, translate, transmit by any means, display, perform, and/or distribute all content relating to the review.</p>
        </section>

        {/* 12. Social Media */}
        <section id="section-12">
          <h2 className="text-2xl font-bold text-white mb-4">12. Social Media</h2>
          <p className="mb-4">As part of the functionality of the Services, you may link your account with online accounts you have with third-party service providers (each such account, a 'Third-Party Account') by either: (1) providing your Third-Party Account login information through the Services: or (2) allowing us to access your Third-Party Account, as is permitted under the applicable terms and conditions that govern your use of each Third-Party Account. You represent and warrant that you are entitled to disclose your Third-Party Account login information to us and/or grant us access to your Third-Party Account, without breach by you of any of the terms and conditions that govern your use of the applicable Third-Party Account, and without obligating us to pay any fees or making us subject to any usage limitations imposed by the third-party service provider of the Third-Party Account. By granting us access to any Third-Party Accounts, you understand that (1) we may access, make available, and store (if applicable) any content that you have provided to and stored in your Third-Party Account (the 'Social Network Content') so that it is available on and through the Services via your account, including without limitation any friend lists and (2) we may submit to and receive from your Third-Party Account additional information to the extent you are notified when you link your account with the Third-Party Account. Depending on the Third-Party Accounts you choose and subject to the privacy settings that you have set in such Third-Party Accounts, personally identifiable information that you post to your Third-Party Accounts may be available on and through your account on the Services. Please note that if a Third-Party Account or associated service becomes unavailable or our access to such Third-Party Account is terminated by the third-party service provider, then Social Network Content may no longer be available on and through the Services. You will have the ability to disable the connection between your account on the Services and your Third-Party Accounts at any time. PLEASE NOTE THAT YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS. We make no effort to review any Social Network Content for any purpose, including but not limited to accuracy, legality, or non-infringement, and we are not responsible for any Social Network Content. You acknowledge and agree that we may access your email address book associated with a Third-Party Account and your contacts list stored on your mobile device or tablet computer solely for purposes of identifying and informing you of those contacts who have also registered to use the Services. You can deactivate the connection between the Services and your Third-Party Account by contacting us using the contact information below or through your account settings (if applicable). We will attempt to delete any information stored on our servers that was obtained through such Third-Party Account, except the username and profile picture that become associated with your account.</p>
        </section>

        {/* 13. Third-Party Websites */}
        <section id="section-13">
          <h2 className="text-2xl font-bold text-white mb-4">13. Third-Party Websites and Content</h2>
          <p>The Services may contain (or you may be sent via the Site) links to other websites ('Third-Party Websites') as well as articles, photographs, text, and graphics. Pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ('Third-Party Content'). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us. And we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services, including the content, accuracy, offensiveness, opinions, reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content. Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not imply approval or endorsement thereof by us. If you decide to leave the Services and access the Third-Party Websites or to use or install any Third-Party Content, you do so at your own risk, and you should be aware that these Legal Terms no longer govern. You should review the applicable terms and policies, including privacy and data gathering practices, of any website to which you navigate from the Services or relating to any applications you use or install from the Services. Any purchases you make through Third-Party Websites will be through other websites and from other companies, and we take no responsibility whatsoever in relation to such purchases, which are exclusively between you and the applicable third party. You agree and acknowledge that we do not endorse the products or services offered on Third-Party Websites, and you shall hold us blameless from any harm caused by your purchase of such products or services. Additionally, you shall hold us blameless from any losses sustained by you or harm caused to you relating to or resulting in any way from any Third-Party Content or any content on Third-Party Websites.</p>
        </section>

        {/* 14. Services Management */}
        <section id="section-14">
          <h2 className="text-2xl font-bold text-white mb-4">14. Services Management</h2>
          <p className="mb-2">We reserve the right, but not the obligation, to:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>monitor the Services for violations of these Legal Terms;</li>
            <li>take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities;</li>
            <li>in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof;</li>
            <li>In our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable any files and content that are excessive in size or are in any way burdensome to our systems; and</li>
            <li>otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</li>
          </ol>
        </section>

        {/* 15. Privacy Policy */}
        <section id="section-15">
          <h2 className="text-2xl font-bold text-white mb-4">15. Privacy Policy</h2>
          <p>We care about data privacy and security. Please review our Privacy Policy: <Link to="/policies/privacy-policy" className="text-red-500 hover:underline">Privacy Policy</Link>. By using the Services, you agree to be bound by our Privacy Policy, which is Incorporated Into these Legal Terms. Please be advised that the Services are hosted in India. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in India, then through your continued use of the Services, you are transferring your data to India, and you expressly consent to have your data transferred to and processed in India.</p>
        </section>

        {/* 16. Copyright Infringements */}
        <section id="section-16">
          <h2 className="text-2xl font-bold text-white mb-4">16. Copyright Infringements</h2>
          <p>We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a 'Notification'). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to applicable law, you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Services infringes your copyright, you should consider first contacting an attorney.</p>
        </section>

        {/* 17. Term and Termination */}
        <section id="section-17">
          <h2 className="text-2xl font-bold text-white mb-4">17. Term and Termination</h2>
          <p className="mb-4">These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANT Y, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.</p>
          <p>If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including, without limitation, pursuing civil, criminal, and injunctive redress.</p>
        </section>

        {/* 18. Modification and Interruptions */}
        <section id="section-18">
          <h2 className="text-2xl font-bold text-white mb-4">18. Modification and Interruptions</h2>
          <p className="mb-4">We reserve the right to change, modify, or remove the contents of the services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We also reserve the right to modify or discontinue all or part of the Services without notice at any time. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</p>
          <p>We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or Inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services. Nothing in these Legal Terms will be construed to obligate us to maintain and support the Services or to supply any corrections, updates, or releases in connection therewith.</p>
        </section>

        {/* 19. Governing Law */}
        <section id="section-19">
          <h2 className="text-2xl font-bold text-white mb-4">19. Governing Law</h2>
          <p>These Legal Terms shall be governed by and defined following the laws of India. Noctowls and you irrevocably consent that the courts of India shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</p>
        </section>

        {/* 20. Dispute Resolution */}
        <section id="section-20">
          <h2 className="text-2xl font-bold text-white mb-4">20. Dispute Resolution</h2>
          
          <h3 className="text-lg font-bold text-white mb-2">Informal Negotiations</h3>
          <p className="mb-4">To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a 'Dispute' and collectively, the 'Disputes') brought by either you or us (individually, a 'Party' and collectively, the 'Parties'), the Parties agree to first attempt lo negotiate any Dispute (except those Disputes expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Binding Arbitration</h3>
          <p className="mb-4">MY dispute arising out of or In connection with these Legal Terms, Including any question regarding Its existence, validly, or termination, shall be referred to and finally resolved by the International Commercial Arbitration Court under the European Arbitration Chamber (Belgium, Brussels, Avenue Louise, 146) according to the Rules of this ICAC, which, as a result of referring to It, Is considered as the part of this clause. The number of arbitrators shall be one (1). The seat, or legal place, of arbitration shall be Durgapur, West Bengal, India. The language of the proceedings shall be English. The governing law of these Legal Terms shall be the substantive law of India.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Restrictions</h3>
          <p className="mb-4">The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilise class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Exceptions to Informal Negotiations and Arbitration</h3>
          <p>The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorised use; and (c) any claim for injunctive relief. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable, and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction of that court.</p>
        </section>

        {/* 21. Corrections */}
        <section id="section-21">
          <h2 className="text-2xl font-bold text-white mb-4">21. Corrections</h2>
          <p>There may be information on the Services that contains typographical errors, Inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the Information on the Services at any time, without prior notice.</p>
        </section>

        {/* 22. Disclaimer */}
        <section id="section-22">
          <h2 className="text-2xl font-bold text-white mb-4">22. Disclaimer</h2>
          <div className="p-6 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-300 leading-relaxed uppercase">
            <p>THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            <p className="mt-4">WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORISED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.</p>
            <p className="mt-4">WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGEMENT AND EXERCISE CAUTION WHERE APPROPRIATE.</p>
          </div>
        </section>

        {/* 23. Limitations of Liability */}
        <section id="section-23">
          <h2 className="text-2xl font-bold text-white mb-4">23. Limitations of Liability</h2>
          <div className="p-6 bg-zinc-900 border-l-4 border-red-600 rounded-r text-sm text-zinc-300 leading-relaxed uppercase">
            <p>IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p className="mt-4 font-bold text-white">NOT WITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE LESSER OF THE AMOUNT PAID, IF ANY, BY YOU TO US OR "OUR LIABILITY FOR ANY CLAIM ARISING FROM YOUR USE OF OUR PRODUCTS OR SERVICES SHALL BE LIMITED TO THE AMOUNT YOU PAID FOR THE ITEM, OR ₹ 1,000, WHICHEVER IS LOWER."</p>
            <p className="mt-4">CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.</p>
          </div>
        </section>

        {/* 24. Indemnification */}
        <section id="section-24">
          <h2 className="text-2xl font-bold text-white mb-4">24. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, and partners. And employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys· fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties outlined in these Legal Terms; (5) your Violation of the rights or a third party, Including but not limited to Intellectual property rights; or (6) any oven harmful act toward any other user or the services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding that is subject to this indemnification upon becoming aware of it.</p>
        </section>

        {/* 25. User Data */}
        <section id="section-25">
          <h2 className="text-2xl font-bold text-white mb-4">25. User Data</h2>
          <p>We will maintain certain data that you transmit to the Services to manage the performance of the Services, as well as data relating to your use of the Services. Although we perform routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</p>
        </section>

        {/* 26. Electronic Communications */}
        <section id="section-26">
          <h2 className="text-2xl font-bold text-white mb-4">26. Electronic Communications, Transactions and Signatures</h2>
          <p className="mb-4">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email, and on the Services, satisfy any legal requirement that such communication be in writing.</p>
          <p className="uppercase font-bold text-white">YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.</p>
          <p className="mt-4">You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any Jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.</p>
        </section>

        {/* 27. SMS */}
        <section id="section-27">
          <h2 className="text-2xl font-bold text-white mb-4">27. SMS Text Messaging</h2>
          <h3 className="text-lg font-bold text-white mb-2">Program Description</h3>
          <p className="mb-4">By opting into any Noctowls text messaging program, you expressly consent to receive text messages (SMS) to your mobile number. Noctowls text messages may include: order updates, special offers, marketing communications, account alerts, and responses to inquiries.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Message Frequency</h3>
          <p className="mb-4">"You may receive up to 2 promotional SMS per month from Noctowls about new product launches and exclusive deals." "We may send up to 4 promotional text messages per month, including early access to new collections, special discounts, and event-based offers."</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Opting Out</h3>
          <p className="mb-4">If at any time you wish to stop receiving SMS messages from us, simply reply to the text with "STOP." You may receive an SMS message confirming your opt-out.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Message and Data Rates</h3>
          <p className="mb-4">Please be aware that message and data rates may apply to any SMS messages sent or received. The rates are determined by your carrier and the specifics of your mobile plan.</p>
          
          <h3 className="text-lg font-bold text-white mb-2">Support</h3>
          <p>If you have any questions or need assistance regarding our SMS communications, please email us at <a href="mailto:help.noctowls@gmail.com" className="text-red-500 hover:underline">help.noctowls@gmail.com</a> or call +918348341112.</p>
        </section>

        {/* 28. Miscellaneous */}
        <section id="section-28">
          <h2 className="text-2xl font-bold text-white mb-4">28. Miscellaneous</h2>
          <p>These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us_ our failure to exercise or enforce any right or provision or these Legal Terms shall not operate as a waiver of sum right or provision_ These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment, or agency relationship created between you and us as a result of these Legal Terms or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Legal Terms and the lack of signing by the parties hereto to execute these Legal Terms.</p>
        </section>

        {/* 29. Handling Time */}
        <section id="section-29">
          <h2 className="text-2xl font-bold text-white mb-4">29. Handling Time Promise</h2>
          <p>All orders are packed and dispatched within <strong>2-3 business days</strong>. If delays occur due to stock or courier issues, customers will be notified via email or SMS.</p>
        </section>

        {/* 30. Community */}
        <section id="section-30">
          <h2 className="text-2xl font-bold text-white mb-4">30. Community Contribution Clause</h2>
          <p>Noctowls occasionally reactivates community-submitted setups or testimonials on the website and social channels. By submitting content, users grant Noctowls the right to use it for promotional purposes, with proper credit.</p>
        </section>

        {/* 31. Contact Us */}
        <section id="section-31" className="border-t border-zinc-800 pt-10">
          <h2 className="text-2xl font-bold text-white mb-6">31. Contact Us</h2>
          <div className="bg-zinc-950 p-8 rounded-lg border border-zinc-800">
            <p className="mb-6 text-zinc-400">To resolve a complaint regarding the Services or to receive further information regarding the use of the Services, please contact us at:</p>
            
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div>
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Legal Name</span>
                <span className="text-white text-base">Priyanka Ghosh</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Trade Name</span>
                <span className="text-white text-base">Noctowls</span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Address</span>
                <span className="text-white text-base">2nd floor, Arushi complex, ITI Aambagan, Muchipara, Durgapur, West Bengal 713212, India</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Phone</span>
                <span className="text-white text-base">+91 83483 41112</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Email</span>
                <a href="mailto:help.noctowls@gmail.com" className="text-white hover:text-red-500 text-base transition-colors">help.noctowls@gmail.com</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PolicyLayout>
  );
};

export default TermsOfService;