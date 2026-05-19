interface Props {
  chain: string[];
  source?: string;
}

export function FallbackChain({ chain, source }: Props) {
  if (!chain?.length && !source) return null;

  return (
    <div className="fallback-chain" role="status" aria-live="polite">
      {source && (
        <p className="source-badge">
          Source: <strong>{source.replace(/_/g, " ")}</strong>
        </p>
      )}
      {chain.length > 0 && (
        <ol>
          {chain.map((step, i) => (
            <li key={`${step}-${i}`}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
