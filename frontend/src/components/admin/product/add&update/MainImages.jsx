import { Icon } from '@iconify/react/dist/iconify.js';
import { useMemo } from 'react';
import ErrorDisplay from './ErrorDisplay';

const MainImages = ({
  mainImages,
  mainImageCount,
  handleMainImageSelect,
  removeMainImage,
  mainImageInputRefs,
  errors
}) => {
  const mainImageArray = useMemo(
    () => Array.from({ length: mainImageCount }, (_, i) => i + 1),
    [mainImageCount]
  );

  return (
    <section 
      className="p-4 mt-10 bg-zinc-900 rounded-lg" 
      id='main-image-add-section'
    >
      <h2 className="section-heading font-medium mb-3 tracking-wide">
        Product Images
      </h2>

      <ErrorDisplay errors={errors.images} />

      <div className="prod-images-container grid grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
        {mainImageArray.map((num, index) => (
          <div key={`add-prod-img-${num}`} className="relative">
            <input
              type="file"
              accept=".png,.webp,.jpeg,.jpg"
              onChange={(e) => handleMainImageSelect(index, e)}
              className="hidden"
              ref={el => mainImageInputRefs.current[index] = el}
              id={`main-image-${index}`}
            />
            <label
              htmlFor={`main-image-${index}`}
              className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 ${
                mainImages[index]?.preview ? 'border-green-500' : 'border-zinc-700'
              }`}
            >
              {mainImages[index]?.preview ? (
                <>
                  <img
                    src={mainImages[index].preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeMainImage(index);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <Icon icon="mdi:close" className="text-lg pointer-events-none" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <Icon className='pointer-events-none' icon="material-symbols-light:add-photo-alternate-outline-rounded" />
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

export default MainImages;