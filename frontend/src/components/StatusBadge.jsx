const STATUS_STYLE_BY_VALUE = {
  Draft: "border-slate-300 bg-slate-200 text-slate-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Finished: "border-amber-300 bg-amber-100 text-amber-700",
};

function getStatusClassName(status) {
  const colorClasses =
    STATUS_STYLE_BY_VALUE[status] ??
    "border-base-300 bg-base-200 text-base-content";

  return `inline-flex w-24 justify-center rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${colorClasses}`;
}

function StatusBadge({ status }) {
  return <span className={getStatusClassName(status)}>{status}</span>;
}

export default StatusBadge;
