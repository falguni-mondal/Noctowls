import StarRating from "./StarRating";
import { Icon } from "@iconify/react";

const ReviewCard = ({ review, isOwner = false, onEdit }) => {
  
  // Helper to determine status style
  const getStatusBadge = (status) => {
      if (status === 'accepted') return null; // Accepted looks like a normal review
      
      const config = {
          pending: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Pending", icon: "mdi:clock-outline" },
          rejected: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Changes Requested", icon: "mdi:alert-circle-outline" }
      };
      
      const style = config[status] || config.pending;

      return (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${style.bg} ${style.border} ${style.color} text-[10px] font-bold uppercase tracking-wide w-fit mt-1`}>
              <Icon icon={style.icon} />
              {style.label}
          </div>
      );
  };

  return (
    <div className={`review-card border rounded-lg p-5 mb-4 relative transition-colors ${
        review.status === 'pending' && isOwner ? 'bg-amber-900/5 border-amber-500/30' : 
        review.status === 'rejected' && isOwner ? 'bg-red-900/5 border-red-500/30' : 
        'border-zinc-800 bg-zinc-900/50'
    }`}>
      
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex justify-center items-center text-white font-bold uppercase shadow-inner">
                {review.userName?.charAt(0) || "U"}
            </div>
            
            <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-zinc-200">{isOwner ? "You" : review.userName}</h4>
                    {/* Status Badge for Owners */}
                    {isOwner && getStatusBadge(review.status)}
                </div>
                
                <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} readOnly size="text-sm" />
                    <span className="text-xs text-zinc-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            {/* Edit Button for Owner */}
            {isOwner && (
                <button 
                    onClick={onEdit}
                    className="text-xs font-medium text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-2 transition-colors"
                >
                    Edit Review
                </button>
            )}

            {/* Verified Badge (Only for accepted public reviews or if logic allows) */}
            {(!isOwner || review.status === 'accepted') && (
                <div className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10">
                    <Icon icon="material-symbols:verified-rounded" /> Verified
                </div>
            )}
        </div>
      </div>

      <p className="mt-3 text-zinc-300 text-sm leading-relaxed">
        {review.comment}
      </p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {review.images.map((img, idx) => (
                <div key={idx} className="w-20 h-20 shrink-0 rounded-md overflow-hidden border border-zinc-700 bg-zinc-950">
                    <img 
                        src={img.url} 
                        alt="review-img" 
                        className="w-full h-full object-cover cursor-zoom-in hover:opacity-80 transition hover:scale-105 duration-300"
                        onClick={() => window.open(img.url, '_blank')}
                    />
                </div>
            ))}
        </div>
      )}

      {/* Rejection Message */}
      {isOwner && review.status === 'rejected' && (
        <div className="mt-4 text-xs text-red-400 bg-red-950/30 p-3 rounded border border-red-900/50 flex gap-2 items-start">
             <Icon icon="mdi:alert" className="text-lg shrink-0" />
             <p>Your review was not approved. Please edit it to comply with our guidelines.</p>
        </div>
      )}

       {/* Pending Privacy Note */}
       {isOwner && review.status === 'pending' && (
        <div className="mt-3 pt-3 border-t border-dashed border-amber-500/20 flex items-center gap-1.5 text-[11px] text-zinc-500">
             <Icon icon="mdi:eye-off-outline" />
             <span>Visible only to you until approved.</span>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;