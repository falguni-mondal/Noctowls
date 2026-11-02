import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import StarRating from "./StarRating";
import { useDispatch, useSelector } from "react-redux";
import {
  submitReview,
  updateReview,
  selectSubmitLoading,
  selectReviewEligibility,
} from "../../../store/features/user/reviewSlice";
import { selectUser } from "../../../store/features/user/authSlice";
import { toast } from "react-toastify";
import toastControls from "../../../utils/global/toastControls";
import { uploadFilesToImageKit } from "../../../utils/helpers/imagekitUpload";
import { optimizeImage } from "../../../utils/helpers/imageOptimizer";

const ReviewModal = ({ productId, onClose, userName: propUserName }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectSubmitLoading);
  const [isUploading, setIsUploading] = useState(false);

  const user = useSelector(selectUser);
  const isUserLoggedIn = !!user;
  const { existingReview, hasReviewed } = useSelector(selectReviewEligibility);

  const [formData, setFormData] = useState({
    rating: 0,
    comment: "",
    userName: propUserName || user?.name || "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    if (hasReviewed && existingReview) {
      setFormData({
        rating: existingReview.rating,
        comment: existingReview.comment,
        userName: existingReview.userName,
      });
      if (existingReview.images && Array.isArray(existingReview.images)) {
        setExistingImages(existingReview.images);
      }
    } else if (isUserLoggedIn && user?.name) {
      setFormData((prev) => ({ ...prev, userName: user.name }));
    }
  }, [hasReviewed, existingReview, isUserLoggedIn, user]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    if (files.length + existingImages.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed total", toastControls);
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`Image "${file.name}" exceeds 10MB limit`, toastControls);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setNewImages((prev) => [...prev, ...validFiles]);
      const generatedPreviews = validFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setNewPreviews((prev) => [...prev, ...generatedPreviews]);
    }
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.warn("Please select a star rating", toastControls);
      return;
    }
    if (formData.comment.length < 10) {
      toast.warn("Review must be at least 10 characters", toastControls);
      return;
    }

    let uploadedNewImages = [];

    try {
      if (newImages.length > 0) {
        setIsUploading(true);
        uploadedNewImages = await uploadFilesToImageKit(newImages, {
          folder: `/reviews/${productId}`,
          maxWidth: 1600,
          quality: 0.8,
        });
      }
    } catch (uploadErr) {
      setIsUploading(false);
      toast.error(
        uploadErr.message || "Failed to upload review photos",
        toastControls
      );
      return;
    } finally {
      setIsUploading(false);
    }

    try {
      if (hasReviewed && existingReview) {
        await dispatch(
          updateReview({
            reviewId: existingReview._id,
            reviewData: {
              rating: formData.rating,
              comment: formData.comment,
              existingImages,
              newImages: uploadedNewImages,
            },
          })
        ).unwrap();

        toast.success("Review updated successfully!", toastControls);
      } else {
        await dispatch(
          submitReview({
            productId,
            reviewData: {
              rating: formData.rating,
              comment: formData.comment,
              userName: formData.userName,
              images: uploadedNewImages,
            },
          })
        ).unwrap();
        toast.success("Review submitted for approval!", toastControls);
      }

      onClose();
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error || "Action failed", toastControls);
    }
  };

  const isBusy = isUploading || loading;

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-zinc-200 w-full max-w-lg rounded-lg p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-[#0f0f0f] transition-colors"
        >
          <Icon icon="mingcute:close-line" className="text-2xl" />
        </button>

        <h3 className="text-lg font-bold mb-6 text-center uppercase tracking-widest text-[#0f0f0f] border-b border-zinc-200 pb-4">
          {hasReviewed ? "Edit Review" : "Write a Review"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Tap to Rate
            </span>
            <StarRating
              rating={formData.rating}
              setRating={(r) => setFormData({ ...formData, rating: r })}
              size="text-4xl"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Display Name
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) =>
                setFormData({ ...formData, userName: e.target.value })
              }
              className={`w-full bg-white border border-zinc-300 rounded p-3 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none text-[#0f0f0f] transition-all placeholder:text-zinc-400 shadow-sm font-medium ${
                isUserLoggedIn || hasReviewed
                  ? "bg-zinc-50 text-zinc-500 cursor-not-allowed"
                  : ""
              }`}
              placeholder="e.g. John Doe"
              required
              disabled={isUserLoggedIn || hasReviewed}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">
              Your Review
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="w-full bg-white border border-zinc-300 rounded p-3 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/50 outline-none h-28 resize-none text-[#0f0f0f] transition-all placeholder:text-zinc-400 shadow-sm font-medium"
              placeholder="Share your experience with us..."
              required
              minLength={10}
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
                Photos
              </label>
              <span className="text-[10px] text-zinc-500 font-bold">
                {existingImages.length + newImages.length}/5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {existingImages.map((img, idx) => (
                <div
                  key={`exist-${idx}`}
                  className="relative aspect-square rounded overflow-hidden group border border-zinc-200 bg-zinc-100 shadow-sm"
                >
                  <img
                    src={optimizeImage(img.url, { width: 160, quality: 75 })}
                    alt="existing"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors z-10"
                  >
                    <Icon icon="mingcute:close-line" className="text-[10px]" />
                  </button>
                </div>
              ))}

              {newPreviews.map((src, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative aspect-square rounded overflow-hidden border border-amber-400 bg-zinc-50 group shadow-sm"
                >
                  <img
                    src={src}
                    alt="new-preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition-colors z-10"
                  >
                    <Icon icon="mingcute:close-line" className="text-[10px]" />
                  </button>
                </div>
              ))}

              {existingImages.length + newImages.length < 5 && (
                <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-300 rounded cursor-pointer hover:border-[#0f0f0f] hover:bg-zinc-50 transition-all text-zinc-400 hover:text-[#0f0f0f]">
                  <Icon icon="solar:camera-add-linear" className="text-xl" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    hidden
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2 items-center mt-2"
          >
            {isBusy ? (
              <>
                <Icon icon="eos-icons:loading" className="text-xl" />
                {isUploading ? "Uploading Photos..." : "Processing..."}
              </>
            ) : hasReviewed ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;