import { Icon } from '@iconify/react/dist/iconify.js';
import { useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: "published", label: "Published", color: "text-green-400" },
  { value: "archived", label: "Archived", color: "text-red-400" }
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
    <div className="update-prod-status w-full flex flex-col relative mt-4">
      <label className='text-sm mb-0.5 w-fit'>Product Status</label>
      <div
        ref={statusRef}
        onClick={() => revealer("status")}
        className="update-prod-status-preview w-full flex justify-between items-center p-2 rounded-[3px] bg-zinc-800 cursor-pointer"
      >
        <p className={`capitalize ${currentStatus.color}`}>{currentStatus.label}</p>
        <Icon icon="iconoir:nav-arrow-down" />
      </div>
      <ul 
        className={`update-prod-status-list w-full rounded-[3px] bg-zinc-950 absolute z-50 top-full left-0 overflow-hidden ${
          reveal.status ? "mt-1" : "h-0 m-0"
        }`}
      >
        {STATUS_OPTIONS.map(status => (
          <li
            key={`${status.value}-status-key`}
            onClick={() => setProdStatus(status.value)}
            className={`w-full py-1.5 px-3 cursor-pointer hover:bg-zinc-700 capitalize ${status.color}`}
          >
            {status.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatusInput;