import { Icon } from '@iconify/react/dist/iconify.js';
import { useRef, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';
import { PRODUCT_INVENTORY } from '../../../../constants/adminProductConstants';

const OtherInputs = ({
  prodInventory,
  setProdInventory,
  errors,
  reveal,
  setReveal,
  mode = 'add',
  children // For additional fields like status
}) => {
  const inventoryRef = useRef(null);

  const revealer = (key) => {
    setReveal(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, inventory: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setReveal]);

  return (
    <section 
      className="flex flex-col gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 shadow-sm" 
      id={`${mode}-prod-other-section`}
    >
      <h2 className="section-heading font-bold text-lg text-zinc-800 mb-2 border-b border-zinc-200 pb-2">
        Other Details
      </h2>

      <ErrorDisplay errors={errors.others} />

      <div className={`${mode}-prod-inventory w-full flex flex-col relative`}>
        <label className='text-sm font-semibold text-zinc-700 mb-1.5 w-fit'>Select Inventory</label>
        <div
          ref={inventoryRef}
          onClick={() => revealer("inventory")}
          className={`${mode}-prod-inventory-preview w-full flex justify-between items-center p-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 capitalize cursor-pointer hover:border-zinc-400 transition-colors shadow-sm`}
        >
          <p className='w-[90%] truncate font-medium'>{prodInventory}</p>
          <Icon icon="iconoir:nav-arrow-down" className="text-zinc-500" />
        </div>
        <ul 
          className={`${mode}-prod-inventory-list w-full rounded-lg bg-white border border-zinc-200 shadow-xl absolute z-50 top-full left-0 overflow-hidden transition-all duration-200 ${
            reveal.inventory ? "mt-1 opacity-100 visible" : "h-0 m-0 opacity-0 invisible border-none"
          }`}
        >
          {PRODUCT_INVENTORY.map(inventory => (
            <li
              key={`${inventory}-inventory-key`}
              onClick={() => {
                setProdInventory(inventory);
                setReveal(prev => ({ ...prev, inventory: false }));
              }}
              className={`w-full py-2.5 px-4 cursor-pointer font-medium transition-colors ${
                prodInventory === inventory 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-indigo-600'
              }`}
            >
              {inventory}
            </li>
          ))}
        </ul>
      </div>

      {/* Render additional children (like StatusInput for update mode) */}
      {children}
    </section>
  );
};

export default OtherInputs;