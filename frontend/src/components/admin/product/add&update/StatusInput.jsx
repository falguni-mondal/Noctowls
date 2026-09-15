import { Icon } from '@iconify/react/dist/iconify.js';
import { useRef, useEffect } from 'react';

// Adjusted colors for better contrast on light theme
const STATUS_OPTIONS = [
  { value: "published", label: "Published", color: "text-emerald-600" },
  { value: "archived", label: "Archived", color: "text-rose-600" }
];

const StatusInput = ({ prodStatus, setProdStatus, reveal, setReveal }) => {
  const statusRef = useRef(null);

  const revealer = (key) => {
    setReveal(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setReveal(prev => ({ ...prev, status: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setReveal]);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === prodStatus) || STATUS_OPTIONS[0];

  return (
    <div className="update-prod-status w-full flex flex-col relative mt-2">
      <label className='text-sm font-semibold text-zinc-700 mb-1.5 w-fit'>Product Status</label>
      <div
        ref={statusRef}
        onClick={() => revealer("status")}
        className="update-prod-status-preview w-full flex justify-between items-center p-3 rounded-lg border border-zinc-300 bg-white cursor-pointer hover:border-zinc-400 transition-colors shadow-sm"
      >
        <p className={`capitalize font-medium ${currentStatus.color}`}>{currentStatus.label}</p>
        <Icon icon="iconoir:nav-arrow-down" className="text-zinc-500" />
      </div>
      <ul 
        className={`update-prod-status-list w-full rounded-lg bg-white border border-zinc-200 shadow-xl absolute z-50 top-full left-0 overflow-hidden transition-all duration-200 ${
          reveal.status ? "mt-1 opacity-100 visible" : "h-0 m-0 opacity-0 invisible border-none"
        }`}
      >
        {STATUS_OPTIONS.map(status => (
          <li
            key={`${status.value}-status-key`}
            onClick={() => {
                setProdStatus(status.value);
                setReveal(prev => ({ ...prev, status: false }));
            }}
            className={`w-full py-2.5 px-4 cursor-pointer hover:bg-zinc-50 transition-colors capitalize font-medium ${status.color} ${prodStatus === status.value ? 'bg-zinc-50' : ''}`}
          >
            {status.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatusInput;