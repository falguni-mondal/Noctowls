import { Icon } from "@iconify/react/dist/iconify.js";
import { useMemo, useRef, useState } from "react";
import ErrorDisplay from "./ErrorDisplay";
import { optimizeImage } from "../../../../utils/helpers/imageOptimizer";

const UpdateHighlightImages = ({
  highlightImages,
  highlightImagesChanged,
  highlightImageCount,
  handleHighlightImageSelect,
  reorderHighlightImages,
  removeHighlightImage,
  highlightImageInputRefs,
  errors,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const bulkInputRef = useRef(null);

  const highlightImageArray = useMemo(
    () => Array.from({ length: highlightImageCount }, (_, i) => i + 1),
    [highlightImageCount]
  );

  const handleDragStart = (e, index) => {
    if (!highlightImages[index]) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleHighlightImageSelect(targetIndex, {
        target: { files: e.dataTransfer.files },
      });
      setDraggedIndex(null);
      return;
    }

    const fromIndex =
      draggedIndex !== null
        ? draggedIndex
        : parseInt(e.dataTransfer.getData("text/plain"), 10);

    if (
      !isNaN(fromIndex) &&
      fromIndex !== targetIndex &&
      typeof reorderHighlightImages === "function"
    ) {
      reorderHighlightImages(fromIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section className="flex flex-col gap-4 p-5 md:p-6 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3 mb-1">
        <div>
          <h2 className="section-heading font-bold text-lg text-zinc-800">
            Highlight Images ({highlightImages.filter(Boolean).length}/
            {highlightImageCount})
          </h2>
          <p className="text-xs font-medium text-zinc-500 mt-0.5">
            Select multiple images at once, click a slot to replace, or drag cards to reorder
          </p>
        </div>

        <div>
          <input
            type="file"
            accept=".png,.webp,.jpeg,.jpg"
            multiple
            ref={bulkInputRef}
            onChange={(e) => handleHighlightImageSelect(null, e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => bulkInputRef.current?.click()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon icon="solar:gallery-add-bold" className="text-base" />
            Select Multiple
          </button>
        </div>
      </div>

      <ErrorDisplay errors={errors.highlightImg} />

      <div className="prod-highlight-images-container grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-2">
        {highlightImageArray.map((num, index) => {
          const image = highlightImages[index];
          const displayUrl =
            image?.type === "new"
              ? image.preview
              : optimizeImage(image?.url, { width: 240, quality: 75 });
          const isChanged = highlightImagesChanged[index];
          const isBeingDragged = draggedIndex === index;
          const isDragTarget =
            dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={`update-prod-highlight-img-${num}`}
              draggable={Boolean(displayUrl)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() =>
                dragOverIndex === index && setDragOverIndex(null)
              }
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg transition-all ${
                isBeingDragged ? "opacity-40 scale-95" : ""
              } ${
                isDragTarget
                  ? "ring-2 ring-indigo-600 ring-offset-2 scale-[1.03]"
                  : ""
              }`}
            >
              <input
                type="file"
                accept=".png,.webp,.jpeg,.jpg"
                multiple
                onChange={(e) => handleHighlightImageSelect(index, e)}
                className="hidden"
                ref={(el) => (highlightImageInputRefs.current[index] = el)}
                id={`highlight-image-${index}`}
              />
              <label
                htmlFor={`highlight-image-${index}`}
                className={`w-full aspect-square rounded-lg flex justify-center items-center text-4xl cursor-pointer overflow-hidden relative border-2 transition-all shadow-sm ${
                  displayUrl
                    ? isChanged
                      ? "border-amber-400 bg-white cursor-grab active:cursor-grabbing"
                      : "border-emerald-500 bg-white cursor-grab active:cursor-grabbing"
                    : "border-dashed border-zinc-300 bg-white text-zinc-400 hover:bg-zinc-100 hover:border-indigo-400 hover:text-indigo-500"
                }`}
              >
                {displayUrl ? (
                  <>
                    <img
                      src={displayUrl}
                      alt={`Highlight ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none pointer-events-none"
                    />

                    {/* Position & Changed Badge */}
                    <div
                      className={`absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 pointer-events-none ${
                        isChanged ? "bg-amber-500" : "bg-black/70"
                      }`}
                    >
                      <Icon icon="mdi:drag" className="text-xs" />#{index + 1}
                    </div>

                    {/* Touch / Click Left-Right Reorder Controls */}
                    {typeof reorderHighlightImages === "function" && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (index > 0)
                              reorderHighlightImages(index, index - 1);
                          }}
                          className="bg-black/70 hover:bg-black text-white rounded p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Left"
                        >
                          <Icon
                            icon="mdi:chevron-left"
                            className="text-xs pointer-events-none"
                          />
                        </button>
                        <button
                          type="button"
                          disabled={index === highlightImageCount - 1}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (index < highlightImageCount - 1)
                              reorderHighlightImages(index, index + 1);
                          }}
                          className="bg-black/70 hover:bg-black text-white rounded p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Right"
                        >
                          <Icon
                            icon="mdi:chevron-right"
                            className="text-xs pointer-events-none"
                          />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeHighlightImage(index);
                      }}
                      className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md backdrop-blur-sm z-20"
                      aria-label={`Remove highlight image ${index + 1}`}
                    >
                      <Icon
                        icon="mdi:close"
                        className="text-base md:text-lg pointer-events-none"
                      />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Icon
                      className="pointer-events-none"
                      icon="solar:camera-add-bold-duotone"
                    />
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