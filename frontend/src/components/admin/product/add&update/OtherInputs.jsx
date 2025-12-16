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
      className="p-4 bg-zinc-900 rounded-lg mt-10" 
      id={`${mode}-prod-other-section`}
    >
      <h2 className="section-heading font-medium mb-3 tracking-wide">
        Other Details
      </h2>

      <ErrorDisplay errors={errors.others} />

      <div className={`${mode}-prod-inventory w-full flex flex-col relative`}>
        <label className='text-sm mb-0.5 w-fit'>Select Inventory</label>
        <div
          ref={inventoryRef}
          onClick={() => revealer("inventory")}
          className={`${mode}-prod-inventory-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 capitalize cursor-pointer`}
        >
          <p className='w-[90%] truncate'>{prodInventory}</p>
          <Icon icon="iconoir:nav-arrow-down" />
        </div>
        <ul 
          className={`${mode}-prod-inventory-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${
            reveal.inventory ? "mt-1" : "h-0 m-0"
          }`}
        >
          {PRODUCT_INVENTORY.map(inventory => (
            <li
              key={`${inventory}-inventory-key`}
              onClick={() => setProdInventory(inventory)}
              className='w-full py-1.5 px-3 cursor-pointer hover:bg-zinc-700'
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