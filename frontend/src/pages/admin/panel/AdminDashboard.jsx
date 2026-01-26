import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import { 
    fetchDashboardStats, 
    selectDashboardStats, 
    selectDashboardAnalytics, 
    selectDashboardRecentOrders, 
    selectDashboardLoading 
} from "../../../store/features/admin/adminDashboardSlice";

// --- CHART.JS IMPORTS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Link } from "react-router-dom";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
    const dispatch = useDispatch();
    
    // Selectors
    const stats = useSelector(selectDashboardStats);
    const analytics = useSelector(selectDashboardAnalytics);
    const recentOrders = useSelector(selectDashboardRecentOrders);
    const loading = useSelector(selectDashboardLoading);

    useEffect(() => {
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    // --- CHART DATA PREPARATION ---
    const charts = useMemo(() => {
        if (!analytics) return null;

        // =================================================================
        // 1. SALES TREND (Gap Filling Logic)
        // =================================================================
        const filledSalesData = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0 = Jan
        const currentDay = today.getDate(); // e.g., 26

        // Loop from Day 1 to Today
        for (let d = 1; d <= currentDay; d++) {
            // Create date string "YYYY-MM-DD" to match backend format
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            
            // Find if backend has data for this specific date
            const foundData = analytics.salesTrend?.find(item => item.date === dateStr);

            filledSalesData.push({
                date: new Date(year, month, d), // Date object for labeling
                value: foundData ? foundData.value : 0 // Use 0 if no data
            });
        }

        const salesData = {
            labels: filledSalesData.map(item => {
                return `${item.date.getDate()} ${item.date.toLocaleString('default', { month: 'short' })}`;
            }),
            datasets: [
                {
                    fill: true,
                    label: 'Revenue',
                    data: filledSalesData.map(item => item.value),
                    borderColor: '#818cf8', // Indigo-400
                    borderWidth: 2,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(129, 140, 248, 0.4)');
                        gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');
                        return gradient;
                    },
                    tension: 0.4,
                    pointRadius: 0, // Hide points for cleaner look on empty days
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: '#818cf8',
                    pointHoverBackgroundColor: '#818cf8',
                    pointHoverBorderColor: '#fff',
                },
            ],
        };

        // 2. Categories (Doughnut)
        const categoryData = {
            labels: analytics.categories?.map(item => item.name) || [],
            datasets: [
                {
                    data: analytics.categories?.map(item => item.value) || [],
                    backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899"],
                    borderColor: '#18181b', 
                    borderWidth: 4,
                    hoverOffset: 10,
                },
            ],
        };

        // 3. Top Products (Horizontal Bar)
        const productsData = {
            labels: analytics.topProducts?.map(item => {
                const name = item.name;
                return name.length > 20 ? name.substring(0, 20) + '...' : name;
            }) || [],
            datasets: [
                {
                    label: 'Units Sold',
                    data: analytics.topProducts?.map(item => item.value) || [],
                    backgroundColor: '#fbbf24',
                    borderRadius: 4,
                    barThickness: 20,
                    hoverBackgroundColor: '#f59e0b',
                },
            ],
        };

        return { salesData, categoryData, productsData };
    }, [analytics]);

    // --- CHART OPTIONS ---
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                titleColor: '#fff',
                bodyColor: '#a1a1aa',
                borderColor: 'rgba(63, 63, 70, 0.5)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                titleFont: { size: 13, family: "'Inter', sans-serif", weight: '600' },
                bodyFont: { size: 12, family: "'Inter', sans-serif" },
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { 
                    color: '#71717a', 
                    font: { size: 11, family: "'Inter', sans-serif" },
                    maxTicksLimit: 10 // Prevent clutter if showing 30 days
                }
            },
            y: {
                grid: { color: '#27272a', borderDash: [4, 4], drawBorder: false },
                ticks: { 
                    color: '#71717a', 
                    font: { size: 11, family: "'Inter', sans-serif" },
                    callback: (value) => value >= 1000 ? `${value/1000}k` : value
                },
                border: { display: false } 
            }
        }
    };

    const pieOptions = {
        ...commonOptions,
        scales: {},
        plugins: {
            ...commonOptions.plugins,
            legend: { 
                display: true, 
                position: 'right',
                labels: { 
                    color: '#a1a1aa', 
                    usePointStyle: true, 
                    pointStyle: 'circle',
                    boxWidth: 8, 
                    padding: 20,
                    font: { size: 11, family: "'Inter', sans-serif" }
                } 
            }
        },
        cutout: '75%',
        layout: { padding: 20 }
    };

    const barOptions = {
        ...commonOptions,
        indexAxis: 'y',
        scales: {
            x: { display: false, grid: { display: false } },
            y: {
                grid: { display: false },
                ticks: { 
                    color: '#e4e4e7', 
                    font: { size: 12, family: "'Inter', sans-serif", weight: '500' },
                    autoSkip: false,
                    mirror: false,
                    padding: 10
                },
                border: { display: false } 
            }
        },
        layout: {
            padding: { left: 0, right: 30 }
        }
    };

    // --- HELPERS ---
    const formatAmount = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    if (loading) return <div className="w-full h-screen flex justify-center items-center bg-zinc-950"><Loader /></div>;
    if (!charts || !stats) return null;

    // --- SUB-COMPONENTS ---
    const KPICard = ({ title, value, icon, trend, trendValue, colorClass, isCurrency }) => (
        <div className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 group hover:border-zinc-700/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                        {isCurrency ? formatAmount(value) : value}
                    </h3>
                </div>
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-100 ring-1 ring-inset ring-white/5`}>
                    <Icon icon={icon} className="text-2xl" />
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-6 z-10 relative">
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                    <Icon icon={trend === 'up' ? "solar:graph-up-bold" : "solar:graph-down-bold"} />
                    {Math.abs(trendValue || 0).toFixed(1)}%
                </span>
                <span className="text-zinc-600 text-xs font-medium">vs last month</span>
            </div>
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-10 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`} />
        </div>
    );

    return (
        <div className="p-4 lg:p-10 min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
                    <p className="text-zinc-400 text-sm font-medium">Real-time overview of your store's performance.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => dispatch(fetchDashboardStats())} className="group p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white shadow-lg shadow-black/20">
                        <Icon icon="solar:refresh-bold" className="text-xl group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                <KPICard title="Total Revenue" value={stats.revenue} isCurrency={true} icon="solar:wallet-money-bold-duotone" colorClass="text-indigo-400 bg-indigo-500" trend="up" trendValue={12.5} />
                <KPICard title="Active Users" value={stats.users.current} icon="solar:users-group-rounded-bold-duotone" colorClass="text-emerald-400 bg-emerald-500" trend={stats.users.growth >= 0 ? "up" : "down"} trendValue={stats.users.growth} />
                <KPICard title="Net Profit" value={stats.profit} isCurrency={true} icon="solar:graph-new-up-bold-duotone" colorClass="text-amber-400 bg-amber-500" trend="up" trendValue={8.2} />
                <KPICard title="GST Liability" value={stats.gst} isCurrency={true} icon="solar:bill-list-bold-duotone" colorClass="text-rose-400 bg-rose-500" trend="up" trendValue={4.1} />
            </div>

            {/* MAIN CHARTS SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-10">
                {/* 1. SALES TREND */}
                <div className="xl:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-xl shadow-black/20">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">Sales Overview</h3>
                            <p className="text-zinc-500 text-xs mt-1">Revenue performance: 1st {new Date().toLocaleString('default', { month: 'short' })} - Today</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        {charts.salesData.labels.length > 0 ? (
                            <Line data={charts.salesData} options={commonOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Icon icon="solar:chart-square-linear" className="text-5xl mb-3 opacity-20" />
                                <p className="text-sm">No sales data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. CATEGORY BREAKDOWN */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-xl shadow-black/20">
                    <h3 className="text-lg font-bold text-white mb-1">Sales by Category</h3>
                    <p className="text-zinc-500 text-xs mb-8">Distribution of revenue across categories</p>
                    <div className="flex-1 w-full min-h-[250px] relative flex justify-center items-center">
                        {charts.categoryData.labels.length > 0 ? (
                            <div className="w-full h-full p-2">
                                <Doughnut data={charts.categoryData} options={pieOptions} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[120px]">
                                    <span className="text-2xl font-bold text-white">{analytics.categories.length}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Cats</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Icon icon="solar:pie-chart-2-linear" className="text-5xl mb-3 opacity-20" />
                                <p className="text-sm">No category data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECONDARY SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* 3. TOP PRODUCTS */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 shadow-xl shadow-black/20">
                    <h3 className="text-lg font-bold text-white mb-1">Top Selling Products</h3>
                    <p className="text-zinc-500 text-xs mb-6">Best performing items by units sold</p>
                    <div className="h-[300px]">
                        {charts.productsData.labels.length > 0 ? (
                            <Bar data={charts.productsData} options={barOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Icon icon="solar:box-minimalistic-linear" className="text-5xl mb-3 opacity-20" />
                                <p className="text-sm">No product data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. RECENT ORDERS TABLE */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col">
                    <div className="p-4 pb-4 border-b border-zinc-800/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                            <p className="text-zinc-500 text-xs mt-1">Latest transactions from your store</p>
                        </div>
                        <Link to="/admin/orders" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">View All</Link>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-zinc-950/30 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-5 pl-8">Order ID</th>
                                    <th className="p-5">Customer</th>
                                    <th className="p-5">Amount</th>
                                    <th className="p-5 text-right pr-8">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {recentOrders.map(order => (
                                    <tr key={order._id} className="group hover:bg-zinc-800/40 transition-colors">
                                        <td className="p-5 pl-8 text-zinc-300 font-mono text-xs group-hover:text-indigo-300 transition-colors">{order.orderNumber}</td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                                                    {(order.user?.name || order.guestInfo?.name || "G").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-200 font-medium text-sm">{order.user?.name || order.guestInfo?.name || "Guest"}</span>
                                                    <span className="text-zinc-500 text-[10px]">{order.user?.email || order.guestInfo?.email || "No Email"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 font-bold text-white">{formatAmount(order.pricing?.finalTotal)}</td>
                                        <td className="p-5 text-right pr-8">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                                                order.orderStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                order.orderStatus === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                    order.orderStatus === 'delivered' ? 'bg-emerald-400' :
                                                    order.orderStatus === 'cancelled' ? 'bg-rose-400' :
                                                    'bg-amber-400'
                                                }`}></span>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;