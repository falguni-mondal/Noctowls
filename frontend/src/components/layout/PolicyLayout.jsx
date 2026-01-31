import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const PolicyLayout = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Icon icon="solar:alt-arrow-right-linear" />
          <span className="text-red-600">Policies</span>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-800 pb-8 mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-zinc-500 text-sm">Last updated: {lastUpdated}</p>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline prose-strong:text-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PolicyLayout;