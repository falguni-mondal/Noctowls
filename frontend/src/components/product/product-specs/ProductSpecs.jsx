import React, { useRef, useState, useEffect } from "react";

const data = [
  {
    title: "Highlights",
    content: [
      "Dual-Sided Durability",
      "Durable Stitched Perfection",
      "Splash Proof Easy To Clean",
      "3MM Premium Thickness",
      "Effortless Glide",
      "Precision In Every Size",
    ],
  },

  {
    title: "Description",
    content: [
      { type: "para", text: "Designed for Gamers, Creators & Everyday PC Users" },

      {
        type: "highlight",
        text: "NOCTOWLS Deskmats bring premium comfort, precise control, and clean aesthetics — crafted to enhance your setup and your performance.",
      },

      { type: "heading", text: "AVAILABLE SIZES" },

      { type: "subheading", text: "DESKMAT" },

      {
        type: "bullets",
        items: [
          "L — 11 × 23\" (28 × 58 cm)",
          "XL — 12 × 31\" (30 × 80 cm)",
          "XXL — 18 × 36\" (42 × 90 cm)",
        ],
      },

      { type: "note", text: "Note: Sizes may slightly vary (±1–2 cm)" },

      { type: "heading", text: "BEST FOR" },

      {
        type: "bullets",
        items: [
          "Gaming Setups",
          "Office or Study Desks",
          "Anime & Aesthetic Fans",
          "Laptop or PC Users",
        ],
      },

      {
        type: "para",
        text:
          "Where passion collides with chaos and power flirts with danger. This design captures the raw tension between control and surrender — the crimson glow, torn fabric, and metallic edge come alive in a moment that feels electric.",
      },

      {
        type: "para",
        text:
          "Every inch of this deskmat radiates intensity, symbolizing the fearless spirit of those who create beyond limits. It’s not just art — it's rebellion inked in steel and blood.",
      },

      {
        type: "para",
        text: "Turn your desk into a battlefield of focus and fire.",
      },
    ],
  },

  {
    title: "Package Contents",
    content: [
      "1 × DeskMat",
      "1 × Thank You card",
      "1 × Anime keychain",
      "5 × Stickers",
    ],
  },
];

const ProductSpecs = () => {
  const [openIndexes, setOpenIndexes] = useState([]);
  const contentRefs = useRef([]);

  useEffect(() => {
    contentRefs.current = contentRefs.current.slice(0, data.length);
  }, []);

  const toggle = (idx) => {
    if (data[idx].title === "Package Contents") return;

    const isOpen = openIndexes.includes(idx);
    let next;

    if (isOpen) {
      next = openIndexes.filter((i) => i !== idx);
      const el = contentRefs.current[idx];
      if (el) {
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.offsetHeight;
        el.style.maxHeight = "0px";
      }
    } else {
      next = [...openIndexes, idx];
      const el = contentRefs.current[idx];
      if (el) el.style.maxHeight = `${el.scrollHeight}px`;
    }

    setOpenIndexes(next);
  };

  const onTransitionEnd = (idx) => () => {
    const el = contentRefs.current[idx];
    if (!el) return;

    const isOpen = openIndexes.includes(idx);
    el.style.maxHeight = isOpen ? "none" : "0px";
  };

  // Render description blocks EXACTLY like your screenshots
  const renderDescription = (block, i) => {
    switch (block.type) {
      case "para":
        return (
          <p key={i} className="text-sm leading-6">
            {block.text}
          </p>
        );

      case "highlight":
        return (
          <p key={i} className="text-sm leading-6">
            <span className="text-red-600 font-semibold">NOCTOWLS</span>{" "}
            Deskmats bring premium comfort, precise control, and clean aesthetics — crafted to enhance your setup and your performance.
          </p>
        );

      case "heading":
        return (
          <h3
            key={i}
            className="mt-4 text-xs font-bold text-red-600 tracking-wide"
          >
            {block.text}
          </h3>
        );

      case "subheading":
        return (
          <div key={i} className="mt-1 mb-1 text-sm font-semibold text-white">
            {block.text}
          </div>
        );

      case "bullets":
        return (
          <ul key={i} className="mt-1 mb-2 pl-4 space-y-1">
            {block.items.map((item, idx) => (
              <li key={idx} className="text-sm leading-6">
                • {item}
              </li>
            ))}
          </ul>
        );

      case "note":
        return (
          <p key={i} className="text-sm text-red-600 font-semibold">
            {block.text}
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <section className="product-specs max-w-xl mx-auto px-3 mt-10 pb-10 border-b border-zinc-700">
      <h2 className="text-white text-xl font-semibold mb-4 uppercase">
        Features & Specifications
      </h2>

      <div className="space-y-4">

        {data.map((item, idx) => {
          const isPackage = item.title === "Package Contents";
          const isOpen = openIndexes.includes(idx);

          return (
            <div key={idx} className="bg-zinc-900 rounded-lg shadow-md">

              {/* Header */}
              {isPackage ? (
                <div className="px-4 py-3">
                  <span className="text-sm font-semibold text-white">
                    {item.title}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-white font-semibold">
                    {item.title}
                  </span>

                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${
                      isOpen
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white border-zinc-700"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`transition-transform ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      <path
                        d="M12 5v14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </button>
              )}

              {/* Content */}
              <div
                ref={(el) => (contentRefs.current[idx] = el)}
                style={{
                  maxHeight: isPackage ? "none" : "0px",
                  transition: isPackage
                    ? "none"
                    : "max-height 300ms ease, opacity 200ms ease",
                }}
                onTransitionEnd={onTransitionEnd(idx)}
                className="px-4 overflow-hidden text-white"
              >
                <div className="py-3 space-y-3">

                  {/* Description → custom rich renderer */}
                  {item.title === "Description"
                    ? item.content.map(renderDescription)
                    : (

                      /* Normal list for Highlights */
                      isPackage ? (
                        <ul className="space-y-2">
                          {item.content.map((c, i) => (
                            <li key={i} className="text-sm leading-5">
                              • {c}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="space-y-2">
                          {item.content.map((c, i) => (
                            <li key={i} className="text-sm leading-5">
                              • {c}
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                </div>
              </div>

            </div>
          );
        })}

      </div>
    </section>
  );
};

export default ProductSpecs;
