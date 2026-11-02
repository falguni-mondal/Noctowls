import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MiniLoading from "../../../../utils/loader/MiniLoading";
import toastControls from "../../../../utils/global/toastControls";
import {
  addProduct,
  resetAddProductState,
} from "../../../../store/features/admin/adminProductSlice";
import {
  uploadFilesToImageKit,
  cleanupImageKitFiles,
  sanitizeFolderName,
} from "../../../../utils/helpers/imagekitUpload";

import GeneralInputs from "../../../../components/admin/product/add&update/GeneralInputs";
import SizingInputs from "../../../../components/admin/product/add&update/SizingInputs";
import MainImages from "../../../../components/admin/product/add&update/MainImages";
import HighlightImages from "../../../../components/admin/product/add&update/HighlightImages";
import OtherInputs from "../../../../components/admin/product/add&update/OtherInputs";

import {
  SIZE_VALUES_BY_PRODUCT,
  ALLOWED_IMAGE_TYPES,
  IMAGE_COUNTS_BY_CATEGORY,
} from "../../../../constants/adminProductConstants";

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, success, error } = useSelector(
    (state) => state.adminProducts.add
  );

  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Form state
  const [reveal, setReveal] = useState({
    category: false,
    group: false,
    inventory: false,
  });
  const [prodCategory, setProdCategory] = useState("deskmat");
  const [prodGroup, setProdGroup] = useState("General");
  const [prodInventory, setProdInventory] = useState(
    "Shri Bhumi Park, Bidhannagar"
  );
  const [sizes, setSizes] = useState([]);

  // Image state
  const mainImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].main;
  const highlightImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].highlight;
  const [mainImages, setMainImages] = useState(
    Array(mainImageCount).fill(null)
  );
  const [highlightImages, setHighlightImages] = useState(
    Array(highlightImageCount).fill(null)
  );

  // Error state
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

  const initializeSizesForCategory = (category) => {
    const allowedSizes = SIZE_VALUES_BY_PRODUCT[category] || [];
    return allowedSizes.map((v) => ({
      value: v,
      originalPrice: 0,
      numPrice: 0,
      discount: 0,
      stock: 0,
      skuCode: "",
    }));
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }

    mainImages.forEach((img) => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });
    highlightImages.forEach((img) => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });

    const defaultCategory = "deskmat";

    setProdCategory(defaultCategory);
    setProdGroup("General");
    setProdInventory("Shri Bhumi Park, Bidhannagar");
    setSizes(initializeSizesForCategory(defaultCategory));
    setMainImages(
      Array(IMAGE_COUNTS_BY_CATEGORY[defaultCategory].main).fill(null)
    );
    setHighlightImages(
      Array(IMAGE_COUNTS_BY_CATEGORY[defaultCategory].highlight).fill(null)
    );

    mainImageInputRefs.current.forEach((ref) => {
      if (ref) ref.value = "";
    });
    highlightImageInputRefs.current.forEach((ref) => {
      if (ref) ref.value = "";
    });

    setErrors({
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: [],
    });
  };

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

    // Determine target slot order
    const targetSlots = [];
    if (startIndex === null || startIndex === undefined) {
      // Fill empty slots first, then sequential slots from 0
      for (let i = 0; i < maxCount; i++) {
        if (!currentImages[i]) targetSlots.push(i);
      }
      for (let i = 0; i < maxCount; i++) {
        if (!targetSlots.includes(i)) targetSlots.push(i);
      }
    } else if (validFiles.length === 1) {
      targetSlots.push(startIndex);
    } else {
      // Fill starting from clicked startIndex, then any remaining empty slots
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
          if (next[slotIdx]?.preview) {
            URL.revokeObjectURL(next[slotIdx].preview);
          }
          next[slotIdx] = {
            file,
            preview: URL.createObjectURL(file),
          };
        });
        return next;
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
      inputRefs: highlightImageInputRefs,
      errorKey: "highlightImg",
      labelPrefix: "Highlight image",
    });
  };

  // Drag-and-drop / arrow reordering helper
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
      // Swap directly when dropping onto an empty slot
      next[toIndex] = next[fromIndex];
      next[fromIndex] = null;
    } else {
      // Shift items when reordering between filled slots
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
    }
    return next;
  };

  const reorderMainImages = (fromIndex, toIndex) => {
    setMainImages((prev) => reorderImageArray(prev, fromIndex, toIndex));
  };

  const reorderHighlightImages = (fromIndex, toIndex) => {
    setHighlightImages((prev) => reorderImageArray(prev, fromIndex, toIndex));
  };

  const removeMainImage = (index) => {
    setMainImages((prev) => {
      const newImages = [...prev];
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages[index] = null;
      return newImages;
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
    setHighlightImages((prev) => {
      const newImages = [...prev];
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages[index] = null;
      return newImages;
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

  const validateForm = (productName, description) => {
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

    if (!description || description.trim().length < 20) {
      newErrors.general.push(
        "Product description must be at least 20 characters long"
      );
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
      if (!mainImages[i] || !mainImages[i].file) {
        newErrors.images.push(`Product image ${i + 1} is required`);
      }
    }

    for (let i = 0; i < highlightImageCount; i++) {
      if (!highlightImages[i] || !highlightImages[i].file) {
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

    const formElement = e.target;
    const productName = formElement.name.value;
    const description = formElement.description.value;

    const validationErrors = validateForm(productName, description);
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

    const folderName = sanitizeFolderName(productName);
    let uploadedMainImages = [];
    let uploadedHighlightImages = [];

    try {
      setIsUploadingImages(true);

      const [mainRes, highlightRes] = await Promise.all([
        uploadFilesToImageKit(
          mainImages.map((img) => ({
            file: img.file,
            alt: folderName,
          })),
          {
            folder: `/products/${prodCategory}/${folderName}/main`,
            maxWidth: 2400,
            quality: 0.82,
          }
        ),
        uploadFilesToImageKit(
          highlightImages.map((img) => ({
            file: img.file,
            alt: folderName,
          })),
          {
            folder: `/products/${prodCategory}/${folderName}/highlight`,
            maxWidth: 2400,
            quality: 0.82,
          }
        ),
      ]);

      uploadedMainImages = mainRes;
      uploadedHighlightImages = highlightRes;
    } catch (uploadErr) {
      await cleanupImageKitFiles([
        ...uploadedMainImages,
        ...uploadedHighlightImages,
      ]);
      setIsUploadingImages(false);
      toast.error(
        uploadErr.message || "Failed to upload product images to ImageKit",
        toastControls
      );
      return;
    } finally {
      setIsUploadingImages(false);
    }

    const productData = {
      name: productName,
      description,
      category: prodCategory,
      group: prodGroup.toLowerCase().replace(/\s+/g, "-"),
      inventory: prodInventory,
      sizes,
      mainImages: uploadedMainImages,
      highlightImages: uploadedHighlightImages,
    };

    await dispatch(addProduct(productData));
  };

  useEffect(() => {
    if (success) {
      toast.success(
        success.message || "Product added successfully!",
        toastControls
      );
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });

      const timer = setTimeout(() => {
        dispatch(resetAddProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to add product!", toastControls);

      if (error.errors) {
        const backendErrors = error.errors;
        setErrors({
          general: Array.isArray(backendErrors.general)
            ? backendErrors.general
            : [],
          size:
            typeof backendErrors.size === "object" &&
            backendErrors.size !== null
              ? backendErrors.size
              : {},
          images: Array.isArray(backendErrors.images)
            ? backendErrors.images
            : [],
          highlightImg: Array.isArray(backendErrors.highlightImg)
            ? backendErrors.highlightImg
            : [],
          others: Array.isArray(backendErrors.others)
            ? backendErrors.others
            : [],
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          general: [
            error.message || "An error occurred while adding the product",
          ],
        }));
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

      const timer = setTimeout(() => {
        dispatch(resetAddProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetAddProductState());
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

    setMainImages(Array(mainImageCount).fill(null));
    setHighlightImages(Array(highlightImageCount).fill(null));

    setErrors((prev) => ({
      ...prev,
      images: [],
      highlightImg: [],
    }));
  }, [prodCategory, mainImageCount, highlightImageCount]);

  useEffect(() => {
    return () => {
      mainImages.forEach((img) => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
      highlightImages.forEach((img) => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const isBusy = isUploadingImages || loading;

  return (
    <div
      className="px-4 py-8 max-w-4xl mx-auto text-zinc-800 bg-white min-h-screen"
      id="add-product-page"
    >
      <h1 className="ad-product-heading text-2xl font-bold mb-6 text-zinc-900 border-b border-zinc-200 pb-3">
        Add Product
      </h1>

      <form id="add-product-form" onSubmit={handleSubmit} ref={formRef}>
        <GeneralInputs
          prodCategory={prodCategory}
          setProdCategory={setProdCategory}
          prodGroup={prodGroup}
          setProdGroup={setProdGroup}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        />

        <SizingInputs sizes={sizes} updateSize={updateSize} errors={errors} />

        <MainImages
          mainImages={mainImages}
          mainImageCount={mainImageCount}
          handleMainImageSelect={handleMainImageSelect}
          reorderMainImages={reorderMainImages}
          removeMainImage={removeMainImage}
          mainImageInputRefs={mainImageInputRefs}
          errors={errors}
        />

        <HighlightImages
          highlightImages={highlightImages}
          highlightImageCount={highlightImageCount}
          handleHighlightImageSelect={handleHighlightImageSelect}
          reorderHighlightImages={reorderHighlightImages}
          removeHighlightImage={removeHighlightImage}
          highlightImageInputRefs={highlightImageInputRefs}
          errors={errors}
        />

        <OtherInputs
          prodInventory={prodInventory}
          setProdInventory={setProdInventory}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        />

        <section
          className="w-full mt-12 flex flex-col gap-3"
          id="add-product-btns"
        >
          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-12 rounded-lg flex justify-center items-center bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors tracking-wide shadow-sm"
          >
            {isBusy ? <MiniLoading /> : "Add Product"}
          </button>

          <button
            onClick={() => navigate("/admin/products")}
            type="button"
            disabled={isBusy}
            className="w-full h-12 rounded-lg flex justify-center items-center bg-white border border-zinc-300 text-zinc-700 text-sm font-bold hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors tracking-wide shadow-sm"
          >
            Cancel
          </button>
        </section>
      </form>
    </div>
  );
};

export default AddProduct;
