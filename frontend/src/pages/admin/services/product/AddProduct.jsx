import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect, useRef, useState } from 'react';
import MiniLoading from '../../../../utils/loader/MiniLoading';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "react-toastify";
import toastControls from "../../../../utils/global/toastControls";
import { addProduct, resetAdminProductState } from '../../../../store/features/admin/adminProductSlice';

const AddProduct = () => {
  const dispatch = useDispatch();

  // Redux state
  const { loading, success, error } = useSelector(state => state.adminProducts.add);

  const [reveal, setReveal] = useState({
    category: false,
    inventory: false,
  });
  const [prodCategory, setProdCategory] = useState("deskmat");
  const [prodInventory, setProdInventory] = useState("Sanmilan, Yuri Gagarin Path, Muchipara");
  const [sizes, setSizes] = useState([]);

  const mainImageCount = prodCategory === "deskmat" ? 7 : 4;
  const highlightImageCount = prodCategory === "deskmat" ? 6 : 3;
  const [mainImages, setMainImages] = useState(Array(mainImageCount).fill(null));
  const [highlightImages, setHighlightImages] = useState(Array(highlightImageCount).fill(null));

  const [errors, setErrors] = useState({
    general: [],
    size: {},
    images: [],
    highlightImg: [],
    others: []
  });

  const categoryRef = useRef(null);
  const inventoryRef = useRef(null);
  const mainImageInputRefs = useRef([]);
  const highlightImageInputRefs = useRef([]);
  const formRef = useRef(null);

  const mainImageArray = Array.from({ length: mainImageCount }, (_, i) => i + 1);
  const highlightImageArray = Array.from({ length: highlightImageCount }, (_, i) => i + 1);

  const productCategories = [
    "deskmat",
    "anime-keychain",
    "anime-figure",
    "anime-katana"
  ];

  const productInventory = [
    "Sanmilan, Yuri Gagarin Path, Muchipara"
  ];

  const SIZE_VALUES_BY_PRODUCT = {
    deskmat: ["l", "xl", "xxl"],
    "anime-keychain": ["onesize"],
    "anime-figure": ["onesize"],
    "anime-katana": ["miniature", "kids-short", "full-length"],
  };

  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/webp', 'image/jpeg'];

  const revealer = (key) => {
    setReveal(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Re-Initialize sizes helper function
  const initializeSizesForCategory = (category) => {
    const SIZE_VALUES_BY_PRODUCT = {
      deskmat: ["l", "xl", "xxl"],
      "anime-keychain": ["onesize"],
      "anime-figure": ["onesize"],
      "anime-katana": ["miniature", "kids-short", "full-length"],
    };

    const allowedSizes = SIZE_VALUES_BY_PRODUCT[category] || [];
    return allowedSizes.map(v => ({
      value: v,
      originalPrice: 0,
      discount: 0,
      stock: 0,
      skuCode: "",
    }));
  };

  
  // ✅ Reset form helper function
  const resetForm = () => {
    // Reset form element
    if (formRef.current) {
      formRef.current.reset();
    }

    // Revoke all preview URLs
    mainImages.forEach(img => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });
    highlightImages.forEach(img => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });

    const defaultCategory = "deskmat";

    // Reset all state
    setProdCategory("deskmat");
    setProdInventory("Sanmilan, Yuri Gagarin Path, Muchipara");
    setSizes(initializeSizesForCategory(defaultCategory));
    setMainImages(Array(7).fill(null)); // Reset to deskmat default
    setHighlightImages(Array(6).fill(null)); // Reset to deskmat default

    // Clear file inputs
    mainImageInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
    highlightImageInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });

    // Clear errors
    setErrors({
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    });
  };

  // ✅ Handle SUCCESS from Redux
  useEffect(() => {
    if (success) {
      toast.success(success.message || "Product added successfully!", toastControls);

      // Reset the form
      resetForm();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset Redux state
      const timer = setTimeout(() => {
        dispatch(resetAdminProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // ✅ Handle ERROR from Redux
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to add product!", toastControls);

      // Handle backend validation errors
      if (error.errors) {
        const backendErrors = error.errors;

        // ✅ Directly use backend error structure (it already matches)
        setErrors({
          general: Array.isArray(backendErrors.general) ? backendErrors.general : [],
          size: typeof backendErrors.size === 'object' && backendErrors.size !== null ? backendErrors.size : {},
          images: Array.isArray(backendErrors.images) ? backendErrors.images : [],
          highlightImg: Array.isArray(backendErrors.highlightImg) ? backendErrors.highlightImg : [],
          others: Array.isArray(backendErrors.others) ? backendErrors.others : []
        });
      } else {
        // If no structured errors, show general error
        setErrors(prev => ({
          ...prev,
          general: [error.message || 'An error occurred while adding the product']
        }));
      }

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset Redux error state
      const timer = setTimeout(() => {
        dispatch(resetAdminProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ✅ Cleanup Redux state on unmount
  useEffect(() => {
    return () => {
      dispatch(resetAdminProductState());
    };
  }, [dispatch]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, category: false }));
      }
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, inventory: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle category change and size initialization
  useEffect(() => {
    const allowedSizes = SIZE_VALUES_BY_PRODUCT[prodCategory] || [];

    setSizes(prev => {
      const filtered = prev.filter(s => allowedSizes.includes(s.value));

      const missing = allowedSizes
        .filter(v => !filtered.some(s => s.value === v))
        .map(v => ({
          value: v,
          originalPrice: 0,
          discount: 0,
          stock: 0,
          skuCode: "",
        }));

      return [...filtered, ...missing];
    });

    // Reset images when category changes
    setMainImages(Array(mainImageCount).fill(null));
    setHighlightImages(Array(highlightImageCount).fill(null));

    // Clear image errors
    setErrors(prev => ({
      ...prev,
      images: [],
      highlightImg: []
    }));
  }, [prodCategory, mainImageCount, highlightImageCount]);

  const updateSize = (value, field, val) => {
    setSizes(prev =>
      prev.map(s =>
        s.value === value ? { ...s, [field]: val } : s
      )
    );
  };

  const handleMainImageSelect = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setErrors(prev => ({
        ...prev,
        images: prev.images.filter(err => !err.includes(`image ${index + 1}`))
      }));

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          images: [...prev.images, `Product image ${index + 1} must be PNG, WEBP, or JPEG format`]
        }));
        if (mainImageInputRefs.current[index]) {
          mainImageInputRefs.current[index].value = '';
        }
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          images: [...prev.images, `Product image ${index + 1} must be less than 10MB`]
        }));
        if (mainImageInputRefs.current[index]) {
          mainImageInputRefs.current[index].value = '';
        }
        return;
      }

      setMainImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          file,
          preview: URL.createObjectURL(file)
        };
        return newImages;
      });
    }
  };

  const handleHighlightImageSelect = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setErrors(prev => ({
        ...prev,
        highlightImg: prev.highlightImg.filter(err => !err.includes(`image ${index + 1}`))
      }));

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          highlightImg: [...prev.highlightImg, `Highlight image ${index + 1} must be PNG, WEBP, or JPEG format`]
        }));
        if (highlightImageInputRefs.current[index]) {
          highlightImageInputRefs.current[index].value = '';
        }
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          highlightImg: [...prev.highlightImg, `Highlight image ${index + 1} must be less than 10MB`]
        }));
        if (highlightImageInputRefs.current[index]) {
          highlightImageInputRefs.current[index].value = '';
        }
        return;
      }

      setHighlightImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          file,
          preview: URL.createObjectURL(file)
        };
        return newImages;
      });
    }
  };

  const removeMainImage = (index) => {
    setMainImages(prev => {
      const newImages = [...prev];
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages[index] = null;
      return newImages;
    });
    if (mainImageInputRefs.current[index]) {
      mainImageInputRefs.current[index].value = '';
    }

    setErrors(prev => ({
      ...prev,
      images: prev.images.filter(err => !err.includes(`image ${index + 1}`))
    }));
  };

  const removeHighlightImage = (index) => {
    setHighlightImages(prev => {
      const newImages = [...prev];
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages[index] = null;
      return newImages;
    });
    if (highlightImageInputRefs.current[index]) {
      highlightImageInputRefs.current[index].value = '';
    }

    setErrors(prev => ({
      ...prev,
      highlightImg: prev.highlightImg.filter(err => !err.includes(`image ${index + 1}`))
    }));
  };

  // ✅ Frontend validation (lightweight - backend is authoritative)
  const validateForm = (formData) => {
    const newErrors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    };

    const productName = formData.get('name');
    if (!productName || productName.trim().length < 10) {
      newErrors.general.push('Product title must be at least 10 characters long');
    }

    const description = formData.get('description');
    if (!description || description.trim().length < 20) {
      newErrors.general.push('Product description must be at least 20 characters long');
    }

    // Basic size validation
    sizes.forEach(size => {
      const sizeErrors = [];

      if (size.originalPrice <= 0) {
        sizeErrors.push('Original price must be greater than 0');
      }
      if (size.discount < 0 || size.discount > 100) {
        sizeErrors.push('Discount must be between 0 and 100');
      }
      if (size.stock <= 0) {
        sizeErrors.push('Stock must be greater than 0');
      }
      if (!size.skuCode || size.skuCode.trim().length === 0) {
        sizeErrors.push('SKU code is required');
      }

      if (sizeErrors.length > 0) {
        newErrors.size[size.value] = sizeErrors;
      }
    });

    // Image count validation
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
      newErrors.others.push('Please select an inventory location');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    });

    const formData = new FormData();
    const formElement = e.target;

    formData.append('name', formElement.name.value);
    formData.append('description', formElement.description.value);
    formData.append('category', prodCategory);
    formData.append('inventory', prodInventory);
    formData.append('sizes', JSON.stringify(sizes));

    mainImages.forEach((img) => {
      if (img && img.file) {
        formData.append('mainImages', img.file);
      }
    });

    highlightImages.forEach((img) => {
      if (img && img.file) {
        formData.append('highlightImages', img.file);
      }
    });

    // Frontend validation
    const validationErrors = validateForm(formData);
    const hasErrors =
      validationErrors.general.length > 0 ||
      Object.keys(validationErrors.size).length > 0 ||
      validationErrors.images.length > 0 ||
      validationErrors.highlightImg.length > 0 ||
      validationErrors.others.length > 0;

    if (hasErrors) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Dispatch to Redux - backend will do final validation
    await dispatch(addProduct(formData));
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      mainImages.forEach(img => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
      highlightImages.forEach(img => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const ErrorDisplay = ({ errors }) => {
    if (!errors || errors.length === 0) return null;
    return (
      <div className="error-container bg-red-900/30 border border-red-500 rounded p-3 mb-3">
        {errors.map((error, index) => (
          <p key={index} className="text-red-400 text-sm mb-1 last:mb-0">• {error}</p>
        ))}
      </div>
    );
  };

  return (
    <div className='px-3 py-10' id='add-product-page'>
      <h1 className='ad-product-heading text-2xl font-semibold mb-3'>Add Product</h1>

      <form id='add-product-form' onSubmit={handleSubmit} ref={formRef}>
        {/* General Details Section */}
        <section className='flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg' id='add-prod-general-inputs'>
          <h2 className="section-heading font-medium mb-3 tracking-wide">General Details</h2>

          <ErrorDisplay errors={errors.general} />

          <div className="add-prod-name w-full flex flex-col">
            <label className='text-sm mb-0.5' htmlFor="add-prod-name-input">Product Title (Min: 10)</label>
            <input
              className='p-2 border-0 outline-0 rounded-[3px] bg-zinc-800'
              type="text"
              id='add-prod-name-input'
              name='name'
            />
          </div>

          <div className="add-prod-description w-full flex flex-col">
            <label className='text-sm mb-0.5' htmlFor="add-prod-desc-input">Product Description (Min: 20)</label>
            <textarea
              className='resize-none bg-zinc-800 rounded-[3px] p-2 border-0 outline-0'
              rows={5}
              name="description"
              id="add-prod-desc-input"
            />
          </div>

          <div className="add-prod-type w-full flex flex-col relative">
            <label className='text-sm mb-0.5 w-fit'>Product Category</label>
            <div
              ref={categoryRef}
              onClick={() => revealer("category")}
              className="add-prod-type-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer"
            >
              <p>{prodCategory}</p>
              <Icon icon="iconoir:nav-arrow-down" />
            </div>
            <ul className={`add-prod-inventory-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${reveal.category ? "mt-1" : "h-0 m-0"}`}>
              {productCategories.map(category => (
                <li
                  key={`${category}-category-key`}
                  onClick={() => setProdCategory(category)}
                  className='w-full py-2 px-3 capitalize hover:bg-indigo-300 hover:text-black cursor-pointer'
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Size Sections */}
        {sizes.map(size => (
          <section key={size.value} className="add-prod-sizing-section rounded-lg p-4 mt-10 bg-zinc-900">
            <h2 className="section-heading font-medium mb-3 tracking-wide">
              (Size: <span className='uppercase'>{size.value}</span>)
            </h2>

            <ErrorDisplay errors={errors.size[size.value] || []} />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm">Original Price</label>
                <input
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-[#f8f8f8]"
                  placeholder='0'
                  value={size.originalPrice || ''}
                  onChange={e => updateSize(size.value, "originalPrice", Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-sm">Discount %</label>
                <input
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-[#f8f8f8]"
                  placeholder='0'
                  value={size.discount || ''}
                  onChange={e => updateSize(size.value, "discount", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm">Stock</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-[#f8f8f8]"
                placeholder='0'
                value={size.stock || ''}
                onChange={e => updateSize(size.value, "stock", Number(e.target.value))}
              />
            </div>

            <div className="mb-3">
              <label className="text-sm">SKU Code</label>
              <input
                type="text"
                className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0"
                value={size.skuCode}
                onChange={e => updateSize(size.value, "skuCode", e.target.value)}
              />
            </div>
          </section>
        ))}

        {/* Main Images Section */}
        <section className="main-image-add-section p-4 mt-10 bg-zinc-900 rounded-lg">
          <h2 className="section-heading font-medium mb-3 tracking-wide">Product Images</h2>

          <ErrorDisplay errors={errors.images} />

          <div className="prod-images-container grid grid-cols-4 gap-2 mt-4">
            {mainImageArray.map((num, index) => (
              <div key={`add-prod-img-${num}`} className="relative">
                <input
                  type="file"
                  accept=".png,.webp,.jpeg,.jpg"
                  onChange={(e) => handleMainImageSelect(index, e)}
                  className="hidden"
                  ref={el => mainImageInputRefs.current[index] = el}
                  id={`main-image-${index}`}
                />
                <label
                  htmlFor={`main-image-${index}`}
                  className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${mainImages[index]?.preview ? 'border-green-500' : 'border-zinc-700'
                    }`}
                >
                  {mainImages[index]?.preview ? (
                    <>
                      <img
                        src={mainImages[index].preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeMainImage(index);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <Icon icon="mdi:close" className="text-lg" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Icon icon="material-symbols-light:add-photo-alternate-outline-rounded" />
                      <span className="text-xs mt-1">{index + 1}</span>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Highlight Images Section */}
        <section className="highlight-image-add-section p-4 bg-zinc-900 rounded-lg mt-10">
          <h2 className="section-heading font-medium mb-3 tracking-wide">Highlight Images</h2>

          <ErrorDisplay errors={errors.highlightImg} />

          <div className="prod-highlight-images-container grid grid-cols-4 gap-2 mt-4">
            {highlightImageArray.map((num, index) => (
              <div key={`add-prod-highlight-img-${num}`} className="relative">
                <input
                  type="file"
                  accept=".png,.webp,.jpeg,.jpg"
                  onChange={(e) => handleHighlightImageSelect(index, e)}
                  className="hidden"
                  ref={el => highlightImageInputRefs.current[index] = el}
                  id={`highlight-image-${index}`}
                />
                <label
                  htmlFor={`highlight-image-${index}`}
                  className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${highlightImages[index]?.preview ? 'border-green-500' : 'border-zinc-700'
                    }`}
                >
                  {highlightImages[index]?.preview ? (
                    <>
                      <img
                        src={highlightImages[index].preview}
                        alt={`Highlight Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeHighlightImage(index);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        aria-label={`Remove highlight image ${index + 1}`}
                      >
                        <Icon icon="mdi:close" className="text-lg" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Icon icon="material-symbols-light:add-photo-alternate-outline-rounded" />
                      <span className="text-xs mt-1">{index + 1}</span>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Other Details Section */}
        <section className="add-prod-other-section p-4 bg-zinc-900 rounded-lg mt-10">
          <h2 className="section-heading font-medium mb-3 tracking-wide">Other Details</h2>

          <ErrorDisplay errors={errors.others} />

          <div className="add-prod-inventory w-full flex flex-col relative">
            <label className='text-sm mb-0.5 w-fit'>Select Inventory</label>
            <div
              ref={inventoryRef}
              onClick={() => revealer("inventory")}
              className="add-prod-inventory-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer"
            >
              <p className='w-[90%] truncate'>{prodInventory}</p>
              <Icon icon="iconoir:nav-arrow-down" />
            </div>
            <ul className={`add-prod-inventory-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${reveal.inventory ? "mt-1" : "h-0 m-0"}`}>
              {productInventory.map(inventory => (
                <li
                  key={`${inventory}-inventory-key`}
                  onClick={() => setProdInventory(inventory)}
                  className='w-full py-1.5 px-3 cursor-pointer hover:bg-zinc-700'
                >
                  {inventory}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Submit Button */}
        <section className="add-product-btns w-full mt-10">
          <button
            type='submit'
            disabled={loading}
            className="add-product-draft-btn w-full h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 mt-2 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative"
          >
            {loading ? <MiniLoading /> : 'Add Product'}
          </button>
        </section>
      </form>
    </div>
  );
};

export default AddProduct;