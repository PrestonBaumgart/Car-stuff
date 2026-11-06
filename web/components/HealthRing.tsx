export function HealthRing({ score, big = false }: { score: number; big?: boolean }) {
  const color = score >= 80 ? "var(--ok)" : score >= 50 ? "var(--amber)" : "var(--coral)";
  return (
    <div
      className={big ? "ring big" : "ring"}
      style={{ "--pct": score, "--c": color } as React.CSSProperties}
      role="img"
      aria-label={`Health score ${score} out of 100`}
    >
      <span>{score}</span>
    </div>
  );
}
