import { Icon } from '@iconify/react/dist/iconify.js';
import { useMemo } from 'react';
import ErrorDisplay from './ErrorDisplay';

const UpdateMainImages = ({
  mainImages,
  mainImagesChanged,
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
    <section className="main-image-update-section p-4 mt-10 bg-zinc-900 rounded-lg">
      <h2 className="section-heading font-medium mb-3 tracking-wide">
        Product Images
      </h2>
      <p className="text-xs text-zinc-400 mb-3">
        Click on an image to replace it, or keep existing ones
      </p>

      <ErrorDisplay errors={errors.images} />

      <div className="prod-images-container grid grid-cols-4 gap-2 mt-4">
        {mainImageArray.map((num, index) => {
          const image = mainImages[index];
          const displayUrl = image?.type === 'new' ? image.preview : image?.url;
          const isChanged = mainImagesChanged[index];

          return (
            <div key={`update-prod-img-${num}`} className="relative">
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
                className={`w-full aspect-square rounded flex justify-center items-center text-[8vw] text-zinc-400 bg-zinc-800 cursor-pointer overflow-hidden relative border-2 transition-colors ${
                  displayUrl 
                    ? (isChanged ? 'border-yellow-500' : 'border-green-500')
                    : 'border-zinc-700'
                }`}
              >
                {displayUrl ? (
                  <>
                    <img
                      src={displayUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isChanged && (
                      <div className="absolute top-1 left-1 bg-yellow-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Changed
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeMainImage(index);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Icon icon="mdi:close" className="text-lg" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Icon icon="material-symbols-light:add-photo-alternate-outline-rounded" />
                    <span className="text-xs mt-1">{index + 1}</span>
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

export default UpdateMainImages;