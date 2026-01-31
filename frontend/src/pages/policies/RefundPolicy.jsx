import { Link } from "react-router-dom";
import PolicyLayout from "../../components/layout/PolicyLayout";

const RefundPolicy = () => {
  return (
    <PolicyLayout title="Refund & Return Policy">
      <p className="mb-6">
        Thank you for your purchase. We hope you are happy with your purchase. However, if you are not completely satisfied for any reason, you may return it to us for a refund or an exchange.
      </p>

      {/* CRITICAL WARNING BOX */}
      <div className="bg-red-950/30 border border-red-600/50 p-6 rounded-lg mb-10 text-red-200">
        <h3 className="text-white font-bold uppercase mb-2 flex items-center gap-2">⚠️ Mandatory Requirement for Refund</h3>
        <p className="text-sm leading-relaxed">
          For any refund claim, you <strong>MUST share a Full Unboxing Video</strong> showing the sealed parcel and all items inside. Refund is only possible when the deskmat and all gifts (stickers/keychains/anime figure/katana) are returned in original condition. Missing items will result in no refund.
        </p>
      </div>

      <section className="space-y-10">
        {/* COD & CANCELLATION */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
            <h3 className="text-white font-bold mb-3">COD Fees</h3>
            <p className="text-sm text-zinc-400">
              For all Cash on Delivery orders, a non-refundable fee of <span className="text-white font-bold">₹49</span> is charged. If a COD order is cancelled or returned, this fee will <span className="underline">not be refunded</span> under any circumstances.
            </p>
          </div>
          <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
            <h3 className="text-white font-bold mb-3">Order Cancellation</h3>
            <p className="text-sm text-zinc-400">
              Orders <strong>cannot be cancelled</strong> once they have been dispatched/shipped from our warehouse.
            </p>
          </div>
        </div>

        {/* RETURNS */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Returns</h2>
          <div className="p-4 bg-amber-900/20 border border-amber-600/50 rounded mb-4 text-amber-200 text-sm">
            <strong>NOTE:</strong> Please choose sizes carefully. Our policy does <strong>NOT COVER SIZE EXCHANGES</strong>.
          </div>
          <ul className="list-disc pl-5 space-y-2 text-zinc-300">
            <li>Returns must be initiated within <strong>7 days</strong> of product delivery.</li>
            <li>Items must be postmarked within seven (7) days of the purchase date.</li>
            <li>Returned items must be in <strong>new and unused condition</strong> with all original tags and labels attached.</li>
          </ul>
        </div>

        {/* RETURN PROCESS */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Return Process</h2>
          <ol className="list-decimal pl-5 space-y-4 text-zinc-300">
            <li>
              Email customer service at <a href="mailto:help.noctowls@gmail.com" className="text-red-500 hover:underline">help.noctowls@gmail.com</a> to obtain a Return Merchandise Authorization (RMA) number.
            </li>
            <li>
              Place the item securely in its original packaging, including original accessories, gifts, and proof of purchase.
            </li>
            <li>
              Mail your return to the address below:
              <div className="mt-3 p-4 bg-zinc-950 border border-zinc-800 rounded font-mono text-sm text-zinc-400">
                <span className="text-white font-bold block mb-1">Noctowls (Attn: Returns)</span>
                RMA# [Your Number]<br/>
                2nd floor, Arushi complex, ITI Aambagan, Muchipara<br/>
                Durgapur, West Bengal 713212<br/>
                India
              </div>
            </li>
          </ol>
          <p className="mt-4 text-sm">
            You may use the prepaid shipping label enclosed with your package. Return shipping charges will be paid or reimbursed by us.
          </p>
        </div>

        {/* REFUNDS & EXCEPTIONS */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Refunds</h3>
            <p>
              After receiving and inspecting your return, we will process your refund or exchange. Please allow at least <strong>7 days</strong> from receipt of the item. We will notify you by email when processed.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Exceptions</h3>
            <p>
              For defective or damaged products, please contact us within <strong>48 hours</strong> at the contact details below to arrange a refund or exchange.
            </p>
          </div>
        </div>

        {/* PLEASE NOTE SECTION */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Important Notes</h2>
          <ul className="grid gap-3 text-sm text-zinc-400">
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> Sale items are FINAL SALE and cannot be returned.</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> Items must be unused, unopened, and in original packaging. Used/damaged items may be denied.</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> Customized products and "Non-Returnable" items are final.</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> All returns must be approved via email before shipping. Unauthorized returns will not be accepted.</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> <strong>Damaged Items:</strong> Notify us within 24 hours with photos for a replacement/refund.</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> Refunds are processed to original payment method (7-10 business days).</li>
            <li className="flex gap-3"><span className="text-red-500 font-bold">•</span> Exchanges are only for defective/damaged items. No size/color exchanges.</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="text-white font-bold mb-2">Questions?</h3>
          <p>Contact us at:</p>
          <p className="font-mono text-zinc-400">8348341112</p>
          <a href="mailto:help.noctowls@gmail.com" className="font-mono text-red-500 hover:underline">help.noctowls@gmail.com</a>
        </div>
      </section>
    </PolicyLayout>
  );
};

export default RefundPolicy;