import { Icon } from '@iconify/react/dist/iconify.js';
import { useMemo } from 'react';
import ErrorDisplay from './ErrorDisplay';

const UpdateHighlightImages = ({
  highlightImages,
  highlightImagesChanged,
  highlightImageCount,
  handleHighlightImageSelect,
  removeHighlightImage,
  highlightImageInputRefs,
  errors
}) => {
  const highlightImageArray = useMemo(
    () => Array.from({ length: highlightImageCount }, (_, i) => i + 1),
    [highlightImageCount]
  );

  return (
    <section className="flex flex-col gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 shadow-sm">
      <div className="border-b border-zinc-200 pb-2 mb-2">
        <h2 className="section-heading font-bold text-lg text-zinc-800">
          Highlight Images
        </h2>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Click on an image to replace it, or keep existing ones
        </p>
      </div>

      <ErrorDisplay errors={errors.highlightImg} />

      <div className="prod-highlight-images-container grid grid-cols-4 lg:grid-cols-6 gap-3 mt-2">
        {highlightImageArray.map((num, index) => {
          const image = highlightImages[index];
          const displayUrl = image?.type === 'new' ? image.preview : image?.url;
          const isChanged = highlightImagesChanged[index];

          return (
            <div key={`update-prod-highlight-img-${num}`} className="relative group">
              <input
                type="file"
                accept=".png,.webp,.jpeg,.jpg"
                onChange={(e) => handleHighlightImageSelect(index, e)}
                className="hidden"
                ref={el => highlightImageInputRefs.current[index] = el}
                id={`highlight-image-${index}`}
              />
              <label
                htmlFor={`highlight-image-${index}`}
                className={`w-full aspect-square rounded-lg flex justify-center items-center text-4xl cursor-pointer overflow-hidden relative border-2 transition-all shadow-sm ${
                  displayUrl 
                    ? (isChanged ? 'border-amber-400 bg-white' : 'border-emerald-500 bg-white')
                    : 'border-dashed border-zinc-300 bg-white text-zinc-400 hover:bg-zinc-100 hover:border-indigo-400 hover:text-indigo-500'
                }`}
              >
                {displayUrl ? (
                  <>
                    <img
                      src={displayUrl}
                      alt={`Highlight ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Changed Badge */}
                    {isChanged && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Changed
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeHighlightImage(index);
                      }}
                      className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md backdrop-blur-sm"
                      aria-label={`Remove highlight image ${index + 1}`}
                    >
                      <Icon icon="mdi:close" className="text-base md:text-lg pointer-events-none" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Icon className='pointer-events-none' icon="solar:camera-add-bold-duotone" />
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-indigo-500 transition-colors pointer-events-none">
                      Img {index + 1}
                    </span>
                  </div>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default UpdateHighlightImages;