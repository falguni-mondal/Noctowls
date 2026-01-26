import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import Loader from "../../../../utils/loader/Loader";
import { 
    getUserDetails, 
    deleteUser, 
    clearCurrentUser,
    selectAdminCurrentUser, 
    selectAdminUserDetailsLoading,
    selectAdminUserActionLoading 
} from "../../../../store/features/admin/adminUserSlice";
import { toast } from "react-toastify";
import toastControls from "../../../../utils/global/toastControls";

const AdminUserDetails = () => {
    const { userId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userData = useSelector(selectAdminCurrentUser);
    const loading = useSelector(selectAdminUserDetailsLoading);
    const actionLoading = useSelector(selectAdminUserActionLoading);

    const [activeTab, setActiveTab] = useState("orders");

    useEffect(() => {
        dispatch(getUserDetails(userId));
        return () => {
            dispatch(clearCurrentUser());
        };
    }, [dispatch, userId]);

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, { ...toastControls, autoClose: 1000 });
    };

    const handleDeleteUser = async () => {
        if(!window.confirm("Are you sure? This will delete the user permanently.")) return;
        try {
            await dispatch(deleteUser(userId)).unwrap();
            toast.success("User deleted successfully", toastControls);
            navigate("/admin/users");
        } catch (error) {
            toast.error(error || "Delete failed", toastControls);
        }
    };

    if (loading || !userData) return <div className="w-full h-screen flex justify-center items-center bg-zinc-950"><Loader /></div>;

    const { profile, stats, orders, cart, wishlist, addresses } = userData;

    // --- SUB-COMPONENTS ---

    const StatCard = ({ icon, label, value, colorClass }) => (
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${colorClass} shrink-0`}>
                <Icon icon={icon} />
            </div>
            <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">{label}</p>
                <p className="font-bold text-white mt-0.5">{value}</p>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === id 
                ? "text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
        >
            <Icon icon={icon} className="text-lg" />
            {label}
            {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {count}
                </span>
            )}
            {activeTab === id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
            )}
        </button>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'shipped': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
            {/* --- HEADER NAVIGATION --- */}
            <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate("/admin/users")}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Icon icon="solar:arrow-left-linear" className="text-xl" />
                    </button>
                    <h1 className="text-lg font-semibold text-zinc-200">User Profile</h1>
                </div>
                {profile.role !== 'admin' && (
                    <button 
                        onClick={handleDeleteUser}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors font-medium"
                    >
                        <Icon icon="solar:trash-bin-trash-bold" />
                        <span className="hidden sm:inline">Delete User</span>
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COLUMN: PROFILE CARD --- */}
                <div className="lg:col-span-1 space-y-6">
                    {/* User Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-indigo-900/20 to-transparent"></div>
                        
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl flex items-center justify-center text-3xl font-bold text-indigo-400 relative z-10 mb-4">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                            {profile.role === 'admin' && (
                                <div className="absolute bottom-0 right-0 bg-purple-500 text-white p-1.5 rounded-full border-2 border-zinc-900 shadow-sm" title="Admin">
                                    <Icon icon="solar:shield-bold" className="text-xs" />
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-white mb-1">{profile.name || "Unknown User"}</h2>
                        <div className="flex items-center gap-2 mb-6">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${profile.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {profile.isVerified ? "Verified Account" : "Unverified"}
                            </span>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
                                        <Icon icon="solar:letter-bold" />
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Email</span>
                                        <span className="text-sm text-zinc-300 truncate w-full" title={profile.email}>{profile.email}</span>
                                    </div>
                                </div>
                                <button onClick={() => copyToClipboard(profile.email, "Email")} className="text-zinc-600 hover:text-indigo-400 transition-colors p-1.5">
                                    <Icon icon="solar:copy-bold-duotone" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
                                        <Icon icon="solar:phone-bold" />
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Phone</span>
                                        <span className="text-sm text-zinc-300 truncate">{profile.phone || "Not provided"}</span>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <button onClick={() => copyToClipboard(profile.phone, "Phone")} className="text-zinc-600 hover:text-indigo-400 transition-colors p-1.5">
                                        <Icon icon="solar:copy-bold-duotone" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
                                        <Icon icon="solar:calendar-date-bold" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Joined</span>
                                        <span className="text-sm text-zinc-300">{new Date(profile.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard 
                            icon="solar:wallet-money-bold" 
                            label="Total Spend" 
                            value={`₹${stats.totalSpent.toLocaleString('en-IN')}`} 
                            colorClass="bg-emerald-500/20 text-emerald-400" 
                        />
                        <StatCard 
                            icon="solar:bag-check-bold" 
                            label="Orders" 
                            value={stats.ordersCount} 
                            colorClass="bg-blue-500/20 text-blue-400" 
                        />
                    </div>
                </div>

                {/* --- RIGHT COLUMN: TABS & CONTENT --- */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Tabs */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex overflow-x-auto scrollbar-hide">
                        <TabButton id="orders" label="Orders" icon="solar:box-minimalistic-bold" count={stats.ordersCount} />
                        <TabButton id="cart" label="Cart" icon="solar:cart-large-bold" count={cart?.length || 0} />
                        <TabButton id="wishlist" label="Wishlist" icon="solar:heart-bold" count={wishlist?.length || 0} />
                        <TabButton id="addresses" label="Addresses" icon="solar:map-point-bold" count={addresses?.length || 0} />
                    </div>

                    {/* Tab Content */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden min-h-[400px]">
                        
                        {/* ORDERS TAB */}
                        {activeTab === "orders" && (
                            <div className="p-0">
                                {orders.length === 0 ? (
                                    <EmptyState icon="solar:box-minimalistic-broken" message="No orders placed yet." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-950/50 text-zinc-500 border-b border-zinc-800">
                                                <tr>
                                                    <th className="p-4 font-medium pl-6">Order ID</th>
                                                    <th className="p-4 font-medium">Date</th>
                                                    <th className="p-4 font-medium">Amount</th>
                                                    <th className="p-4 font-medium">Status</th>
                                                    <th className="p-4 font-medium text-right pr-6">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/50">
                                                {orders.map(order => (
                                                    <tr key={order._id} className="hover:bg-zinc-800/30 transition-colors group">
                                                        <td className="p-4 pl-6 font-mono text-zinc-300">{order.orderNumber}</td>
                                                        <td className="p-4 text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 font-semibold text-zinc-200">₹{order.pricing.finalTotal.toLocaleString('en-IN')}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.orderStatus)}`}>
                                                                {order.orderStatus}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            <Link to={`/admin/orders/${order._id}`} className="text-indigo-400 hover:text-white transition-colors flex items-center justify-end gap-1">
                                                                View <Icon icon="solar:arrow-right-linear" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CART TAB */}
                        {activeTab === "cart" && (
                            <div className="p-6">
                                {cart.length === 0 ? (
                                    <EmptyState icon="solar:cart-large-broken" message="Cart is empty." />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                                <div className="w-20 h-20 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                                                    <img src={item.product?.images?.[0]?.url || item.product?.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <h4 className="font-medium text-zinc-200 truncate">{item.product?.name || item.name}</h4>
                                                    <div className="text-xs text-zinc-500 mt-1 flex gap-3">
                                                        <span>Size: <span className="text-zinc-300 uppercase">{item.size?.value}</span></span>
                                                        <span>Qty: <span className="text-zinc-300">{item.quantity}</span></span>
                                                    </div>
                                                    <div className="mt-2 font-semibold text-indigo-400">₹{item.price?.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* WISHLIST TAB */}
                        {activeTab === "wishlist" && (
                            <div className="p-6">
                                {wishlist.length === 0 ? (
                                    <EmptyState icon="solar:heart-broken" message="Wishlist is empty." />
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {wishlist.map((item, idx) => (
                                            <div key={idx} className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group">
                                                <div className="aspect-4/5 bg-zinc-900 overflow-hidden relative">
                                                    <img 
                                                        src={item.images?.[0]?.url || item.image} 
                                                        alt="" 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                    />
                                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">
                                                        ₹{item.price?.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-xs font-medium text-zinc-300 truncate">{item.name}</h4>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">{item.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ADDRESSES TAB */}
                        {activeTab === "addresses" && (
                            <div className="p-6">
                                {addresses.length === 0 ? (
                                    <EmptyState icon="solar:map-point-broken" message="No saved addresses." />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map((addr, idx) => (
                                            <div key={idx} className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl relative group hover:border-zinc-700 transition-colors">
                                                {addr.isDefault && (
                                                    <span className="absolute top-3 right-3 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Default</span>
                                                )}
                                                <div className="flex items-center gap-2 mb-2 text-zinc-200 font-medium">
                                                    <Icon icon="solar:home-smile-bold" className="text-zinc-500" />
                                                    {addr.fullName}
                                                </div>
                                                <p className="text-sm text-zinc-400 leading-relaxed">
                                                    {addr.address}<br />
                                                    {addr.city}, {addr.state} - {addr.pincode}
                                                </p>
                                                <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-500">
                                                    <Icon icon="solar:phone-bold" /> {addr.phone}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Empty States
const EmptyState = ({ icon, message }) => (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
            <Icon icon={icon} className="text-3xl opacity-50" />
        </div>
        <p className="text-sm">{message}</p>
    </div>
);

export default AdminUserDetails;