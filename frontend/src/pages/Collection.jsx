import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import ProductListItem from '../components/home/products/ProductListItem';
import { 
    getProductsByGroupAndCategory, 
    selectFilteredProducts, 
    selectFilteredLoading,
    clearFilteredProducts
} from '../store/features/user/productSlice';
import Loader from '../utils/loader/Loader';

const Collection = () => {
    // Get params from URL
    const { category, group } = useParams();
    const dispatch = useDispatch();

    // Grab state from Redux
    const products = useSelector(selectFilteredProducts);
    const loading = useSelector(selectFilteredLoading);
    const error = useSelector(state => state.products.filteredError);

    // Helper to format URL strings ONLY for UI display (Heading and Breadcrumbs)
    const formatString = (str) => {
        if (!str) return "";
        return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };

    const displayCategory = formatString(category);
    const displayGroup = formatString(group);

    // Fetch data on mount or when URL changes
    useEffect(() => {
        if (category && group) {
            dispatch(getProductsByGroupAndCategory({ 
                category: category, 
                group: group 
            }));
        }

        // clear products when leaving the page so old data doesn't flash
        return () => {
            dispatch(clearFilteredProducts());
        };
    }, [dispatch, category, group]);

    return (
        <div className="min-h-screen bg-[#000000] text-white pt-14 pb-20 px-5 lg:px-10">
            
            {/* --- HEADER & BREADCRUMBS --- */}
            <div className="max-w-[1600px] mx-auto mb-10">
                <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-500 font-medium mb-4 uppercase tracking-widest">
                    <Link to="/" className="hover:text-red-500 transition-colors">Home</Link>
                    <Icon icon="material-symbols:chevron-right-rounded" className="text-lg" />
                    <span className="text-zinc-200">{displayGroup}</span>
                </div>
                
                <h1 className={`text-3xl ${group === "phase-00" && "phase-txt"} text-red-600 md:text-5xl font-bold uppercase`}>
                    {displayGroup}
                </h1>
            </div>

            <div className="max-w-[1600px] mx-auto">
                {/* --- LOADING --- */}
                {loading ? (
                    <Loader />
                ) 
                
                /* --- ERROR --- */
                : error ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-6 border border-red-900/50">
                            <Icon icon="solar:danger-triangle-broken" className="text-4xl text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Oops! Something went wrong.</h2>
                        <p className="text-zinc-400 mb-6">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) 
                
                /* --- EMPTY (NO PRODUCTS) --- */
                : products && products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-18 text-center bg-zinc-950/30 rounded-2xl border border-zinc-900 border-dashed">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                            <Icon icon="solar:box-minimalistic-broken" className="text-4xl text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">No Products Found</h2>
                        <p className="text-zinc-400 max-w-md mx-auto mb-8">
                            We couldn't find any products in the <span className="text-zinc-200 font-semibold">{displayGroup}</span> collection right now. Check back later!
                        </p>
                        <Link 
                            to="/catalog"
                            className="bg-red-600 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        >
                            Browse All Products
                        </Link>
                    </div>
                ) 
                
                /* --- SUCCESS (SHOW PRODUCTS) --- */
                : (
                    <>
                        {/* Results Count */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                            <p className="text-zinc-400 text-sm font-medium">
                                Showing <span className="text-white font-bold">{products.length}</span> {products.length === 1 ? 'result' : 'results'}
                            </p>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {products.map((product) => (
                                <Link key={product.id} to={`/products/${product.id}`} className="block h-full">
                                    <ProductListItem product={product} />
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Collection;