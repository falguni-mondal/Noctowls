import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import MiniLoading from '../../../../utils/loader/MiniLoading';
import toastControls from "../../../../utils/global/toastControls";
import { addProduct, resetAddProductState } from '../../../../store/features/admin/adminProductSlice';

// Components
import GeneralInputs from '../../../../components/admin/product/add&update/GeneralInputs';
import SizingInputs from '../../../../components/admin/product/add&update/SizingInputs';
import MainImages from '../../../../components/admin/product/add&update/MainImages';
import HighlightImages from '../../../../components/admin/product/add&update/HighlightImages';
import OtherInputs from '../../../../components/admin/product/add&update/OtherInputs';

// Constants
import { 
  SIZE_VALUES_BY_PRODUCT, 
  ALLOWED_IMAGE_TYPES,
  IMAGE_COUNTS_BY_CATEGORY 
} from '../../../../constants/adminProductConstants';

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { loading, success, error } = useSelector(state => state.adminProducts.add);

  // Form state
  const [reveal, setReveal] = useState({
    category: false,
    inventory: false,
  });
  const [prodCategory, setProdCategory] = useState("deskmat");
  const [prodInventory, setProdInventory] = useState("Sanmilan, Yuri Gagarin Path, Muchipara");
  const [sizes, setSizes] = useState([]);

  // Image state
  const mainImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].main;
  const highlightImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].highlight;
  const [mainImages, setMainImages] = useState(Array(mainImageCount).fill(null));
  const [highlightImages, setHighlightImages] = useState(Array(highlightImageCount).fill(null));

  // Error state
  const [errors, setErrors] = useState({
    general: [],
    size: {},
    images: [],
    highlightImg: [],
    others: []
  });

  // Refs
  const mainImageInputRefs = useRef([]);
  const highlightImageInputRefs = useRef([]);
  const formRef = useRef(null);

  // ==================== HELPER FUNCTIONS ====================

  const initializeSizesForCategory = (category) => {
    const allowedSizes = SIZE_VALUES_BY_PRODUCT[category] || [];
    return allowedSizes.map(v => ({
      value: v,
      originalPrice: 0,
      discount: 0,
      stock: 0,
      skuCode: "",
    }));
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }

    mainImages.forEach(img => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });
    highlightImages.forEach(img => {
      if (img?.preview) URL.revokeObjectURL(img.preview);
    });

    const defaultCategory = "deskmat";

    setProdCategory(defaultCategory);
    setProdInventory("Sanmilan, Yuri Gagarin Path, Muchipara");
    setSizes(initializeSizesForCategory(defaultCategory));
    setMainImages(Array(IMAGE_COUNTS_BY_CATEGORY[defaultCategory].main).fill(null));
    setHighlightImages(Array(IMAGE_COUNTS_BY_CATEGORY[defaultCategory].highlight).fill(null));

    mainImageInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
    highlightImageInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });

    setErrors({
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    });
  };

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

    await dispatch(addProduct(formData));
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (success) {
      toast.success(success.message || "Product added successfully!", toastControls);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });

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
          general: Array.isArray(backendErrors.general) ? backendErrors.general : [],
          size: typeof backendErrors.size === 'object' && backendErrors.size !== null ? backendErrors.size : {},
          images: Array.isArray(backendErrors.images) ? backendErrors.images : [],
          highlightImg: Array.isArray(backendErrors.highlightImg) ? backendErrors.highlightImg : [],
          others: Array.isArray(backendErrors.others) ? backendErrors.others : []
        });
      } else {
        setErrors(prev => ({
          ...prev,
          general: [error.message || 'An error occurred while adding the product']
        }));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

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

    setMainImages(Array(mainImageCount).fill(null));
    setHighlightImages(Array(highlightImageCount).fill(null));

    setErrors(prev => ({
      ...prev,
      images: [],
      highlightImg: []
    }));
  }, [prodCategory, mainImageCount, highlightImageCount]);

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

  // ==================== RENDER ====================

  return (
    <div className='px-3 py-10' id='add-product-page'>
      <h1 className='ad-product-heading text-2xl font-semibold mb-3'>
        Add Product
      </h1>

      <form id='add-product-form' onSubmit={handleSubmit} ref={formRef}>
        {/* General Inputs */}
        <GeneralInputs
          prodCategory={prodCategory}
          setProdCategory={setProdCategory}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        />

        {/* Sizing Inputs */}
        <SizingInputs
          sizes={sizes}
          updateSize={updateSize}
          errors={errors}
        />

        {/* Main Images */}
        <MainImages
          mainImages={mainImages}
          mainImageCount={mainImageCount}
          handleMainImageSelect={handleMainImageSelect}
          removeMainImage={removeMainImage}
          mainImageInputRefs={mainImageInputRefs}
          errors={errors}
        />

        {/* Highlight Images */}
        <HighlightImages
          highlightImages={highlightImages}
          highlightImageCount={highlightImageCount}
          handleHighlightImageSelect={handleHighlightImageSelect}
          removeHighlightImage={removeHighlightImage}
          highlightImageInputRefs={highlightImageInputRefs}
          errors={errors}
        />

        {/* Other Inputs */}
        <OtherInputs
          prodInventory={prodInventory}
          setProdInventory={setProdInventory}
          errors={errors}
          reveal={reveal}
          setReveal={setReveal}
        />

        {/* Submit Buttons */}
        <section className="w-full mt-10 flex flex-col gap-2" id='add-product-btns'>
          <button
            type='submit'
            disabled={loading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative tracking-wide"
          >
            {loading ? <MiniLoading /> : 'Add Product'}
          </button>
          
          <button
            onClick={() => navigate("/admin/products")}
            type='button'
            disabled={loading}
            className="w-full h-10 rounded-[3px] flex justify-center items-center bg-zinc-700 text-sm font-medium hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed relative tracking-wide"
          >
            Cancel
          </button>
        </section>
      </form>
    </div>
  );
};

export default AddProduct;