import { useState } from "react";
import { Icon } from "@iconify/react";
import StarRating from "./StarRating";
import { useDispatch, useSelector } from "react-redux";
import { submitReview, selectSubmitLoading } from "../../../store/features/user/reviewSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";

const ReviewModal = ({ productId, onClose, userName }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectSubmitLoading);
  
  const [formData, setFormData] = useState({
    rating: 0, // ✅ CHANGED: Start with 0 (Empty)
    comment: "",
    userName: userName || "", 
    images: []
  });

  const [previews, setPreviews] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      toast.error("Maximum 5 images allowed", toastControls);
      return;
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ NEW VALIDATION: Check if rating is selected
    if (formData.rating === 0) {
      toast.warn("Please select a star rating", toastControls);
      return;
    }

    if (formData.comment.length < 10) {
      toast.warn("Review must be at least 10 characters", toastControls);
      return;
    }

    const submissionData = new FormData();
    submissionData.append("rating", formData.rating);
    submissionData.append("comment", formData.comment);
    submissionData.append("userName", formData.userName);
    
    formData.images.forEach(file => {
      submissionData.append("images", file);
    });

    try {
      await dispatch(submitReview({ productId, formData: submissionData })).unwrap();
      toast.success("Review submitted for approval!", toastControls);
      onClose();
    } catch (error) {
      toast.error(error || "Failed to submit review", toastControls);
    }
  };

  return (
    <div className="fixed inset-0 z-999 flex pt-14 justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-h-[77vh] max-w-lg overflow-y-scroll rounded-xl p-4 relative animate-in fade-in zoom-in duration-200">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
            <Icon icon="mingcute:close-line" className="text-2xl" />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-center">Write a Review</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Rating */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <span className="text-sm text-zinc-400">Tap to Rate</span>
            <StarRating rating={formData.rating} setRating={(r) => setFormData({...formData, rating: r})} size="text-3xl" />
            {/* Helper text if 0 */}
            {formData.rating === 0 && <span className="text-xs text-red-500 font-medium">* Required</span>}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Display Name</label>
            <input 
              type="text" 
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-sm focus:border-indigo-500 outline-none text-zinc-200"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Your Review</label>
            <textarea 
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-sm focus:border-indigo-500 outline-none h-28 resize-none text-zinc-200"
              placeholder="Tell us what you liked or disliked..."
              required
              minLength={10}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-xs text-zinc-400 block mb-2">Add Photos (Optional, Max 5)</label>
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, idx) => (
                <div key={idx} className="w-16 h-16 relative border border-zinc-700 rounded overflow-hidden">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-500/80 text-white p-0.5"
                  >
                    <Icon icon="mingcute:close-line" />
                  </button>
                </div>
              ))}
              
              {previews.length < 5 && (
                <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-zinc-600 rounded cursor-pointer hover:border-zinc-400 text-zinc-500 hover:text-zinc-300">
                  <Icon icon="solar:camera-add-linear" className="text-xl" />
                  <input type="file" accept="image/*" multiple hidden onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2 items-center mt-2"
          >
            {loading && <Icon icon="eos-icons:loading" />}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;