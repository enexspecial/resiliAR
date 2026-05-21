import { Tooltip, type TooltipPosition } from "./Tooltip";

interface Props {
  content: string;
  label?: string;
  position?: TooltipPosition;
  wide?: boolean;
}

export function InfoTip({
  content,
  label = "More information",
  position = "top",
  wide = false,
}: Props) {
  return (
    <Tooltip content={content} position={position} wide={wide} clickToToggle>
      <button
        type="button"
        className="info-tip"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden>i</span>
      </button>
    </Tooltip>
  );
}
