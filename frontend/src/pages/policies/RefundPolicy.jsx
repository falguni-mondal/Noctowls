import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const RefundPolicy = () => {
  return (
    <PolicyLayout title="Refund & Return Policy">
      <p className="mb-6 text-zinc-600 leading-relaxed">
        Thank you for your purchase. We hope you are happy with your purchase. However, if you are not completely satisfied for any reason, you may return it to us for a refund or an exchange.
      </p>

      {/* CRITICAL WARNING BOX - Light Theme */}
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl mb-10 text-red-800 shadow-sm">
        <h3 className="text-red-900 font-bold uppercase mb-2 flex items-center gap-2">⚠️ Mandatory Requirement for Refund</h3>
        <p className="text-sm leading-relaxed">
          For any refund claim, you <strong className="text-red-900 font-black">MUST share a Full Unboxing Video</strong> showing the sealed parcel and all items inside. Refund is only possible when the deskmat and all gifts (stickers/keychains/anime figure/katana) are returned in original condition. Missing items will result in no refund.
        </p>
      </div>

      <section className="space-y-10">
        {/* COD & CANCELLATION */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-[#0f0f0f] font-bold mb-3">COD Fees</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              For all Cash on Delivery orders, a non-refundable fee of <span className="text-[#0f0f0f] font-bold">₹49</span> is charged. If a COD order is cancelled or returned, this fee will <span className="underline font-medium">not be refunded</span> under any circumstances.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-[#0f0f0f] font-bold mb-3">Order Cancellation</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Orders <strong className="text-[#0f0f0f]">cannot be cancelled</strong> once they have been dispatched/shipped from our warehouse.
            </p>
          </div>
        </div>

        {/* RETURNS */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0f0f0f] mb-4">Returns</h2>
          {/* Light Theme Alert Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-amber-800 text-sm shadow-sm">
            <strong className="text-amber-900 font-black">NOTE:</strong> Please choose sizes carefully. Our policy does <strong className="text-amber-900 font-black">NOT COVER SIZE EXCHANGES</strong>.
          </div>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600">
            <li>Returns must be initiated within <strong className="text-[#0f0f0f]">7 days</strong> of product delivery.</li>
            <li>Items must be postmarked within seven (7) days of the purchase date.</li>
            <li>Returned items must be in <strong className="text-[#0f0f0f]">new and unused condition</strong> with all original tags and labels attached.</li>
          </ul>
        </div>

        {/* RETURN PROCESS */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0f0f0f] mb-4">Return Process</h2>
          <ol className="list-decimal pl-5 space-y-4 text-zinc-600">
            <li>
              Email customer service at <a href="mailto:help.noctowls@gmail.com" className="text-red-600 font-bold hover:underline">help.noctowls@gmail.com</a> to obtain a Return Merchandise Authorization (RMA) number.
            </li>
            <li>
              Place the item securely in its original packaging, including original accessories, gifts, and proof of purchase.
            </li>
            <li>
              Mail your return to the address below:
              <div className="mt-3 p-5 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-sm text-zinc-600 shadow-sm">
                <span className="text-[#0f0f0f] font-bold block mb-1">Noctowls (Attn: Returns)</span>
                RMA# [Your Number]<br/>
                2nd floor, Arushi complex, ITI Aambagan, Muchipara<br/>
                Durgapur, West Bengal 713212<br/>
                India
              </div>
            </li>
          </ol>
          <p className="mt-4 text-sm text-zinc-600">
            You may use the prepaid shipping label enclosed with your package. Return shipping charges will be paid or reimbursed by us.
          </p>
        </div>

        {/* REFUNDS & EXCEPTIONS */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">Refunds</h3>
            <p className="text-zinc-600 leading-relaxed">
              After receiving and inspecting your return, we will process your refund or exchange. Please allow at least <strong className="text-[#0f0f0f]">7 days</strong> from receipt of the item. We will notify you by email when processed.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-[#0f0f0f] mb-2">Exceptions</h3>
            <p className="text-zinc-600 leading-relaxed">
              For defective or damaged products, please contact us within <strong className="text-[#0f0f0f]">48 hours</strong> at the contact details below to arrange a refund or exchange.
            </p>
          </div>
        </div>

        {/* PLEASE NOTE SECTION */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0f0f0f] mb-4">Important Notes</h2>
          <ul className="grid gap-3 text-sm text-zinc-600">
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>Sale items are FINAL SALE and cannot be returned.</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>Items must be unused, unopened, and in original packaging. Used/damaged items may be denied.</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>Customized products and "Non-Returnable" items are final.</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>All returns must be approved via email before shipping. Unauthorized returns will not be accepted.</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span><strong className="text-[#0f0f0f]">Damaged Items:</strong> Notify us within 24 hours with photos for a replacement/refund.</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>Refunds are processed to original payment method (7-10 business days).</span></li>
            <li className="flex gap-3"><span className="text-red-600 font-bold">•</span> <span>Exchanges are only for defective/damaged items. No size/color exchanges.</span></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="border-t border-zinc-200 pt-8 text-zinc-600">
          <h3 className="text-[#0f0f0f] font-bold mb-2">Questions?</h3>
          <p>Contact us at:</p>
          <p className="font-mono mt-1 font-medium">8348341112</p>
          <a href="mailto:help.noctowls@gmail.com" className="font-mono text-red-600 font-bold hover:underline block mt-1">help.noctowls@gmail.com</a>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default RefundPolicy;