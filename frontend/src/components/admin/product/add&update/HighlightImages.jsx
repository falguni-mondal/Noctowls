import { Icon } from '@iconify/react/dist/iconify.js';
import { useMemo } from 'react';
import ErrorDisplay from './ErrorDisplay';

const HighlightImages = ({
  highlightImages,
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
    <section 
      className="p-4 bg-zinc-900 rounded-lg mt-10" 
      id='highlight-image-add-section'
    >
      <h2 className="section-heading font-medium mb-3 tracking-wide">
        Highlight Images
      </h2>

      <ErrorDisplay errors={errors.highlightImg} />

      <div className="prod-highlight-images-container grid grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
        {highlightImageArray.map((num, index) => (
          <div key={`add-prod-highlight-img-${num}`} className="relative">
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
              className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${
                highlightImages[index]?.preview ? 'border-green-500' : 'border-zinc-700'
              }`}
            >
              {highlightImages[index]?.preview ? (
                <>
                  <img
                    src={highlightImages[index].preview}
                    alt={`Highlight Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeHighlightImage(index);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    aria-label={`Remove highlight image ${index + 1}`}
                  >
                    <Icon icon="mdi:close" className="text-lg" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <Icon icon="material-symbols-light:add-photo-alternate-outline-rounded" />
                  <span className="text-xs lg:text-base mt-1">{index + 1}</span>
                </div>
              )}
            </label>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HighlightImages;