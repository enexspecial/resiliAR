import { Tooltip } from "../ui/Tooltip";

interface Step {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
  tooltip?: string;
}

interface Props {
  steps: Step[];
  onSelect?: (id: string) => void;
}

export function StepIndicator({ steps, onSelect }: Props) {
  return (
    <div className="step-indicator" aria-label="Progress">
      {steps.map((s, i) => {
        const dot = (
          <button
            type="button"
            className={`step-indicator__dot ${s.active ? "active" : ""} ${s.done ? "done" : ""}`}
            onClick={() => onSelect?.(s.id)}
            aria-current={s.active ? "step" : undefined}
            aria-label={`${s.label}${s.done ? ", completed" : ""}`}
          >
            {s.done ? <span className="step-indicator__check">✓</span> : i + 1}
          </button>
        );

        return (
          <div key={s.id} className="step-indicator__item">
            {s.tooltip ? (
              <Tooltip content={s.tooltip} position="bottom">
                {dot}
              </Tooltip>
            ) : (
              dot
            )}
            <span className={`step-indicator__label ${s.active ? "active" : ""}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`step-indicator__line ${s.done ? "done" : ""}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
