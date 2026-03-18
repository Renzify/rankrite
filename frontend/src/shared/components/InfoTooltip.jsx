import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_TOOLTIP_WIDTH = 320;
const VIEWPORT_PADDING = 12;
const MOBILE_QUERY = "(max-width: 767px)";
const DEFAULT_LABEL = "More information";

const TONE_STYLES = {
  warning: {
    trigger:
      "border-warning text-warning hover:bg-warning hover:text-warning-content focus-visible:ring-warning/40",
    panel: "border-warning/40 bg-base-100 text-base-content",
  },
  error: {
    trigger:
      "border-error text-error hover:bg-error hover:text-error-content focus-visible:ring-error/40",
    panel: "border-error/40 bg-base-100 text-base-content",
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDesktopPosition(anchorRect) {
  const maxWidth = Math.min(
    MAX_TOOLTIP_WIDTH,
    window.innerWidth - VIEWPORT_PADDING * 2,
  );
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - maxWidth / 2;
  const left = clamp(
    centeredLeft,
    VIEWPORT_PADDING,
    window.innerWidth - maxWidth - VIEWPORT_PADDING,
  );
  const estimatedTooltipHeight = 120;
  const hasSpaceBelow =
    anchorRect.bottom + 10 + estimatedTooltipHeight <=
    window.innerHeight - VIEWPORT_PADDING;
  const placement = hasSpaceBelow ? "below" : "above";
  const top = hasSpaceBelow ? anchorRect.bottom + 10 : anchorRect.top - 10;

  return { left, maxWidth, placement, top };
}

function InfoTooltip({
  content,
  label = DEFAULT_LABEL,
  tone = "warning",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopPosition, setDesktopPosition] = useState(() => ({
    left: VIEWPORT_PADDING,
    maxWidth: MAX_TOOLTIP_WIDTH,
    placement: "below",
    top: 0,
  }));

  const triggerWrapRef = useRef(null);
  const panelRef = useRef(null);

  const toneClasses = TONE_STYLES[tone] ?? TONE_STYLES.warning;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const syncViewport = () => setIsMobile(mediaQuery.matches);

    syncViewport();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);

      return () => {
        mediaQuery.removeEventListener("change", syncViewport);
      };
    }

    mediaQuery.addListener(syncViewport);

    return () => {
      mediaQuery.removeListener(syncViewport);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || isMobile || !triggerWrapRef.current) {
      return undefined;
    }

    const syncPosition = () => {
      if (!triggerWrapRef.current) return;

      const nextPosition = getDesktopPosition(
        triggerWrapRef.current.getBoundingClientRect(),
      );
      setDesktopPosition(nextPosition);
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        triggerWrapRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const panel =
    typeof document === "undefined" || !isOpen
      ? null
      : createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            className={`z-[1300] rounded-xl border p-3 text-xs leading-relaxed shadow-[0_24px_50px_-30px_rgba(15,23,42,0.85)] ${toneClasses.panel} ${
              isMobile ? "fixed inset-x-4 bottom-4 max-h-[42vh] overflow-y-auto rounded-2xl p-4" : "fixed"
            }`}
            style={
              isMobile
                ? undefined
                : {
                    left: `${desktopPosition.left}px`,
                    maxWidth: `${desktopPosition.maxWidth}px`,
                    top: `${desktopPosition.top}px`,
                    transform:
                      desktopPosition.placement === "above"
                        ? "translateY(-100%)"
                        : undefined,
                  }
            }
          >
            {isMobile ? (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : null}
            <p>{content}</p>
          </div>,
          document.body,
        );

  return (
    <span
      ref={triggerWrapRef}
      className={`relative inline-flex ${className}`.trim()}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        className={`flex h-[25px] w-[25px] cursor-help items-center justify-center rounded-full border-2 bg-transparent text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${toneClasses.trigger}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        ?
      </button>
      {panel}
    </span>
  );
}

export default InfoTooltip;
