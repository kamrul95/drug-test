export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function ResultBadge({ result }) {
  const pos = result === "positive";
  return <span className={pos ? "badge-pos" : "badge-neg"}>{String(result).toUpperCase()}</span>;
}
