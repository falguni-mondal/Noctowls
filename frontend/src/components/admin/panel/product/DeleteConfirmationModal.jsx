import { Icon } from '@iconify/react/dist/iconify.js';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action",
    productName,
    confirmText = "Yes, Delete",
    cancelText = "Cancel",
    isLoading = false
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        // Close modal if clicking the overlay (not the content)
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Icon 
                                icon="solar:danger-triangle-bold" 
                                className="text-red-500 text-xl"
                            />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            {title}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-zinc-400 leading-relaxed">
                        Are you sure you want to delete <span className='text-white'>"{productName}"</span>? This action cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Icon icon="eos-icons:loading" className="text-lg" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;