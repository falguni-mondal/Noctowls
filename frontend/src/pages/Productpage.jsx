import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js"
import ImageSlider from "../components/product/ImageSlider"
import { Link, useParams } from "react-router-dom";
import offerImg from "../assets/images/offers.png"
import ProductFeature from "../components/product/product-features/ProductFeature";
import MainDets from "../components/product/product-dets/MainDets";
import ProductQuantity from "../components/product/product-dets/ProductQuantity";
import DeliveryTimeline from "../components/product/product-extra-dets/DeliveryTimeline";
import NoReview from "../components/product/product-review/NoReview";
import ProductSpecs from "../components/product/product-specs/ProductSpecs";
import MoreOptions from "../components/product/more-options/MoreOptions";
import { useDispatch, useSelector } from "react-redux";
import { getOneProduct } from "../store/features/user/productSlice";
import Loader from "../utils/loader/Loader";

const Productpage = () => {
    const [selectedSize, setselectedSize] = useState("l");
    const [quantity, setQuantity] = useState(1);
    const dispatch = useDispatch();
    const { productId } = useParams();
    const { product, productLoading, productError } = useSelector(state => state.products);

    useEffect(() => {
        dispatch(getOneProduct(productId));
    }, [dispatch, productId])

    useEffect(() => {
        if (product?.sizes) {
            const firstAvailableSize = product.sizes.find(s => s.stock > 0);
            if (firstAvailableSize) {
                setselectedSize(firstAvailableSize.value);
            }
        }
    }, [product])

    if (productLoading) {
        return <Loader />
    }

    if (productError || !product) {
        return (
            <div className="w-full py-20 flex justify-center items-center">
                <p className="bg-red-950 border-red-700 border rounded px-5 py-2">Product not found.</p>
            </div>
        )
    }

    const { name, description, category, images, highlightImages, sizes, inStock, salesCount, rating } = product;


    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Check this product",
                    text: "Have a look at this product!",
                    url: url,
                });
            } catch (err) {
                console.log("Share cancelled: ", err);
            }
        } else {
            await navigator.clipboard.writeText(url);
            alert("Product link copied to clipboard!");
        }
    };

    const quantitySetter = (action) => {
        if (action === "increment") {
            setQuantity(prev => prev + 1);
        }
        else if (action === "decrement" && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    }

    return (
        <div className="product-page-wrapper pb-10">
            <div className="product-image-slider w-full pt-5 relative">
                <ImageSlider images={images} />
                <div onClick={handleShare} className="product-link-share-btn absolute top-7 right-3 z-99 w-10 aspect-square rounded-full bg-indigo-200 flex justify-center items-center text-black text-[1.5rem]">
                    <Icon icon="ic:baseline-share" />
                </div>
            </div>

            <div className="product-dets-container">
                <MainDets selectedSize={selectedSize} setselectedSize={setselectedSize} dets={{ name, description, category, sizes, reviewCount: rating.count }} />

                <ProductQuantity quantitySetter={quantitySetter} quantity={quantity} />

                <div className="product-page-btns px-3 mt-5">
                    <div className="product-add-to-cart-btn bg-red-600 text-white py-3 text-center uppercase text-xs font-semibold">Add to cart</div>
                    <div className="product-buy-btn mt-2 bg-zinc-100 text-black py-3 text-center uppercase text-xs font-semibold">Buy now</div>
                </div>

                <div className="product-extra-dets">
                    <DeliveryTimeline />

                    <div className="offer-banner px-3 mt-5">
                        <img className="w-full aspect-auto" src={offerImg} alt="Offers.png" />
                    </div>

                    <div className="product-size-warning text-black text-sm font-semibold px-3 mt-5">
                        <p className="bg-amber-400 px-3 py-5 rounded-lg">Please choose the size carefully as our <Link to="/policies/return" className="underline text-indigo-900">Return Policy</Link> does
                            not cover size exchanges.</p>
                    </div>
                </div>
            </div>

            <div className="product-review-container px-3 mt-8 py-10 border-y border-zinc-700">
                <div className="product-review-header flex flex-col gap-5">
                    <h2 className="product-review-header uppercase text-center font-semibold text-xl">customer reviews</h2>
                    <div className="add-review-btn w-full py-2 text-center text-sm font-medium bg-red-600">
                        Write a review
                    </div>
                </div>
                <div className="reviews mt-5">
                    <NoReview />
                </div>

                <ProductFeature />
            </div>

            <div className="product-highlights px-3 py-10 border-b-[0.5px] border-zinc-700">
                <div className="product-highlights-header">
                    <h2 className="product-highlights-heading uppercase font-semibold mb-2">
                        highlights
                    </h2>
                    <p className="font-medium text-sm leading-tight">Performance wrapped in art, built for modern warriors of precision.</p>
                </div>
                <div className="product-hightlights-image-container mt-10">
                    {
                        highlightImages.map(highlight => (
                            <div key={`${highlight}-highlight-img-key`} className="highlight-img-container w-full bg-zinc-950 rounded mt-3">
                                <img className="w-full aspect-auto" src={highlight.url} alt="" />
                            </div>
                        ))
                    }
                    <div className="highlight-last-img mt-10">
                        <p className="font-medium text-sm leading-tight">Designed to endure daily use, delivering consistent quality and control — day after day.</p>
                        <div className="highlight-img-container w-full bg-zinc-950 rounded mt-5">
                            <img className="w-full aspect-auto" src="https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823" alt="" />
                        </div>
                    </div>
                </div>
            </div>
            <ProductSpecs />
            {/* <section className="more-options-section py-10 px-3">
                <h2 className="text-xl font-semibold uppercase mb-10">more options to choose</h2>
                <MoreOptions products={products} />
            </section> */}
        </div>
    )
}

export default Productpage