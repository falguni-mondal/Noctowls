import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const PolicyLayout = ({ title, lastUpdated, children }) => {
  return (
    // Light theme main background and base text color
    <div className="min-h-screen bg-[#f4f4f4] text-zinc-600 font-sans pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">
          <Link to="/" className="hover:text-[#0f0f0f] transition-colors">Home</Link>
          <Icon icon="solar:alt-arrow-right-linear" />
          <span className="text-red-600">Policies</span>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-200 pb-8 mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-[#0f0f0f] uppercase tracking-tight mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-zinc-500 text-sm font-medium">Last updated: {lastUpdated}</p>
          )}
        </div>

        {/* Content - Removed 'prose-invert' and updated text targeting for Light Theme */}
        <div className="prose prose-zinc max-w-none prose-headings:text-[#0f0f0f] prose-a:text-red-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-strong:text-[#0f0f0f]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PolicyLayout;