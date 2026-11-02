import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MiniLoading from "../../../../utils/loader/MiniLoading";
import toastControls from "../../../../utils/global/toastControls";
import {
  getOneAdminProduct,
  updateProduct,
  resetUpdateProductState,
} from "../../../../store/features/admin/adminProductSlice";
import {
  uploadFilesToImageKit,
  cleanupImageKitFiles,
  sanitizeFolderName,
} from "../../../../utils/helpers/imagekitUpload";

import GeneralInputs from "../../../../components/admin/product/add&update/GeneralInputs";
import SizingInputs from "../../../../components/admin/product/add&update/SizingInputs";
import OtherInputs from "../../../../components/admin/product/add&update/OtherInputs";
import UpdateMainImages from "../../../../components/admin/product/add&update/UpdateMainImages";
import UpdateHighlightImages from "../../../../components/admin/product/add&update/UpdateHighlightImages";
import StatusInput from "../../../../components/admin/product/add&update/StatusInput";

import {
  SIZE_VALUES_BY_PRODUCT,
  ALLOWED_IMAGE_TYPES,
  IMAGE_COUNTS_BY_CATEGORY,
} from "../../../../constants/adminProductConstants";

const UpdateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { adminProduct, adminProductLoading } = useSelector(
    (state) => state.adminProducts
  );
  const { loading, success, error } = useSelector(
    (state) => state.adminProducts.update
  );

  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Form state
  const [reveal, setReveal] = useState({
    category: false,
    group: false,
    inventory: false,
    status: false,
  });
  const [prodCategory, setProdCategory] = useState("deskmat");
  const [prodGroup, setProdGroup] = useState("General");
  const [prodInventory, setProdInventory] = useState(
    "Shri Bhumi Park, Bidhannagar"
  );
  const [prodStatus, setProdStatus] = useState("published");
  const [sizes, setSizes] = useState([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");

  const mainImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].main;
  const highlightImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].highlight;
  const [mainImages, setMainImages] = useState(
    Array(mainImageCount).fill(null)
  );
  const [highlightImages, setHighlightImages] = useState(
    Array(highlightImageCount).fill(null)
  );
  const [mainImagesChanged, setMainImagesChanged] = useState(
    Array(mainImageCount).fill(false)
  );
  const [highlightImagesChanged, setHighlightImagesChanged] = useState(
    Array(highlightImageCount).fill(false)
  );

  const [errors, setErrors] = useState({
    general: [],
    size: {},
    images: [],
    highlightImg: [],
    others: [],
  });

  const mainImageInputRefs = useRef([]);
  const highlightImageInputRefs = useRef([]);
  const formRef = useRef(null);

  const updateSize = (value, field, val) => {
    setSizes((prev) =>
      prev.map((s) => (s.value === value ? { ...s, [field]: val } : s))
    );
  };

  // Supports selecting a single image OR multiple images at once
  const applyMultiImageSelection = ({
    startIndex,
    filesList,
    maxCount,
    currentImages,
    setImages,
    setImagesChanged,
    inputRefs,
    errorKey,
    labelPrefix,
  }) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    const newValidationErrors = [];
    const validFiles = [];

    files.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        newValidationErrors.push(
          `${labelPrefix} "${file.name}" must be PNG, WEBP, or JPEG format`
        );
      } else if (file.size > 10 * 1024 * 1024) {
        newValidationErrors.push(
          `${labelPrefix} "${file.name}" must be less than 10MB`
        );
      } else {
        validFiles.push(file);
      }
    });

    const targetSlots = [];
    if (startIndex === null || startIndex === undefined) {
      for (let i = 0; i < maxCount; i++) {
        if (!currentImages[i]) targetSlots.push(i);
      }
      for (let i = 0; i < maxCount; i++) {
        if (!targetSlots.includes(i)) targetSlots.push(i);
      }
    } else if (validFiles.length === 1) {
      targetSlots.push(startIndex);
    } else {
      for (let i = startIndex; i < maxCount; i++) {
        targetSlots.push(i);
      }
      for (let i = 0; i < startIndex; i++) {
        if (!currentImages[i]) targetSlots.push(i);
      }
    }

    const filesToAssign = validFiles.slice(0, targetSlots.length);

    if (filesToAssign.length > 0) {
      setImages((prev) => {
        const next = [...prev];
        filesToAssign.forEach((file, idx) => {
          const slotIdx = targetSlots[idx];
          if (next[slotIdx]?.type === "new" && next[slotIdx]?.preview) {
            URL.revokeObjectURL(next[slotIdx].preview);
          }
          next[slotIdx] = {
            type: "new",
            file,
            preview: URL.createObjectURL(file),
          };
        });
        return next;
      });

      setImagesChanged((prev) => {
        const nextChanged = [...prev];
        filesToAssign.forEach((_, idx) => {
          nextChanged[targetSlots[idx]] = true;
        });
        return nextChanged;
      });
    }

    setErrors((prev) => {
      const cleaned = prev[errorKey].filter(
        (err) =>
          !filesToAssign.some((_, idx) =>
            err.includes(`image ${targetSlots[idx] + 1}`)
          )
      );
      return {
        ...prev,
        [errorKey]: [...cleaned, ...newValidationErrors],
      };
    });

    if (
      startIndex !== null &&
      startIndex !== undefined &&
      inputRefs.current[startIndex]
    ) {
      inputRefs.current[startIndex].value = "";
    }
  };

  const handleMainImageSelect = (index, e) => {
    applyMultiImageSelection({
      startIndex: index,
      filesList: e.target.files,
      maxCount: mainImageCount,
      currentImages: mainImages,
      setImages: setMainImages,
      setImagesChanged: setMainImagesChanged,
      inputRefs: mainImageInputRefs,
      errorKey: "images",
      labelPrefix: "Product image",
    });
  };

  const handleHighlightImageSelect = (index, e) => {
    applyMultiImageSelection({
      startIndex: index,
      filesList: e.target.files,
      maxCount: highlightImageCount,
      currentImages: highlightImages,
      setImages: setHighlightImages,
      setImagesChanged: setHighlightImagesChanged,
      inputRefs: highlightImageInputRefs,
      errorKey: "highlightImg",
      labelPrefix: "Highlight image",
    });
  };

  const reorderImageArray = (prev, fromIndex, toIndex) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= prev.length ||
      toIndex >= prev.length
    ) {
      return prev;
    }
    const next = [...prev];
    if (!next[toIndex]) {
      next[toIndex] = next[fromIndex];
      next[fromIndex] = null;
    } else {
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
    }
    return next;
  };

  const markRangeChanged = (prevChanged, fromIndex, toIndex) => {
    const next = [...prevChanged];
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    for (let i = start; i <= end; i++) {
      next[i] = true;
    }
    return next;
  };

  const reorderMainImages = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setMainImages((prev) => reorderImageArray(prev, fromIndex, toIndex));
    setMainImagesChanged((prev) => markRangeChanged(prev, fromIndex, toIndex));
  };

  const reorderHighlightImages = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setHighlightImages((prev) => reorderImageArray(prev, fromIndex, toIndex));
    setHighlightImagesChanged((prev) =>
      markRangeChanged(prev, fromIndex, toIndex)
    );
  };

  const removeMainImage = (index) => {
    if (mainImages[index]?.type === "new" && mainImages[index]?.preview) {
      URL.revokeObjectURL(mainImages[index].preview);
    }

    setMainImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });

    setMainImagesChanged((prev) => {
      const newChanged = [...prev];
      newChanged[index] = true;
      return newChanged;
    });

    if (mainImageInputRefs.current[index]) {
      mainImageInputRefs.current[index].value = "";
    }

    setErrors((prev) => ({
      ...prev,
      images: prev.images.filter((err) => !err.includes(`image ${index + 1}`)),
    }));
  };

  const removeHighlightImage = (index) => {
    if (
      highlightImages[index]?.type === "new" &&
      highlightImages[index]?.preview
    ) {
      URL.revokeObjectURL(highlightImages[index].preview);
    }

    setHighlightImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });

    setHighlightImagesChanged((prev) => {
      const newChanged = [...prev];
      newChanged[index] = true;
      return newChanged;
    });

    if (highlightImageInputRefs.current[index]) {
      highlightImageInputRefs.current[index].value = "";
    }

    setErrors((prev) => ({
      ...prev,
      highlightImg: prev.highlightImg.filter(
        (err) => !err.includes(`image ${index + 1}`)
      ),
    }));
  };

  const validateForm = () => {
    const newErrors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: [],
    };

    if (!productName || productName.trim().length < 5) {
      newErrors.general.push("Product title must be at least 5 characters long");
    }

    if (!productDescription || productDescription.trim().length < 20) {
      newErrors.general.push(
        "Product description must be at least 20 characters long"
      );
    }

    if (!prodStatus || !["published", "archived"].includes(prodStatus)) {
      newErrors.others.push("Invalid product status selected");
    }

    sizes.forEach((size) => {
      const sizeErrors = [];

      if (size.originalPrice <= 0) {
        sizeErrors.push("Original price must be greater than 0");
      }

      if (
        size.numPrice === undefined ||
        size.numPrice === null ||
        size.numPrice < 0
      ) {
        sizeErrors.push("Discounted price is required and cannot be negative");
      } else if (size.numPrice > size.originalPrice) {
        sizeErrors.push(
          "Discounted price cannot be greater than original price"
        );
      }

      if (size.stock < 0) {
        sizeErrors.push("Stock cannot be negative");
      }

      if (!size.skuCode || size.skuCode.trim().length === 0) {
        sizeErrors.push("SKU code is required");
      }

      if (sizeErrors.length > 0) {
        newErrors.size[size.value] = sizeErrors;
      }
    });

    for (let i = 0; i < mainImageCount; i++) {
      if (!mainImages[i]) {
        newErrors.images.push(`Product image ${i + 1} is required`);
      }
    }

    for (let i = 0; i < highlightImageCount; i++) {
      if (!highlightImages[i]) {
        newErrors.highlightImg.push(`Highlight image ${i + 1} is required`);
      }
    }

    if (!prodInventory) {
      newErrors.others.push("Please select an inventory location");
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: [],
    });

    const validationErrors = validateForm();
    const hasErrors =
      validationErrors.general.length > 0 ||
      Object.keys(validationErrors.size).length > 0 ||
      validationErrors.images.length > 0 ||
      validationErrors.highlightImg.length > 0 ||
      validationErrors.others.length > 0;

    if (hasErrors) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const existingMainImages = [];
    const existingHighlightImages = [];
    const newMainFilesToUpload = [];
    const newHighlightFilesToUpload = [];

    const folderName = sanitizeFolderName(productName);

    mainImages.forEach((img, index) => {
      if (img && img.type === "existing") {
        existingMainImages.push({
          index,
          url: img.url,
          imageId: img.imageId,
          alt: img.alt || folderName,
        });
      } else if (img && img.type === "new" && img.file) {
        newMainFilesToUpload.push({
          file: img.file,
          index,
          alt: folderName,
        });
      }
    });

    highlightImages.forEach((img, index) => {
      if (img && img.type === "existing") {
        existingHighlightImages.push({
          index,
          url: img.url,
          imageId: img.imageId,
          alt: img.alt || folderName,
        });
      } else if (img && img.type === "new" && img.file) {
        newHighlightFilesToUpload.push({
          file: img.file,
          index,
          alt: folderName,
        });
      }
    });

    let uploadedNewMainImages = [];
    let uploadedNewHighlightImages = [];

    try {
      if (
        newMainFilesToUpload.length > 0 ||
        newHighlightFilesToUpload.length > 0
      ) {
        setIsUploadingImages(true);

        const [mainRes, highlightRes] = await Promise.all([
          newMainFilesToUpload.length > 0
            ? uploadFilesToImageKit(newMainFilesToUpload, {
                folder: `/products/${prodCategory}/${folderName}/main`,
                maxWidth: 2400,
                quality: 0.82,
              })
            : Promise.resolve([]),
          newHighlightFilesToUpload.length > 0
            ? uploadFilesToImageKit(newHighlightFilesToUpload, {
                folder: `/products/${prodCategory}/${folderName}/highlight`,
                maxWidth: 2400,
                quality: 0.82,
              })
            : Promise.resolve([]),
        ]);

        uploadedNewMainImages = mainRes;
        uploadedNewHighlightImages = highlightRes;
      }
    } catch (uploadErr) {
      await cleanupImageKitFiles([
        ...uploadedNewMainImages,
        ...uploadedNewHighlightImages,
      ]);
      setIsUploadingImages(false);
      toast.error(
        uploadErr.message || "Failed to upload new images to ImageKit",
        toastControls
      );
      return;
    } finally {
      setIsUploadingImages(false);
    }

    const productData = {
      name: productName,
      description: productDescription,
      category: prodCategory,
      group: prodGroup.toLowerCase().replace(/\s+/g, "-"),
      inventory: prodInventory,
      status: prodStatus,
      sizes,
      existingMainImages,
      existingHighlightImages,
      newMainImages: uploadedNewMainImages,
      newHighlightImages: uploadedNewHighlightImages,
      mainImagesIndices: uploadedNewMainImages.map((img) => img.index),
      highlightImagesIndices: uploadedNewHighlightImages.map((img) => img.index),
    };

    await dispatch(updateProduct({ productId, productData }));
  };

  useEffect(() => {
    if (productId) {
      dispatch(getOneAdminProduct(productId));
    }
  }, [productId, dispatch]);

  useEffect(() => {
    if (adminProduct && adminProduct.id === productId) {
      setProductName(adminProduct.name || "");
      setProductDescription(adminProduct.description || "");
      setProdCategory(adminProduct.category || "deskmat");
      setProdGroup(adminProduct.group || "General");
      setProdInventory(
        adminProduct.inventory || "Shri Bhumi Park, Bidhannagar"
      );
      setProdStatus(adminProduct.status || "published");

      if (adminProduct.sizes && Array.isArray(adminProduct.sizes)) {
        setSizes(
          adminProduct.sizes.map((size) => ({
            value: size.value,
            originalPrice: size.originalPrice || 0,
            numPrice: size.numPrice || 0,
            discount: size.discount || 0,
            stock: size.stock || 0,
            skuCode: size.skuCode || "",
          }))
        );
      }

      if (adminProduct.images && Array.isArray(adminProduct.images)) {
        const existingMain = [...Array(mainImageCount)].map((_, index) => {
          const img = adminProduct.images[index];
          return img
            ? {
                type: "existing",
                url: img.url,
                imageId: img.imageId,
                alt: img.alt || "",
              }
            : null;
        });
        setMainImages(existingMain);
        setMainImagesChanged(Array(mainImageCount).fill(false));
      }

      if (
        adminProduct.highlightImages &&
        Array.isArray(adminProduct.highlightImages)
      ) {
        const existingHighlight = [...Array(highlightImageCount)].map(
          (_, index) => {
            const img = adminProduct.highlightImages[index];
            return img
              ? {
                  type: "existing",
                  url: img.url,
                  imageId: img.imageId,
                  alt: img.alt || "",
                }
              : null;
          }
        );
        setHighlightImages(existingHighlight);
        setHighlightImagesChanged(Array(highlightImageCount).fill(false));
      }
    }
  }, [adminProduct, productId, mainImageCount, highlightImageCount]);

  useEffect(() => {
    if (success) {
      toast.success(
        success.message || "Product updated successfully!",
        toastControls
      );
      window.scrollTo({ top: 0, behavior: "smooth" });

      const timer = setTimeout(() => {
        dispatch(resetUpdateProductState());
        navigate("/admin/products");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update product!", toastControls);

      if (error.errors) {
        setErrors({
          general: Array.isArray(error.errors.general)
            ? error.errors.general
            : [],
          size: typeof error.errors.size === "object" ? error.errors.size : {},
          images: Array.isArray(error.errors.images) ? error.errors.images : [],
          highlightImg: Array.isArray(error.errors.highlightImg)
            ? error.errors.highlightImg
            : [],
          others: Array.isArray(error.errors.others) ? error.errors.others : [],
        });
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

      const timer = setTimeout(() => {
        dispatch(resetUpdateProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetUpdateProductState());
      mainImages.forEach((img) => {
        if (img?.type === "new" && img?.preview)
          URL.revokeObjectURL(img.preview);
      });
      highlightImages.forEach((img) => {
        if (img?.type === "new" && img?.preview)
          URL.revokeObjectURL(img.preview);
      });
    };
  }, [dispatch]);

  useEffect(() => {
    const allowedSizes = SIZE_VALUES_BY_PRODUCT[prodCategory] || [];

    setSizes((prev) => {
      const filtered = prev.filter((s) => allowedSizes.includes(s.value));
      const missing = allowedSizes
        .filter((v) => !filtered.some((s) => s.value === v))
        .map((v) => ({
          value: v,
          originalPrice: 0,
          numPrice: 0,
          discount: 0,
          stock: 0,
          skuCode: "",
        }));

      return [...filtered, ...missing];
    });
  }, [prodCategory]);

  if (adminProductLoading) {
    return (
      <div className="px-4 py-10 flex justify-center items-center min-h-screen bg-[#f4f4f4]">
        <MiniLoading />
      </div>
    );
  }

  if (!adminProduct || adminProduct.id !== productId) {
    return (
      <div className="px-4 py-10 max-w-4xl mx-auto min-h-screen bg-[#f4f4f4]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs">
          <p className="text-red-600 font-medium">Product not found</p>
        </div>
      </div>
    );
  }

  const isBusy = isUploadingImages || loading;

  return (
    <div
      className="px-4 py-8 max-w-4xl mx-auto text-zinc-800 bg-white min-h-screen"
      id="update-product-page"
    >
      <h1 className="ad-product-heading text-2xl font-bold mb-6 text-zinc-900 border-b border-zinc-200 pb-3">
        Update Product
      </h1>

      <form id="update-product-form" onSubmit={handleSubmit} ref={formRef}>
        <GeneralInputs
          mode="update"
          prodCategory={prodCategory}
          setProdCategory={setProdCategory}
          prodGroup={prodGroup}
          setProdGroup={setProdGroup}
          productName={productName}
          setProductName={setProductName}
          productDescription={productDescription}
          setProductDescription={setProductDescription}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        />

        <SizingInputs sizes={sizes} updateSize={updateSize} errors={errors} />

        <UpdateMainImages
          mainImages={mainImages}
          mainImagesChanged={mainImagesChanged}
          mainImageCount={mainImageCount}
          handleMainImageSelect={handleMainImageSelect}
          reorderMainImages={reorderMainImages}
          removeMainImage={removeMainImage}
          mainImageInputRefs={mainImageInputRefs}
          errors={errors}
        />

        <UpdateHighlightImages
          highlightImages={highlightImages}
          highlightImagesChanged={highlightImagesChanged}
          highlightImageCount={highlightImageCount}
          handleHighlightImageSelect={handleHighlightImageSelect}
          reorderHighlightImages={reorderHighlightImages}
          removeHighlightImage={removeHighlightImage}
          highlightImageInputRefs={highlightImageInputRefs}
          errors={errors}
        />

        <OtherInputs
          mode="update"
          prodInventory={prodInventory}
          setProdInventory={setProdInventory}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        >
          <StatusInput
            prodStatus={prodStatus}
            setProdStatus={setProdStatus}
            reveal={reveal}
            setReveal={setReveal}
          />
        </OtherInputs>

        <section className="update-product-btns w-full mt-10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => navigate("/admin/products")}
            className="flex-1 h-12 rounded-lg flex justify-center items-center bg-white border border-zinc-300 text-zinc-700 text-sm font-bold hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400 transition-colors tracking-wide shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex-1 h-12 rounded-lg flex justify-center items-center bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed relative transition-colors tracking-wide shadow-xs cursor-pointer"
          >
            {isBusy ? <MiniLoading /> : "Update Product"}
          </button>
        </section>
      </form>
    </div>
  );
};

export default UpdateProduct;
