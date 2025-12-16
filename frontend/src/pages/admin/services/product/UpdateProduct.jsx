import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import toastControls from "../../../../utils/global/toastControls";
import MiniLoading from '../../../../utils/loader/MiniLoading';
import {
    getOneAdminProduct,
    updateProduct,
    resetUpdateProductState
} from '../../../../store/features/admin/adminProductSlice';

const UpdateProduct = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux state
    const { adminProduct, adminProductLoading } = useSelector(state => state.adminProducts);
    const { loading, success, error } = useSelector(state => state.adminProducts.update);

    const [reveal, setReveal] = useState({
        category: false,
        inventory: false,
        status: false,
    });
    const [prodCategory, setProdCategory] = useState("deskmat");
    const [prodInventory, setProdInventory] = useState("Sanmilan, Yuri Gagarin Path, Muchipara");
    const [prodStatus, setProdStatus] = useState("published");
    const [sizes, setSizes] = useState([]);
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");

    const mainImageCount = prodCategory === "deskmat" ? 7 : 4;
    const highlightImageCount = prodCategory === "deskmat" ? 6 : 3;

    // Image state - stores either existing image data or new file
    const [mainImages, setMainImages] = useState(Array(mainImageCount).fill(null));
    const [highlightImages, setHighlightImages] = useState(Array(highlightImageCount).fill(null));

    // Track which images have been changed
    const [mainImagesChanged, setMainImagesChanged] = useState(Array(mainImageCount).fill(false));
    const [highlightImagesChanged, setHighlightImagesChanged] = useState(Array(highlightImageCount).fill(false));

    const [errors, setErrors] = useState({
        general: [],
        size: {},
        images: [],
        highlightImg: [],
        others: []
    });

    const categoryRef = useRef(null);
    const inventoryRef = useRef(null);
    const statusRef = useRef(null);
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

    const productStatus = [
        "published",
        "archived"
    ]

    const SIZE_VALUES_BY_PRODUCT = {
        deskmat: ["l", "xl", "xxl"],
        "anime-keychain": ["onesize"],
        "anime-figure": ["onesize"],
        "anime-katana": ["miniature", "kids-short", "full-length"],
    };

    const ALLOWED_IMAGE_TYPES = ['image/png', 'image/webp', 'image/jpeg'];

    // ✅ Fetch product data on mount
    useEffect(() => {
        if (productId) {
            dispatch(getOneAdminProduct(productId));
        }
    }, [productId, dispatch]);

    // ✅ Prefill form when product data is loaded
    useEffect(() => {
        if (adminProduct && adminProduct.id === productId) {
            // Set basic fields
            setProductName(adminProduct.name || "");
            setProductDescription(adminProduct.description || "");
            setProdCategory(adminProduct.category);
            setProdInventory(adminProduct.inventory || "Sanmilan, Yuri Gagarin Path, Muchipara");
            setProdStatus(adminProduct.status);

            // Set sizes
            if (adminProduct.sizes && Array.isArray(adminProduct.sizes)) {
                setSizes(adminProduct.sizes.map(size => ({
                    value: size.value,
                    originalPrice: size.originalPrice || 0,
                    discount: size.discount || 0,
                    stock: size.stock || 0,
                    skuCode: size.skuCode || "",
                })));
            }

            // Set existing main images
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

            // Set existing highlight images
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

    const revealer = (key) => {
        setReveal(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

    // ✅ Handle SUCCESS from Redux
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

    // ✅ Handle ERROR from Redux
    useEffect(() => {
        if (error) {
            toast.error(error.message || "Failed to update product!", toastControls);

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
                    general: [error.message || 'An error occurred while updating the product']
                }));
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });

            const timer = setTimeout(() => {
                dispatch(resetUpdateProductState());
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    // ✅ Cleanup Redux state on unmount
    useEffect(() => {
        return () => {
            dispatch(resetUpdateProductState());

            // Cleanup preview URLs
            mainImages.forEach(img => {
                if (img?.type === 'new' && img?.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
            highlightImages.forEach(img => {
                if (img?.type === 'new' && img?.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
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
            if (statusRef.current && !statusRef.current.contains(e.target)) {
                setReveal(prev => ({ ...prev, status: false }));
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Handle category change
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
    }, [prodCategory]);

    const updateSize = (value, field, val) => {
        setSizes(prev =>
            prev.map(s =>
                s.value === value ? { ...s, [field]: val } : s
            )
        );
    };

    // ✅ Handle main image selection (replace existing)
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

            // Cleanup old preview if it was a new file
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

    // ✅ Handle highlight image selection (replace existing)
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

            // Cleanup old preview if it was a new file
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
        // Cleanup preview URL if new file
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
            newChanged[index] = true; // Mark as changed (removed)
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
        // Cleanup preview URL if new file
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
            newChanged[index] = true; // Mark as changed (removed)
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

    // ✅ Frontend validation
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

        if (!prodStatus) {
            newErrors.others.push('Product status is required');
        } else if (!['published', 'archived'].includes(prodStatus)) {
            newErrors.others.push('Invalid product status selected');
        }

        // Size validation
        sizes.forEach(size => {
            const sizeErrors = [];

            if (size.originalPrice <= 0) {
                sizeErrors.push('Original price must be greater than 0');
            }
            if (size.discount < 0 || size.discount > 100) {
                sizeErrors.push('Discount must be between 0 and 100');
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

        // Image validation
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

    // ✅ Handle form submission
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
        formData.append('inventory', prodInventory);
        formData.append('status', prodStatus);
        formData.append('sizes', JSON.stringify(sizes));

        // ... (rest of the image handling code remains the same)

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

        // Frontend validation
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

    // ✅ Show loading while fetching product
    if (adminProductLoading) {
        return (
            <div className="px-3 py-10 flex justify-center items-center min-h-screen">
                <MiniLoading />
            </div>
        );
    }

    // ✅ Show error if product not found
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
            <h1 className='ad-product-heading text-2xl font-semibold mb-3'>Update Product</h1>

            <form id='update-product-form' onSubmit={handleSubmit} ref={formRef}>
                {/* General Details Section */}
                <section className='flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg'>
                    <h2 className="section-heading font-medium mb-3 tracking-wide">General Details</h2>

                    <ErrorDisplay errors={errors.general} />

                    <div className="update-prod-name w-full flex flex-col">
                        <label className='text-sm mb-0.5' htmlFor="update-prod-name-input">Product Title (Min: 10)</label>
                        <input
                            className='p-2 border-0 outline-0 rounded-[3px] bg-zinc-800'
                            type="text"
                            id='update-prod-name-input'
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                    </div>

                    <div className="update-prod-description w-full flex flex-col">
                        <label className='text-sm mb-0.5' htmlFor="update-prod-desc-input">Product Description (Min: 20)</label>
                        <textarea
                            className='resize-none bg-zinc-800 rounded-[3px] p-2 border-0 outline-0'
                            rows={5}
                            id="update-prod-desc-input"
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                        />
                    </div>

                    <div className="update-prod-type w-full flex flex-col relative">
                        <label className='text-sm mb-0.5 w-fit'>Product Category</label>
                        <div
                            ref={categoryRef}
                            onClick={() => revealer("category")}
                            className="update-prod-type-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer"
                        >
                            <p>{prodCategory}</p>
                            <Icon icon="iconoir:nav-arrow-down" />
                        </div>
                        <ul className={`update-prod-inventory-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${reveal.category ? "mt-1" : "h-0 m-0"}`}>
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
                    <section key={size.value} className="update-prod-sizing-section rounded-lg p-4 mt-10 bg-zinc-900">
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
                                    className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0"
                                    value={size.originalPrice || ''}
                                    onChange={e => updateSize(size.value, "originalPrice", Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="text-sm">Discount %</label>
                                <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0"
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
                                className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0"
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
                <section className="main-image-update-section p-4 mt-10 bg-zinc-900 rounded-lg">
                    <h2 className="section-heading font-medium mb-3 tracking-wide">Product Images</h2>
                    <p className="text-xs text-zinc-400 mb-3">Click on an image to replace it, or keep existing ones</p>

                    <ErrorDisplay errors={errors.images} />

                    <div className="prod-images-container grid grid-cols-4 gap-2 mt-4">
                        {mainImageArray.map((num, index) => {
                            const image = mainImages[index];
                            const displayUrl = image?.type === 'new' ? image.preview : image?.url;
                            const isChanged = mainImagesChanged[index];

                            return (
                                <div key={`update-prod-img-${num}`} className="relative">
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
                                        className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${displayUrl
                                                ? (isChanged ? 'border-yellow-500' : 'border-green-500')
                                                : 'border-zinc-700'
                                            }`}
                                    >
                                        {displayUrl ? (
                                            <>
                                                <img
                                                    src={displayUrl}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {isChanged && (
                                                    <div className="absolute top-1 left-1 bg-yellow-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        Changed
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removeMainImage(index);
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
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
                            );
                        })}
                    </div>
                </section>

                {/* Highlight Images Section */}
                <section className="highlight-image-update-section p-4 bg-zinc-900 rounded-lg mt-10">
                    <h2 className="section-heading font-medium mb-3 tracking-wide">Highlight Images</h2>
                    <p className="text-xs text-zinc-400 mb-3">Click on an image to replace it, or keep existing ones</p>

                    <ErrorDisplay errors={errors.highlightImg} />

                    <div className="prod-highlight-images-container grid grid-cols-4 gap-2 mt-4">
                        {highlightImageArray.map((num, index) => {
                            const image = highlightImages[index];
                            const displayUrl = image?.type === 'new' ? image.preview : image?.url;
                            const isChanged = highlightImagesChanged[index];

                            return (
                                <div key={`update-prod-highlight-img-${num}`} className="relative">
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
                                        className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${displayUrl
                                                ? (isChanged ? 'border-yellow-500' : 'border-green-500')
                                                : 'border-zinc-700'
                                            }`}
                                    >
                                        {displayUrl ? (
                                            <>
                                                <img
                                                    src={displayUrl}
                                                    alt={`Highlight ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {isChanged && (
                                                    <div className="absolute top-1 left-1 bg-yellow-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        Changed
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        removeHighlightImage(index);
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
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
                            );
                        })}
                    </div>
                </section>

                {/* Other Details Section */}
                <section className="update-prod-other-section p-4 bg-zinc-900 rounded-lg mt-10">
                    <h2 className="section-heading font-medium mb-3 tracking-wide">Other Details</h2>

                    <ErrorDisplay errors={errors.others} />

                    <div className="update-prod-inventory w-full flex flex-col relative">
                        <label className='text-sm mb-0.5 w-fit'>Select Inventory</label>
                        <div
                            ref={inventoryRef}
                            onClick={() => revealer("inventory")}
                            className="update-prod-inventory-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer"
                        >
                            <p className='w-[90%] truncate'>{prodInventory}</p>
                            <Icon icon="iconoir:nav-arrow-down" />
                        </div>
                        <ul className={`update-prod-inventory-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${reveal.inventory ? "mt-1" : "h-0 m-0"}`}>
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

                    <div className="update-prod-status w-full flex flex-col relative mt-4">
                        <label className='text-sm mb-0.5 w-fit'>Select Status</label>
                        <div
                            ref={statusRef}
                            onClick={() => revealer("status")}
                            className="update-prod-status-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer"
                        >
                            <p className='w-[90%] truncate'>{prodStatus}</p>
                            <Icon icon="iconoir:nav-arrow-down" />
                        </div>
                        <ul className={`update-prod-status-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${reveal.status ? "mt-1" : "h-0 m-0"}`}>
                            {productStatus.map(status => (
                                <li
                                    key={`${status}-status-key`}
                                    onClick={() => setProdStatus(status)}
                                    className='w-full py-1.5 px-3 cursor-pointer hover:bg-zinc-700 capitalize'
                                >
                                    {status}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Submit Button */}
                <section className="update-product-btns w-full mt-10 flex gap-3">
                    <button
                        type='button'
                        onClick={() => navigate('/admin/products')}
                        className="flex-1 h-10 rounded-[3px] flex justify-center items-center bg-zinc-700 text-sm font-medium hover:bg-zinc-600"
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={loading}
                        className="flex-1 h-10 rounded-[3px] flex justify-center items-center bg-indigo-600 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-950 disabled:cursor-not-allowed relative"
                    >
                        {loading ? <MiniLoading /> : 'Update Product'}
                    </button>
                </section>
            </form>
        </div>
    );
};

export default UpdateProduct;