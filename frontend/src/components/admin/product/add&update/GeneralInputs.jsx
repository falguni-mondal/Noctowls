import { Icon } from '@iconify/react/dist/iconify.js';
import { useRef, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';
import { PRODUCT_CATEGORIES, PRODUCT_GROUPS } from '../../../../constants/adminProductConstants';

const GeneralInputs = ({
  prodCategory,
  setProdCategory,
  prodGroup,
  setProdGroup,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  errors,
  reveal,
  setReveal,
  mode = 'add' // 'add' or 'update'
}) => {
  const categoryRef = useRef(null);
  const groupRef = useRef(null);

  const revealer = (key) => {
    setReveal(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, category: false }));
      }
      if (groupRef.current && !groupRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, group: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setReveal]);

  return (
    <section 
      className='flex flex-col gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 shadow-sm' 
      id={`${mode}-prod-general-inputs`}
    >
      <h2 className="section-heading font-bold text-lg text-zinc-800 mb-2 border-b border-zinc-200 pb-2">
        General Details
      </h2>

      <ErrorDisplay errors={errors.general} />

      {/* Product Name */}
      <div className={`${mode}-prod-name w-full flex flex-col`}>
        <label className='text-sm font-semibold text-zinc-700 mb-1.5' htmlFor={`${mode}-prod-name-input`}>
          Product Title (Min: 10)
        </label>
        {mode === 'add' ? (
          <input
            className='p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm'
            type="text"
            id='add-prod-name-input'
            name='name'
            placeholder='e.g., Noctowls Eclipse Deskmat'
          />
        ) : (
          <input
            className='p-3 border border-zinc-300 outline-none rounded-lg bg-white text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm'
            type="text"
            id='update-prod-name-input'
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        )}
      </div>

      {/* Product Description */}
      <div className={`${mode}-prod-description w-full flex flex-col`}>
        <label className='text-sm font-semibold text-zinc-700 mb-1.5' htmlFor={`${mode}-prod-desc-input`}>
          Product Description (Min: 20)
        </label>
        {mode === 'add' ? (
          <textarea
            className='resize-none bg-white rounded-lg p-3 border border-zinc-300 outline-none text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm'
            rows={5}
            name="description"
            id="add-prod-desc-input"
            placeholder='Write a detailed description of the product...'
          />
        ) : (
          <textarea
            className='resize-none bg-white rounded-lg p-3 border border-zinc-300 outline-none text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm'
            rows={5}
            id="update-prod-desc-input"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Category */}
        <div className={`${mode}-prod-type w-full flex flex-col relative`}>
          <label className='text-sm font-semibold text-zinc-700 mb-1.5 w-fit'>Product Category</label>
          <div
            ref={categoryRef}
            onClick={() => revealer("category")}
            className={`${mode}-prod-type-preview w-full flex justify-between items-center p-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 capitalize cursor-pointer hover:border-zinc-400 transition-colors shadow-sm`}
          >
            <p className="font-medium">{prodCategory}</p>
            <Icon icon="iconoir:nav-arrow-down" className="text-zinc-500" />
          </div>
          <ul 
            className={`${mode}-prod-category-list w-full rounded-lg bg-white border border-zinc-200 shadow-xl absolute z-50 top-full left-0 overflow-hidden transition-all duration-200 ${
              reveal.category ? "mt-1 opacity-100 visible" : "h-0 m-0 opacity-0 invisible border-none"
            }`}
          >
            {PRODUCT_CATEGORIES.map(category => (
              <li
                key={`${category}-category-key`}
                onClick={() => {
                  setProdCategory(category);
                  setReveal(prev => ({ ...prev, category: false }));
                }}
                className={`w-full py-2.5 px-4 capitalize cursor-pointer font-medium transition-colors ${
                  prodCategory === category 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-indigo-600'
                }`}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* Product Group */}
        <div className={`${mode}-prod-group w-full flex flex-col relative`}>
          <label className='text-sm font-semibold text-zinc-700 mb-1.5 w-fit'>Product Group</label>
          <div
            ref={groupRef}
            onClick={() => revealer("group")}
            className={`${mode}-prod-group-preview w-full flex justify-between items-center p-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 capitalize cursor-pointer hover:border-zinc-400 transition-colors shadow-sm`}
          >
            <p className="font-medium">{prodGroup}</p>
            <Icon icon="iconoir:nav-arrow-down" className="text-zinc-500" />
          </div>
          <ul 
            className={`${mode}-prod-group-list w-full rounded-lg bg-white border border-zinc-200 shadow-xl absolute z-50 top-full left-0 overflow-hidden transition-all duration-200 ${
              reveal.group ? "mt-1 opacity-100 visible" : "h-0 m-0 opacity-0 invisible border-none"
            }`}
          >
            {PRODUCT_GROUPS.map(group => (
              <li
                key={`${group}-group-key`}
                onClick={() => {
                  setProdGroup(group);
                  setReveal(prev => ({ ...prev, group: false }));
                }}
                className={`w-full py-2.5 px-4 capitalize cursor-pointer font-medium transition-colors ${
                  prodGroup === group 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-indigo-600'
                }`}
              >
                {group}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </section>
  );
};

export default GeneralInputs;