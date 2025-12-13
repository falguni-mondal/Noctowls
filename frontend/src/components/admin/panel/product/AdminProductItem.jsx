import { Icon } from '@iconify/react/dist/iconify.js';
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from 'react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const AdminProductItem = ({ product, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const containerRef = useRef(null);

    // Toggle menu
    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Handle delete button click
    const handleDeleteClick = () => {
        setShowDeleteModal(true);
        setIsMenuOpen(false); // Close menu when modal opens
    };

    // Handle delete confirmation
    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        
        try {
            // Call the delete function passed from parent
            await onDelete(product.id);
            
            // Close modal on success
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Delete failed:', error);
            // You can show an error toast here
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle delete cancellation
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    return (
        <>
            <div className='admin-product-list-item w-full flex justify-between items-center relative'>
                <div className="product-dets flex items-center gap-4 w-[90%]">
                    <div className="admin-product-image-container w-1/4 aspect-square rounded-[3px] border-zinc-800 border overflow-hidden">
                        <img 
                            src={product.image[0]?.url} 
                            alt={`${product.name}-image`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="admin-product-list-item-name text-lg font-medium w-3/4 truncate">
                        {product.name}
                    </p>
                </div>

                {/* Container for button and menu */}
                <div ref={containerRef} className="relative w-[10%]">
                    {/* Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className={`admin-product-list-item-menu-btn w-full h-full text-xl flex justify-center items-center cursor-pointer transition-colors ${
                            isMenuOpen ? 'text-indigo-500' : 'hover:text-indigo-500'
                        }`}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        <Icon icon="iconamoon:menu-kebab-vertical-bold" />
                    </button>

                    {/* Menu Options */}
                    {isMenuOpen && (
                        <div className="admin-product-list-options absolute w-[600%] rounded-[3px] bg-zinc-950 -top-full right-0 shadow-xl border border-zinc-800 z-10">
                            <p className='admin-product-list-item-name font-medium truncate px-3 py-4 border-b border-zinc-700 text-lg'>
                                {product.name}
                            </p>
                            <ul className="admin-product-list-item-dets p-3">
                                <li>
                                    <span className='font-medium'>Sales: </span>
                                    <span>{product.salesCount || 0}</span>
                                </li>
                                <li className='my-1'>
                                    <span className='font-medium'>In Stock: </span>
                                    <span>{product.totalStock}</span>
                                </li>
                                {product.stocks && (
                                    <li>
                                        <ul className='flex justify-between flex-wrap'>
                                            {product.stocks.map((stock, index) => (
                                                <li key={index}>
                                                    <span className='font-medium uppercase'>{stock.size}: </span>
                                                    <span>{stock.stock}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </ul>
                            <div className="admin-product-list-item-btns p-2 flex flex-col gap-1">
                                <Link
                                    className='w-full py-2 rounded-[3px] bg-indigo-700 text-sm font-medium flex justify-center items-center gap-1 hover:bg-indigo-600 transition-colors'
                                    to={`/admin/products/${product.id}/update`}
                                >
                                    <Icon icon="solar:pen-2-linear" />
                                    <span>Update</span>
                                </Link>
                                <button
                                    onClick={handleDeleteClick}
                                    className='w-full py-2 rounded-[3px] bg-zinc-800 text-sm font-medium text-red-600 flex items-center justify-center gap-1 hover:bg-zinc-700 transition-colors'
                                >
                                    <Icon icon="solar:trash-bin-minimalistic-linear" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                productName= {product.name}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />
        </>
    );
};

export default AdminProductItem;