const Loader = () => {
  return (
    <div className='fixed z-[998] inset-0 bg-[#f4f4f4] flex justify-center items-center'>
        <div className="relative flex justify-center items-center w-12 h-12">
            {/* Soft gray background track */}
            <div className="absolute w-full h-full border-[3px] border-zinc-200 rounded-full"></div>
            
            {/* Signature red spinning ring */}
            <div className="absolute w-full h-full border-[3px] border-transparent border-t-red-600 rounded-full animate-spin"></div>
        </div>
    </div>
  )
}

export default Loader;