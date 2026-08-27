import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import MiniLoading from '../../../../utils/loader/MiniLoading';
import toastControls from "../../../../utils/global/toastControls";
import {
  getOneAdminProduct,
  updateProduct,
  resetUpdateProductState
} from '../../../../store/features/admin/adminProductSlice';

import GeneralInputs from '../../../../components/admin/product/add&update/GeneralInputs';
import SizingInputs from '../../../../components/admin/product/add&update/SizingInputs';
import OtherInputs from '../../../../components/admin/product/add&update/OtherInputs';
import UpdateMainImages from '../../../../components/admin/product/add&update/UpdateMainImages';
import UpdateHighlightImages from '../../../../components/admin/product/add&update/UpdateHighlightImages';
import StatusInput from '../../../../components/admin/product/add&update/StatusInput';

import {
  SIZE_VALUES_BY_PRODUCT,
  ALLOWED_IMAGE_TYPES,
  IMAGE_COUNTS_BY_CATEGORY
} from '../../../../constants/adminProductConstants';

const UpdateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { adminProduct, adminProductLoading } = useSelector(state => state.adminProducts);
  const { loading, success, error } = useSelector(state => state.adminProducts.update);

  // Form state
  const [reveal, setReveal] = useState({
    category: false,
    group: false,
    inventory: false,
    status: false,
  });
  const [prodCategory, setProdCategory] = useState("deskmat");
  const [prodGroup, setProdGroup] = useState("General");
  const [prodInventory, setProdInventory] = useState("Shri Bhumi Park, Bidhannagar");
  const [prodStatus, setProdStatus] = useState("published");
  const [sizes, setSizes] = useState([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");

  const mainImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].main;
  const highlightImageCount = IMAGE_COUNTS_BY_CATEGORY[prodCategory].highlight;
  const [mainImages, setMainImages] = useState(Array(mainImageCount).fill(null));
  const [highlightImages, setHighlightImages] = useState(Array(highlightImageCount).fill(null));
  const [mainImagesChanged, setMainImagesChanged] = useState(Array(mainImageCount).fill(false));
  const [highlightImagesChanged, setHighlightImagesChanged] = useState(Array(highlightImageCount).fill(false));

  const [errors, setErrors] = useState({
    general: [],
    size: {},
    images: [],
    highlightImg: [],
    others: []
  });

  const mainImageInputRefs = useRef([]);
  const highlightImageInputRefs = useRef([]);
  const formRef = useRef(null);

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

      if (mainImages[index]?.type === 'new' && mainImages[index]?.preview) {
        URL.revokeObjectURL(mainImages[index].preview);
      }

      setMainImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          type: 'new',
          file,
          preview: URL.createObjectURL(file)
        };
        return newImages;
      });

      setMainImagesChanged(prev => {
        const newChanged = [...prev];
        newChanged[index] = true;
        return newChanged;
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

      if (highlightImages[index]?.type === 'new' && highlightImages[index]?.preview) {
        URL.revokeObjectURL(highlightImages[index].preview);
      }

      setHighlightImages(prev => {
        const newImages = [...prev];
        newImages[index] = {
          type: 'new',
          file,
          preview: URL.createObjectURL(file)
        };
        return newImages;
      });

      setHighlightImagesChanged(prev => {
        const newChanged = [...prev];
        newChanged[index] = true;
        return newChanged;
      });
    }
  };

  const removeMainImage = (index) => {
    if (mainImages[index]?.type === 'new' && mainImages[index]?.preview) {
      URL.revokeObjectURL(mainImages[index].preview);
    }

    setMainImages(prev => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });

    setMainImagesChanged(prev => {
      const newChanged = [...prev];
      newChanged[index] = true;
      return newChanged;
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
    if (highlightImages[index]?.type === 'new' && highlightImages[index]?.preview) {
      URL.revokeObjectURL(highlightImages[index].preview);
    }

    setHighlightImages(prev => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });

    setHighlightImagesChanged(prev => {
      const newChanged = [...prev];
      newChanged[index] = true;
      return newChanged;
    });

    if (highlightImageInputRefs.current[index]) {
      highlightImageInputRefs.current[index].value = '';
    }

    setErrors(prev => ({
      ...prev,
      highlightImg: prev.highlightImg.filter(err => !err.includes(`image ${index + 1}`))
    }));
  };

  const validateForm = () => {
    const newErrors = {
      general: [],
      size: {},
      images: [],
      highlightImg: [],
      others: []
    };

    if (!productName || productName.trim().length < 10) {
      newErrors.general.push('Product title must be at least 10 characters long');
    }

    if (!productDescription || productDescription.trim().length < 20) {
      newErrors.general.push('Product description must be at least 20 characters long');
    }

    if (!prodStatus || !['published', 'archived'].includes(prodStatus)) {
      newErrors.others.push('Invalid product status selected');
    }

    sizes.forEach(size => {
      const sizeErrors = [];

      if (size.originalPrice <= 0) {
        sizeErrors.push('Original price must be greater than 0');
      }

      if (size.numPrice === undefined || size.numPrice === null || size.numPrice < 0) {
        sizeErrors.push('Discounted price is required and cannot be negative');
      } else if (size.numPrice > size.originalPrice) {
        sizeErrors.push('Discounted price cannot be greater than original price');
      }

      if (size.stock < 0) {
        sizeErrors.push('Stock cannot be negative');
      }

      if (!size.skuCode || size.skuCode.trim().length === 0) {
        sizeErrors.push('SKU code is required');
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

    formData.append('name', productName);
    formData.append('description', productDescription);
    formData.append('category', prodCategory);
    formData.append('group', prodGroup.toLowerCase().replace(/\s+/g, '-'));
    formData.append('inventory', prodInventory);
    formData.append('status', prodStatus);
    formData.append('sizes', JSON.stringify(sizes));

    const existingMainImages = [];
    const existingHighlightImages = [];

    mainImages.forEach((img, index) => {
      if (img && img.type === 'existing' && !mainImagesChanged[index]) {
        existingMainImages.push({
          index,
          url: img.url,
          imageId: img.imageId,
          alt: img.alt
        });
      }
    });

    highlightImages.forEach((img, index) => {
      if (img && img.type === 'existing' && !highlightImagesChanged[index]) {
        existingHighlightImages.push({
          index,
          url: img.url,
          imageId: img.imageId,
          alt: img.alt
        });
      }
    });

    formData.append('existingMainImages', JSON.stringify(existingMainImages));
    formData.append('existingHighlightImages', JSON.stringify(existingHighlightImages));

    mainImages.forEach((img, index) => {
      if (img && img.type === 'new' && img.file && mainImagesChanged[index]) {
        formData.append('mainImages', img.file);
        formData.append('mainImagesIndices', index.toString());
      }
    });

    highlightImages.forEach((img, index) => {
      if (img && img.type === 'new' && img.file && highlightImagesChanged[index]) {
        formData.append('highlightImages', img.file);
        formData.append('highlightImagesIndices', index.toString());
      }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await dispatch(updateProduct({ productId, formData }));
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
      setProdInventory(adminProduct.inventory || "Shri Bhumi Park, Bidhannagar");
      setProdStatus(adminProduct.status || "published");

      if (adminProduct.sizes && Array.isArray(adminProduct.sizes)) {
        setSizes(adminProduct.sizes.map(size => ({
          value: size.value,
          originalPrice: size.originalPrice || 0,
          numPrice: size.numPrice || 0,
          discount: size.discount || 0,
          stock: size.stock || 0,
          skuCode: size.skuCode || "",
        })));
      }

      if (adminProduct.images && Array.isArray(adminProduct.images)) {
        const existingMainImages = [...Array(mainImageCount)].map((_, index) => {
          const img = adminProduct.images[index];
          return img ? {
            type: 'existing',
            url: img.url,
            imageId: img.imageId,
            alt: img.alt || ""
          } : null;
        });
        setMainImages(existingMainImages);
        setMainImagesChanged(Array(mainImageCount).fill(false));
      }

      if (adminProduct.highlightImages && Array.isArray(adminProduct.highlightImages)) {
        const existingHighlightImages = [...Array(highlightImageCount)].map((_, index) => {
          const img = adminProduct.highlightImages[index];
          return img ? {
            type: 'existing',
            url: img.url,
            imageId: img.imageId,
            alt: img.alt || ""
          } : null;
        });
        setHighlightImages(existingHighlightImages);
        setHighlightImagesChanged(Array(highlightImageCount).fill(false));
      }
    }
  }, [adminProduct, productId, mainImageCount, highlightImageCount]);

  useEffect(() => {
    if (success) {
      toast.success(success.message || "Product updated successfully!", toastControls);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const timer = setTimeout(() => {
        dispatch(resetUpdateProductState());
        navigate('/admin/products');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update product!", toastControls);

      if (error.errors) {
        setErrors({
          general: Array.isArray(error.errors.general) ? error.errors.general : [],
          size: typeof error.errors.size === 'object' ? error.errors.size : {},
          images: Array.isArray(error.errors.images) ? error.errors.images : [],
          highlightImg: Array.isArray(error.errors.highlightImg) ? error.errors.highlightImg : [],
          others: Array.isArray(error.errors.others) ? error.errors.others : []
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      const timer = setTimeout(() => {
        dispatch(resetUpdateProductState());
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetUpdateProductState());
      mainImages.forEach(img => {
        if (img?.type === 'new' && img?.preview) URL.revokeObjectURL(img.preview);
      });
      highlightImages.forEach(img => {
        if (img?.type === 'new' && img?.preview) URL.revokeObjectURL(img.preview);
      });
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
      <div className="px-3 py-10 flex justify-center items-center min-h-screen">
        <MiniLoading />
      </div>
    );
  }

  if (!adminProduct || adminProduct.id !== productId) {
    return (
      <div className="px-3 py-10">
        <div className="bg-red-900/30 border border-red-500 rounded p-4">
          <p className="text-red-400">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='px-3 py-10' id='update-product-page'>
      <h1 className='ad-product-heading text-2xl font-semibold mb-3'>
        Update Product
      </h1>

      <form id='update-product-form' onSubmit={handleSubmit} ref={formRef}>
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

        <SizingInputs
          sizes={sizes}
          updateSize={updateSize}
          errors={errors}
        />

        <UpdateMainImages
          mainImages={mainImages}
          mainImagesChanged={mainImagesChanged}
          mainImageCount={mainImageCount}
          handleMainImageSelect={handleMainImageSelect}
          removeMainImage={removeMainImage}
          mainImageInputRefs={mainImageInputRefs}
          errors={errors}
        />

        <UpdateHighlightImages
          highlightImages={highlightImages}
          highlightImagesChanged={highlightImagesChanged}
          highlightImageCount={highlightImageCount}
          handleHighlightImageSelect={handleHighlightImageSelect}
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

        <section className="update-product-btns w-full mt-10 flex gap-3">
          <button
            type='button'
            onClick={() => navigate('/admin/products')}
            className="flex-1 h-10 rounded-[3px] flex justify-center items-center bg-zinc-700 text-sm font-medium hover:bg-zinc-600 transition-colors tracking-wide"
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={loading}
            className="flex-1 h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative transition-colors tracking-wide"
          >
            {loading ? <MiniLoading /> : 'Update Product'}
          </button>
        </section>
      </form>
    </div>
  );
};

export default UpdateProduct;