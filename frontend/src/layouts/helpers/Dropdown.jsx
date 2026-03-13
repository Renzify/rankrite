import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export const DropdownMenu = forwardRef(function DropdownMenu(
  { trigger, menuClassName, children },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const containsTarget = useCallback((target) => {
    return containerRef.current?.contains(target) ?? false;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
      toggle,
      containsTarget,
    }),
    [open, close, toggle, containsTarget],
  );

  return (
    <div className="relative dropdown dropdown-end" ref={containerRef}>
      {trigger({ isOpen, open, close, toggle })}
      {isOpen && (
        <div className={`absolute right-0 top-full z-50 ${menuClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
});
