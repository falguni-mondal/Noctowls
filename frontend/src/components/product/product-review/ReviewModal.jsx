import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import StarRating from "./StarRating";
import { useDispatch, useSelector } from "react-redux";
import { 
    submitReview, 
    updateReview, 
    selectSubmitLoading, 
    selectReviewEligibility 
} from "../../../store/features/user/reviewSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const ReviewModal = ({ productId, onClose, userName }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectSubmitLoading);
  
  // Get existing review data (if any) to pre-fill the form
  const { existingReview, hasReviewed } = useSelector(selectReviewEligibility);
  
  const [formData, setFormData] = useState({
    rating: 0,
    comment: "",
    userName: userName || "",
  });

  // Separate state for existing (URLs) and new (Files) images
  const [existingImages, setExistingImages] = useState([]); 
  const [newImages, setNewImages] = useState([]); 
  const [newPreviews, setNewPreviews] = useState([]); // For displaying local previews of new files

  // Initialize State on Load (Pre-fill for Edit Mode)
  useEffect(() => {
    if (hasReviewed && existingReview) {
        setFormData({
            rating: existingReview.rating,
            comment: existingReview.comment,
            userName: existingReview.userName,
        });
        // Populate existing images from the review
        if (existingReview.images && Array.isArray(existingReview.images)) {
            setExistingImages(existingReview.images);
        }
    }
  }, [hasReviewed, existingReview]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
        newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  // --- HANDLERS ---

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check Total Count (Existing + New)
    if (files.length + existingImages.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed total", toastControls);
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Generate previews for UI
    const generatedPreviews = files.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...generatedPreviews]);
  };

  const removeNewImage = (index) => {
    // Revoke the specific URL to free memory
    URL.revokeObjectURL(newPreviews[index]);
    
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    // Just remove from local state. Backend will detect absence and delete it.
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Validation ---
    if (formData.rating === 0) {
      toast.warn("Please select a star rating", toastControls);
      return;
    }
    if (formData.comment.length < 10) {
      toast.warn("Review must be at least 10 characters", toastControls);
      return;
    }

    // --- Prepare FormData ---
    const submissionData = new FormData();
    submissionData.append("rating", formData.rating);
    submissionData.append("comment", formData.comment);
    submissionData.append("userName", formData.userName);

    // 1. Append NEW images (files)
    newImages.forEach(file => {
        submissionData.append("images", file);
    });

    try {
      if (hasReviewed && existingReview) {
        // UPDATE MODE
        
        // 2. Append ALL existing images as a single JSON string
        // This ensures the backend gets the full list of what to keep.
        // Any image in DB but NOT in this list will be deleted by backend.
        submissionData.append("existingImages", JSON.stringify(existingImages));

        await dispatch(updateReview({ 
            reviewId: existingReview._id, 
            formData: submissionData 
        })).unwrap();
        
        toast.success("Review updated successfully!", toastControls);
      } else {
        // CREATE MODE
        await dispatch(submitReview({ productId, formData: submissionData })).unwrap();
        toast.success("Review submitted for approval!", toastControls);
      }
      
      onClose();
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error || "Action failed", toastControls);
    }
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-xl p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
            <Icon icon="mingcute:close-line" className="text-2xl" />
        </button>

        {/* Header */}
        <h3 className="text-xl font-semibold mb-6 text-center tracking-wide text-zinc-100">
            {hasReviewed ? "Edit Review" : "Write a Review"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Tap to Rate</span>
            <StarRating rating={formData.rating} setRating={(r) => setFormData({...formData, rating: r})} size="text-4xl" />
            {formData.rating === 0 && <span className="text-xs text-red-500 font-medium animate-pulse">* Required</span>}
          </div>

          {/* User Name */}
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 block">Display Name</label>
            <input 
              type="text" 
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-zinc-200 disabled:opacity-50 transition-all placeholder:text-zinc-600"
              placeholder="e.g. John Doe"
              required
              disabled={hasReviewed} // Typically name shouldn't change on edit
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1.5 block">Your Review</label>
            <textarea 
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none h-28 resize-none text-zinc-200 transition-all placeholder:text-zinc-600"
              placeholder="What did you like or dislike?"
              required
              minLength={10}
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold block">Photos</label>
                <span className="text-[10px] text-zinc-500">
                    {existingImages.length + newImages.length}/5 images
                </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              
              {/* 1. Existing Images (Standard Border) */}
              {existingImages.map((img, idx) => (
                <div key={`exist-${idx}`} className="relative aspect-square rounded-md overflow-hidden group border border-zinc-700 bg-zinc-900">
                  <img src={img.url} alt="existing" className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                  
                  {/* Delete Button */}
                  <button 
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors shadow-sm z-10"
                    title="Remove image"
                  >
                    <Icon icon="mingcute:close-line" className="text-xs" />
                  </button>
                </div>
              ))}

              {/* 2. New Images (Yellow Border - Marked as Changed) */}
              {newPreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border-2 border-yellow-500 bg-zinc-900 group">
                  <img src={src} alt="new-preview" className="w-full h-full object-cover" />
                  
                  {/* Delete Button */}
                  <button 
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors shadow-sm z-10"
                    title="Remove image"
                  >
                    <Icon icon="mingcute:close-line" className="text-xs" />
                  </button>
                </div>
              ))}
              
              {/* Add Button (Only if total < 5) */}
              {(existingImages.length + newImages.length) < 5 && (
                <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-600 rounded-md cursor-pointer hover:border-zinc-400 hover:bg-zinc-900/50 transition-all text-zinc-500 hover:text-zinc-300">
                  <Icon icon="solar:camera-add-linear" className="text-xl" />
                  <input type="file" accept="image/png, image/jpeg, image/webp" multiple hidden onChange={handleImageChange} />
                </label>
              )}
            </div>
            
            {/* Legend for changes */}
            {newImages.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-yellow-500 bg-yellow-500/10 w-fit px-2 py-1 rounded border border-yellow-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span>New images marked in yellow</span>
                </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded font-semibold text-sm uppercase tracking-wide transition-all hover:shadow-lg hover:shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2 items-center mt-4 active:scale-[0.99]"
          >
            {loading ? (
                <>
                    <Icon icon="eos-icons:loading" className="text-xl" />
                    Processing...
                </>
            ) : (
                hasReviewed ? "Update Review" : "Submit Review"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;