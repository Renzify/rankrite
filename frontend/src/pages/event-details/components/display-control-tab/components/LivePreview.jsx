function LivePreview({ handleOpenLiveDisplay, isFrozen }) {
  return (
    <div>
      <div className="app-surface p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
            Live Display Preview
          </p>
          <button
            type="button"
            className="btn btn-xs btn-outline self-start sm:self-auto"
            onClick={handleOpenLiveDisplay}
          >
            Open Live Display
          </button>
        </div>

        <div className="mt-4 hidden justify-center rounded-3xl border border-base-300 bg-slate-900/80 p-4 sm:p-5 md:p-6 lg:flex">
          <div className="w-full max-w-[920px] rounded-[2rem] border border-slate-700 bg-slate-950 p-3 sm:p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>Live Feed</span>
              {isFrozen ? (
                <span className="badge badge-warning badge-sm">Frozen</span>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-800 bg-black">
              <div className="aspect-video w-full">
                <iframe
                  title="Live display preview"
                  src="/live-display?preview=1"
                  className="h-full w-full bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-base-300 bg-base-200/40 p-4 text-sm text-base-content/70 lg:hidden">
          Live preview is hidden on smaller screens to keep controls stable. Use{" "}
          <span className="font-semibold">Open Live Display</span> for a full
          preview window.
        </div>

        <p className="mt-3 text-xs text-base-content/70">
          This preview renders the live display and updates in real time.
        </p>
      </div>
    </div>
  );
}

export default LivePreview;
