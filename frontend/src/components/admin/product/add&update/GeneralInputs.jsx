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
      className='flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg' 
      id={`${mode}-prod-general-inputs`}
    >
      <h2 className="section-heading font-medium mb-3 tracking-wide">
        General Details
      </h2>

      <ErrorDisplay errors={errors.general} />

      {/* Product Name */}
      <div className={`${mode}-prod-name w-full flex flex-col`}>
        <label className='text-sm mb-0.5' htmlFor={`${mode}-prod-name-input`}>
          Product Title (Min: 10)
        </label>
        {mode === 'add' ? (
          <input
            className='p-2 border-0 outline-0 rounded-[3px] bg-zinc-800'
            type="text"
            id='add-prod-name-input'
            name='name'
          />
        ) : (
          <input
            className='p-2 border-0 outline-0 rounded-[3px] bg-zinc-800'
            type="text"
            id='update-prod-name-input'
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        )}
      </div>

      {/* Product Description */}
      <div className={`${mode}-prod-description w-full flex flex-col`}>
        <label className='text-sm mb-0.5' htmlFor={`${mode}-prod-desc-input`}>
          Product Description (Min: 20)
        </label>
        {mode === 'add' ? (
          <textarea
            className='resize-none bg-zinc-800 rounded-[3px] p-2 border-0 outline-0'
            rows={5}
            name="description"
            id="add-prod-desc-input"
          />
        ) : (
          <textarea
            className='resize-none bg-zinc-800 rounded-[3px] p-2 border-0 outline-0'
            rows={5}
            id="update-prod-desc-input"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
        )}
      </div>

      {/* Product Category */}
      <div className={`${mode}-prod-type w-full flex flex-col relative`}>
        <label className='text-sm mb-0.5 w-fit'>Product Category</label>
        <div
          ref={categoryRef}
          onClick={() => revealer("category")}
          className={`${mode}-prod-type-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer`}
        >
          <p>{prodCategory}</p>
          <Icon icon="iconoir:nav-arrow-down" />
        </div>
        <ul 
          className={`${mode}-prod-category-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${
            reveal.category ? "mt-1" : "h-0 m-0"
          }`}
        >
          {PRODUCT_CATEGORIES.map(category => (
            <li
              key={`${category}-category-key`}
              onClick={() => {
                setProdCategory(category);
                setReveal(prev => ({ ...prev, category: false }));
              }}
              className='w-full py-2 px-3 capitalize hover:bg-indigo-300 hover:text-black cursor-pointer'
            >
              {category}
            </li>
          ))}
        </ul>
      </div>

      {/* Product Group */}
      <div className={`${mode}-prod-group w-full flex flex-col relative`}>
        <label className='text-sm mb-0.5 w-fit'>Product Group</label>
        <div
          ref={groupRef}
          onClick={() => revealer("group")}
          className={`${mode}-prod-group-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer`}
        >
          <p>{prodGroup}</p>
          <Icon icon="iconoir:nav-arrow-down" />
        </div>
        <ul 
          className={`${mode}-prod-group-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${
            reveal.group ? "mt-1" : "h-0 m-0"
          }`}
        >
          {PRODUCT_GROUPS.map(group => (
            <li
              key={`${group}-group-key`}
              onClick={() => {
                setProdGroup(group);
                setReveal(prev => ({ ...prev, group: false }));
              }}
              className='w-full py-2 px-3 capitalize hover:bg-indigo-300 hover:text-black cursor-pointer'
            >
              {group}
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
};

export default GeneralInputs;