import ErrorDisplay from './ErrorDisplay';

const SizingInputs = ({ sizes, updateSize, errors }) => {
  return (
    <>
      {sizes.map(size => (
        <section 
          key={size.value} 
          className="flex flex-col gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 shadow-sm" 
          id='add-prod-sizing-section'
        >
          <h2 className="section-heading font-bold text-lg text-zinc-800 mb-2 border-b border-zinc-200 pb-2">
            Size: <span className='uppercase text-indigo-600 ml-1'>{size.value}</span>
          </h2>

          <ErrorDisplay errors={errors.size[size.value] || []} />

          {/* Original Price & Discounted Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5">Original Price (₹)</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm placeholder:text-zinc-400"
                placeholder='0'
                value={size.originalPrice || ''}
                onChange={e => updateSize(size.value, "originalPrice", Number(e.target.value))}
              />
            </div>

            {/* Now taking discounted price instead of discount percentage */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5">Discounted Price (₹)</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm placeholder:text-zinc-400"
                placeholder='0'
                value={size.numPrice || ''}
                onChange={e => updateSize(size.value, "numPrice", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Show calculated discount */}
          {size.originalPrice > 0 && size.numPrice > 0 && size.numPrice < size.originalPrice && (
            <div className="mb-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100 inline-block w-fit">
              Discount Applied: {Math.round(((size.originalPrice - size.numPrice) / size.originalPrice) * 100)}%
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5">Stock Quantity</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm placeholder:text-zinc-400"
                placeholder='0'
                value={size.stock || ''}
                onChange={e => updateSize(size.value, "stock", Number(e.target.value))}
              />
            </div>

            {/* SKU Code */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5">SKU Code</label>
              <input
                type="text"
                className="p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm placeholder:text-zinc-400"
                placeholder='e.g., NOCT-DM-XXX-X'
                value={size.skuCode}
                onChange={e => updateSize(size.value, "skuCode", e.target.value)}
              />
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default SizingInputs;