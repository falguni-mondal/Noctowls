import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Loader from "../../../utils/loader/Loader";
import {
  fetchDashboardStats,
  selectDashboardStats,
  selectDashboardAnalytics,
  selectDashboardRecentOrders,
  selectDashboardLoading,
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
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
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

    // 1. SALES TREND (Gap Filling Logic)
    const filledSalesData = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDay = today.getDate();

    for (let d = 1; d <= currentDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const foundData = analytics.salesTrend?.find(
        (item) => item.date === dateStr
      );

      filledSalesData.push({
        date: new Date(year, month, d),
        value: foundData ? foundData.value : 0,
      });
    }

    const salesData = {
      labels: filledSalesData.map((item) => {
        return `${item.date.getDate()} ${item.date.toLocaleString("default", {
          month: "short",
        })}`;
      }),
      datasets: [
        {
          fill: true,
          label: "Revenue",
          data: filledSalesData.map((item) => item.value),
          borderColor: "#4f46e5", // Indigo-600
          borderWidth: 2.5,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(79, 70, 229, 0.25)");
            gradient.addColorStop(1, "rgba(79, 70, 229, 0)");
            return gradient;
          },
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#4f46e5",
          pointBorderColor: "#4f46e5",
          pointHoverBackgroundColor: "#4f46e5",
          pointHoverBorderColor: "#fff",
        },
      ],
    };

    // 2. Categories (Doughnut)
    const categoryData = {
      labels: analytics.categories?.map((item) => item.name) || [],
      datasets: [
        {
          data: analytics.categories?.map((item) => item.value) || [],
          backgroundColor: [
            "#4f46e5",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#ec4899",
          ],
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 10,
        },
      ],
    };

    // 3. Top Products (Horizontal Bar)
    const productsData = {
      labels:
        analytics.topProducts?.map((item) => {
          const name = item.name;
          return name.length > 20 ? name.substring(0, 20) + "..." : name;
        }) || [],
      datasets: [
        {
          label: "Units Sold",
          data: analytics.topProducts?.map((item) => item.value) || [],
          backgroundColor: "#f59e0b",
          borderRadius: 6,
          barThickness: 20,
          hoverBackgroundColor: "#d97706",
        },
      ],
    };

    return { salesData, categoryData, productsData };
  }, [analytics]);

  // --- CHART OPTIONS (LIGHT THEME) ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#18181b",
        bodyColor: "#52525b",
        borderColor: "#e4e4e7",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { size: 13, family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#52525b",
          font: { size: 11, family: "'Inter', sans-serif" },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: { color: "#e4e4e7", borderDash: [4, 4], drawBorder: false },
        ticks: {
          color: "#52525b",
          font: { size: 11, family: "'Inter', sans-serif" },
          callback: (value) => (value >= 1000 ? `${value / 1000}k` : value),
        },
        border: { display: false },
      },
    },
  };

  const pieOptions = {
    ...commonOptions,
    scales: {},
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: true,
        position: "right",
        labels: {
          color: "#3f3f46",
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          padding: 20,
          font: { size: 11, family: "'Inter', sans-serif", weight: "500" },
        },
      },
    },
    cutout: "75%",
    layout: { padding: 20 },
  };

  const barOptions = {
    ...commonOptions,
    indexAxis: "y",
    scales: {
      x: { display: false, grid: { display: false } },
      y: {
        grid: { display: false },
        ticks: {
          color: "#27272a",
          font: { size: 12, family: "'Inter', sans-serif", weight: "600" },
          autoSkip: false,
          mirror: false,
          padding: 10,
        },
        border: { display: false },
      },
    },
    layout: {
      padding: { left: 0, right: 30 },
    },
  };

  const formatAmount = (val) =>
    `₹${(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#f4f4f4]">
        <Loader />
      </div>
    );
  if (!charts || !stats) return null;

  const KPICard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    iconBgClass,
    iconTextClass,
    isCurrency,
  }) => (
    <div className="relative overflow-hidden bg-white border border-zinc-200 rounded-xl p-5 group hover:border-zinc-300 transition-all duration-300 shadow-xs hover:shadow-md">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">
            {isCurrency ? formatAmount(value) : value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-2xl ${iconBgClass} ${iconTextClass} border border-black/5`}
        >
          <Icon icon={icon} className="text-2xl" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 z-10 relative">
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
            trend === "up"
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
              : "text-rose-700 bg-rose-50 border border-rose-200"
          }`}
        >
          <Icon
            icon={
              trend === "up" ? "solar:graph-up-bold" : "solar:graph-down-bold"
            }
          />
          {Math.abs(trendValue || 0).toFixed(1)}%
        </span>
        <span className="text-zinc-500 text-xs font-medium">vs last month</span>
      </div>
    </div>
  );

  // Ensure recent orders are sorted newest-first
  const sortedRecentOrders = [...(recentOrders || [])].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );

  return (
    <div className="p-4 lg:p-10 min-h-screen bg-[#f4f4f4] text-zinc-900 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-600 text-sm font-medium">
            Real-time overview of your store's performance.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch(fetchDashboardStats())}
            className="group p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-700 hover:text-zinc-900 shadow-xs cursor-pointer"
            title="Refresh Dashboard"
          >
            <Icon
              icon="solar:refresh-bold"
              className="text-xl group-hover:rotate-180 transition-transform duration-500"
            />
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <KPICard
          title="Total Revenue"
          value={stats.revenue}
          isCurrency={true}
          icon="solar:wallet-money-bold-duotone"
          iconBgClass="bg-indigo-50"
          iconTextClass="text-indigo-600"
          trend="up"
          trendValue={12.5}
        />
        <KPICard
          title="Active Users"
          value={stats.users.current}
          icon="solar:users-group-rounded-bold-duotone"
          iconBgClass="bg-emerald-50"
          iconTextClass="text-emerald-600"
          trend={stats.users.growth >= 0 ? "up" : "down"}
          trendValue={stats.users.growth}
        />
        <KPICard
          title="Net Profit"
          value={stats.profit}
          isCurrency={true}
          icon="solar:graph-new-up-bold-duotone"
          iconBgClass="bg-amber-50"
          iconTextClass="text-amber-600"
          trend="up"
          trendValue={8.2}
        />
        <KPICard
          title="GST Liability"
          value={stats.gst}
          isCurrency={true}
          icon="solar:bill-list-bold-duotone"
          iconBgClass="bg-rose-50"
          iconTextClass="text-rose-600"
          trend="up"
          trendValue={4.1}
        />
      </div>

      {/* MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-10">
        {/* 1. SALES TREND */}
        <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                Sales Overview
              </h3>
              <p className="text-zinc-500 text-xs mt-1">
                Revenue performance: 1st{" "}
                {new Date().toLocaleString("default", { month: "short" })} -
                Today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {charts.salesData.labels.length > 0 ? (
              <Line data={charts.salesData} options={commonOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Icon
                  icon="solar:chart-square-linear"
                  className="text-5xl mb-3 opacity-40"
                />
                <p className="text-sm text-zinc-500">No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. CATEGORY BREAKDOWN */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col shadow-xs">
          <h3 className="text-lg font-bold text-zinc-900 mb-1">
            Sales by Category
          </h3>
          <p className="text-zinc-500 text-xs mb-8">
            Distribution of revenue across categories
          </p>
          <div className="flex-1 w-full min-h-[250px] relative flex justify-center items-center">
            {charts.categoryData.labels.length > 0 ? (
              <div className="w-full h-full p-2">
                <Doughnut data={charts.categoryData} options={pieOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[120px]">
                  <span className="text-2xl font-bold text-zinc-900">
                    {analytics.categories.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Cats
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Icon
                  icon="solar:pie-chart-2-linear"
                  className="text-5xl mb-3 opacity-40"
                />
                <p className="text-sm text-zinc-500">No category data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECONDARY SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 3. TOP PRODUCTS */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-lg font-bold text-zinc-900 mb-1">
            Top Selling Products
          </h3>
          <p className="text-zinc-500 text-xs mb-6">
            Best performing items by units sold
          </p>
          <div className="h-[300px]">
            {charts.productsData.labels.length > 0 ? (
              <Bar data={charts.productsData} options={barOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Icon
                  icon="solar:box-minimalistic-linear"
                  className="text-5xl mb-3 opacity-40"
                />
                <p className="text-sm text-zinc-500">No product data</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. RECENT ORDERS TABLE */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-5 border-b border-zinc-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Recent Orders</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Latest transactions from your store
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-zinc-50 text-zinc-600 text-xs uppercase tracking-wider font-semibold border-b border-zinc-200">
                <tr>
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sortedRecentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="group hover:bg-zinc-50 transition-colors"
                  >
                    <td className="p-4 pl-6 text-zinc-800 font-mono text-xs font-semibold group-hover:text-indigo-600 transition-colors">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                          {(order.user?.name || order.guestInfo?.name || "G")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-900 font-semibold text-sm">
                            {order.user?.name ||
                              order.guestInfo?.name ||
                              "Guest"}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            {order.user?.email ||
                              order.guestInfo?.email ||
                              "No Email"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-zinc-900">
                      {formatAmount(order.pricing?.finalTotal)}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${
                          order.orderStatus === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.orderStatus === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            order.orderStatus === "delivered"
                              ? "bg-emerald-600"
                              : order.orderStatus === "cancelled"
                              ? "bg-rose-600"
                              : "bg-amber-600"
                          }`}
                        ></span>
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
