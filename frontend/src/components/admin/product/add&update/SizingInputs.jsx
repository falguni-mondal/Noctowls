import ErrorDisplay from './ErrorDisplay';

const SizingInputs = ({ sizes, updateSize, errors }) => {
  return (
    <>
      {sizes.map(size => (
        <section 
          key={size.value} 
          className="rounded-lg p-4 mt-10 bg-zinc-900" 
          id='add-prod-sizing-section'
        >
          <h2 className="section-heading font-medium mb-3 tracking-wide">
            Size: <span className='uppercase'>{size.value}</span>
          </h2>

          <ErrorDisplay errors={errors.size[size.value] || []} />

          {/* Original Price & Discount */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm">Original Price</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-zinc-400"
                placeholder='0'
                value={size.originalPrice || ''}
                onChange={e => updateSize(size.value, "originalPrice", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm">Discount %</label>
              <input
                type="number"
                onWheel={(e) => e.target.blur()}
                className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-zinc-400"
                placeholder='0'
                value={size.discount || ''}
                onChange={e => updateSize(size.value, "discount", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Stock */}
          <div className="mb-3">
            <label className="text-sm">Stock</label>
            <input
              type="number"
              onWheel={(e) => e.target.blur()}
              className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-zinc-400"
              placeholder='0'
              value={size.stock || ''}
              onChange={e => updateSize(size.value, "stock", Number(e.target.value))}
            />
          </div>

          {/* SKU Code */}
          <div className="mb-3">
            <label className="text-sm">SKU Code</label>
            <input
              type="text"
              className="w-full bg-zinc-800 p-2 rounded-[3px] border-0 outline-0 placeholder:text-zinc-400"
              placeholder='e.g., NOCT-DM-XXX-X'
              value={size.skuCode}
              onChange={e => updateSize(size.value, "skuCode", e.target.value)}
            />
          </div>
        </section>
      ))}
    </>
  );
};

export default SizingInputs;