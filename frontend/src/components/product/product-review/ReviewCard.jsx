import { Icon } from "@iconify/react";

const ReviewCard = ({ review, isOwner = false, onEdit }) => {

    return (
        <div className={`review-card flex gap-4 p-0 transition-colors border-b border-zinc-800 pb-6 ${review.status === 'pending' && isOwner ? 'opacity-70' : ''
            }`}>

            {/* 1. Avatar (Left Column) */}
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-zinc-200 text-black flex items-center justify-center font-bold text-sm uppercase">
                    {review.userName?.slice(0, 2) || "DR"}
                </div>
            </div>

            {/* 2. Content (Right Column) */}
            <div className="flex-1 overflow-hidden">

                {/* Name & Badge Row */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{isOwner ? "You" : review.userName}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                        <Icon icon="material-symbols:verified" className="text-zinc-600 text-xs" />
                        Verified purchase
                    </div>
                    {isOwner && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 rounded ml-2">
                            {review.status}
                        </span>
                    )}
                </div>

                {/* Date Row (e.g. 1 month ago - mocked here) */}
                <div className="text-xs text-zinc-500 mb-2 font-medium">
                    {new Date(review.createdAt).toLocaleDateString()}
                </div>

                {/* Stars Row */}
                <div className="flex text-red-600 text-xs mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Icon key={i} icon={i < Math.round(review.rating) ? "material-symbols:star-rounded" : "material-symbols:star-rounded"} className={i >= Math.round(review.rating) ? "text-zinc-700" : ""} />
                    ))}
                </div>

                {/* Review Text */}
                <div className="text-zinc-300 text-sm leading-relaxed mb-4">
                    <p>{review.comment}</p>
                </div>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 w-full overflow-x-auto">
                        {review.images.map((img, idx) => (
                            <div key={idx} className="w-16 h-16 rounded overflow-hidden border border-zinc-800 bg-zinc-900 cursor-zoom-in shrink-0">
                                <img
                                    src={img.url}
                                    alt="review-img"
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    onClick={() => window.open(img.url, '_blank')}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewCard;