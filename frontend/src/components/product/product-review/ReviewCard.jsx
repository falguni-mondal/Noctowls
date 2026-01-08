import StarRating from "./StarRating";
import { Icon } from "@iconify/react";

const ReviewCard = ({ review }) => {
  return (
    <div className="review-card border border-zinc-800 bg-zinc-900/50 p-5 rounded-lg mb-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex justify-center items-center text-white font-bold uppercase">
                {review.userName?.charAt(0) || "U"}
            </div>
            <div>
                <h4 className="font-semibold text-zinc-200">{review.userName}</h4>
                <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} readOnly size="text-sm" />
                    <span className="text-xs text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
        {/* Verified Badge (Assuming logic based on your backend) */}
        <div className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
            <Icon icon="material-symbols:verified-rounded" /> Verified Purchase
        </div>
      </div>

      <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
        {review.comment}
      </p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {review.images.map((img, idx) => (
                <div key={idx} className="w-20 h-20 shrink-0 rounded overflow-hidden border border-zinc-700">
                    <img 
                        src={img.url} 
                        alt="review-img" 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={() => window.open(img.url, '_blank')}
                    />
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;