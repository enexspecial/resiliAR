import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface Props {
  content: string;
  children: ReactNode;
  position?: TooltipPosition;
  className?: string;
  /** Wider bubble for longer copy */
  wide?: boolean;
  /** Tap to toggle — use for info icons; off for buttons and nav */
  clickToToggle?: boolean;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  wide = false,
  clickToToggle = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, hide]);

  return (
    <span
      ref={wrapRef}
      className={`tooltip-wrap ${className}`.trim()}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span
        className="tooltip-trigger"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={hide}
        onClick={
          clickToToggle
            ? (e) => {
                e.stopPropagation();
                toggle();
              }
            : undefined
        }
        onKeyDown={
          clickToToggle
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`tooltip-bubble tooltip--${position} ${wide ? "tooltip--wide" : ""}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
