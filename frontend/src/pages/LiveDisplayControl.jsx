import { useState } from "react";
import { useEventStore } from "../stores/eventStore";
import toast from "react-hot-toast";

// Display mode options
const DISPLAY_MODES = [
  { value: "standby", label: "Standby Screen", icon: "🔌" },
  { value: "live_ranking", label: "Live Ranking", icon: "📊" },
  { value: "one_by_one", label: "One-by-One Reveal", icon: "🎬" },
];

// Mock apparatus/category data
const APPARATUS_LIST = [
  { id: "vault", label: "Vault", category: "apparatus" },
  { id: "bars", label: "Bars", category: "apparatus" },
  { id: "beam", label: "Beam", category: "apparatus" },
  { id: "floor", label: "Floor", category: "apparatus" },
  { id: "all_around", label: "All-Around", category: "category" },
  { id: "team_score", label: "Team Score", category: "category" },
];

// Mock results data for preview
const MOCK_RESULTS = {
  vault: [
    { rank: 1, name: "Alice Johnson", team: "Manila", score: 14.8 },
    { rank: 2, name: "Bob Williams", team: "Cebu", score: 14.5 },
    { rank: 3, name: "Charlie Brown", team: "Davao", score: 14.2 },
  ],
  bars: [
    { rank: 1, name: "Jane Smith", team: "Manila", score: 15.2 },
    { rank: 2, name: "Alice Johnson", team: "Manila", score: 15.0 },
    { rank: 3, name: "Bob Williams", team: "Cebu", score: 14.8 },
  ],
  beam: [
    { rank: 1, name: "Emma Davis", team: "Davao", score: 14.6 },
    { rank: 2, name: "Alice Johnson", team: "Manila", score: 14.4 },
    { rank: 3, name: "Jane Smith", team: "Manila", score: 14.1 },
  ],
  all_around: [
    { rank: 1, name: "Alice Johnson", team: "Manila", score: 57.8 },
    { rank: 2, name: "Jane Smith", team: "Manila", score: 57.2 },
    { rank: 3, name: "Bob Williams", team: "Cebu", score: 56.9 },
  ],
};

function LiveDisplayControl() {
  const { selectedEvent } = useEventStore();

  // State management
  const [displayMode, setDisplayMode] = useState("standby");
  const [selectedApparatus, setSelectedApparatus] = useState("all_around");
  const [showScores, setShowScores] = useState(true);
  const [showRankings, setShowRankings] = useState(true);
  const [isDisplayFrozen, setIsDisplayFrozen] = useState(false);
  const [hideSensitiveInfo, setHideSensitiveInfo] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Get preview data
  const getPreviewData = () => {
    if (displayMode === "standby") {
      return null;
    }
    return MOCK_RESULTS[selectedApparatus] || [];
  };

  const previewData = getPreviewData();

  // Handle publish results
  const handlePublish = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }

    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLiveActive(true);
      toast.success(
        `Display published in ${displayMode.replace(/_/g, " ")} mode`,
      );
    } catch (error) {
      toast.error("Failed to publish display");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle reveal next result (One-by-one mode)
  const handleRevealNext = () => {
    if (revealedIndex < previewData.length - 1) {
      setRevealedIndex(revealedIndex + 1);
      toast.success(`Revealed: ${previewData[revealedIndex + 1].name}`);
    } else {
      toast.error("All results already revealed");
    }
  };

  // Handle reset reveal
  const handleResetReveal = () => {
    setRevealedIndex(0);
    toast.success("Reveal reset");
  };

  // Handle freeze display
  const handleFreezeToggle = () => {
    setIsDisplayFrozen(!isDisplayFrozen);
    toast.success(isDisplayFrozen ? "Display unfrozen" : "Display frozen");
  };

  // Display mode content
  const renderStandbyScreen = () => (
    <div className="flex h-64 items-center justify-center rounded-lg bg-gradient-to-b from-blue-900 to-blue-950">
      <div className="text-center">
        <div className="text-5xl mb-4">📺</div>
        <h2 className="text-2xl font-bold text-white">Standby</h2>
        <p className="text-blue-200 mt-2">Waiting for live display to start</p>
      </div>
    </div>
  );

  const renderLiveRanking = () => (
    <div className="space-y-2">
      <div className="rounded-lg bg-blue-900 px-4 py-2 text-white font-semibold">
        {selectedApparatus.replace(/_/g, " ").toUpperCase()}
      </div>
      {previewData.map((result) => (
        <div
          key={result.rank}
          className="flex items-center justify-between rounded-lg bg-base-100 p-3 border border-base-300 hover:bg-base-200 transition"
        >
          <div className="flex items-center gap-4">
            {showRankings && (
              <div className="font-bold text-lg min-w-8">#{result.rank}</div>
            )}
            <div>
              <p className="font-semibold">{result.name}</p>
              {!hideSensitiveInfo && (
                <p className="text-sm text-gray-500">{result.team}</p>
              )}
            </div>
          </div>
          {showScores && (
            <div className="text-xl font-bold text-blue-600">
              {result.score}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderOneByOne = () => (
    <div className="space-y-3">
      <div className="rounded-lg bg-blue-900 px-4 py-2 text-white font-semibold">
        {selectedApparatus.replace(/_/g, " ").toUpperCase()}
      </div>
      <div className="text-sm text-gray-600 mb-3">
        Revealed: {revealedIndex + 1} / {previewData.length}
      </div>

      {previewData.slice(0, revealedIndex + 1).map((result, index) => (
        <div
          key={result.rank}
          className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 p-4 border-2 border-orange-300"
        >
          <div className="flex items-center gap-4">
            {showRankings && (
              <div className="font-bold text-2xl min-w-12 text-orange-600">
                #{result.rank}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{result.name}</p>
              {!hideSensitiveInfo && (
                <p className="text-sm text-gray-600">{result.team}</p>
              )}
            </div>
          </div>
          {showScores && (
            <div className="text-2xl font-bold text-orange-600">
              {result.score}
            </div>
          )}
        </div>
      ))}

      {revealedIndex < previewData.length - 1 && (
        <div className="rounded-lg bg-gray-200 p-4 text-center text-gray-600 font-semibold">
          Next result is ready...
        </div>
      )}
    </div>
  );

  const getPreviewContent = () => {
    if (displayMode === "standby") return renderStandbyScreen();
    if (displayMode === "live_ranking") return renderLiveRanking();
    if (displayMode === "one_by_one") return renderOneByOne();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        {/* Header */}
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-violet-600 text-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
              Live Display Control
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Audience Display Management
            </h1>
            <p className="mt-2 text-base-100/80">
              Control what appears on the public display for your audience
            </p>
            {isLiveActive && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-400/20 px-3 py-2 w-fit">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">Display is LIVE</span>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 border border-base-300 shadow-lg">
              <div className="card-body">
                {/* Display Mode Selector */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">Display Mode</h3>
                  <div className="space-y-2">
                    {DISPLAY_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => {
                          setDisplayMode(mode.value);
                          setRevealedIndex(0);
                        }}
                        disabled={isDisplayFrozen}
                        className={`w-full btn btn-sm justify-start ${
                          displayMode === mode.value
                            ? "btn-primary"
                            : "btn-ghost"
                        }`}
                      >
                        <span className="mr-2">{mode.icon}</span>
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apparatus/Category Selector */}
                {displayMode !== "standby" && (
                  <div className="mb-6 border-t pt-6">
                    <h3 className="font-bold text-lg mb-3">
                      Apparatus / Category
                    </h3>
                    <select
                      value={selectedApparatus}
                      onChange={(e) => setSelectedApparatus(e.target.value)}
                      disabled={isDisplayFrozen}
                      className="select select-bordered w-full select-sm"
                    >
                      {APPARATUS_LIST.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Display Options */}
                <div className="mb-6 border-t pt-6">
                  <h3 className="font-bold text-lg mb-3">Display Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showScores}
                        onChange={(e) => setShowScores(e.target.checked)}
                        disabled={isDisplayFrozen}
                        className="checkbox checkbox-sm"
                      />
                      <span className="text-sm">Show Scores</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRankings}
                        onChange={(e) => setShowRankings(e.target.checked)}
                        disabled={isDisplayFrozen}
                        className="checkbox checkbox-sm"
                      />
                      <span className="text-sm">Show Rankings</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideSensitiveInfo}
                        onChange={(e) => setHideSensitiveInfo(e.target.checked)}
                        disabled={isDisplayFrozen}
                        className="checkbox checkbox-sm"
                      />
                      <span className="text-sm">Hide Sensitive Info</span>
                    </label>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="border-t pt-6 space-y-2">
                  <button
                    onClick={handlePublish}
                    disabled={isDisplayFrozen || isPublishing}
                    className="btn btn-primary w-full btn-sm"
                  >
                    {isPublishing ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      "📤 Publish Display"
                    )}
                  </button>

                  <button
                    onClick={handleFreezeToggle}
                    className={`btn w-full btn-sm ${
                      isDisplayFrozen ? "btn-error" : "btn-warning"
                    }`}
                  >
                    {isDisplayFrozen
                      ? "❄️ Display Frozen"
                      : "🔓 Freeze Display"}
                  </button>
                </div>

                {/* One-by-One Controls */}
                {displayMode === "one_by_one" && previewData.length > 0 && (
                  <div className="border-t pt-6 space-y-2">
                    <h3 className="font-bold text-lg mb-3">Reveal Controls</h3>
                    <button
                      onClick={handleRevealNext}
                      disabled={
                        isDisplayFrozen ||
                        revealedIndex >= previewData.length - 1
                      }
                      className="btn btn-success w-full btn-sm"
                    >
                      ➜ Reveal Next
                    </button>
                    <button
                      onClick={handleResetReveal}
                      disabled={isDisplayFrozen || revealedIndex === 0}
                      className="btn btn-outline btn-sm w-full"
                    >
                      ↺ Reset Reveal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Pane */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 border border-base-300 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Display Preview</h3>
                  <div className="badge badge-outline">PREVIEW MODE</div>
                </div>

                {/* Preview Background */}
                <div className="rounded-lg bg-gradient-to-b from-slate-900 to-slate-800 p-6 min-h-96">
                  <div className="bg-white/5 backdrop-blur rounded-lg p-6 h-full">
                    {isDisplayFrozen && (
                      <div className="absolute top-4 right-4 badge badge-warning gap-2">
                        <span className="text-lg">🔒</span> FROZEN
                      </div>
                    )}
                    {getPreviewContent()}
                  </div>
                </div>

                {/* Info Footer */}
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Status:</strong>{" "}
                    {isDisplayFrozen
                      ? "Frozen"
                      : isLiveActive
                        ? "Live"
                        : "Preview"}
                  </p>
                  <p>
                    <strong>Mode:</strong> {displayMode.replace(/_/g, " ")}
                  </p>
                  {displayMode !== "standby" && (
                    <p>
                      <strong>Showing:</strong>{" "}
                      {selectedApparatus.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">💡 Usage Tips</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>
                <strong>Standby Screen:</strong> Shows "Waiting" message for
                audience
              </li>
              <li>
                <strong>Live Ranking:</strong> Displays real-time competitor
                rankings
              </li>
              <li>
                <strong>One-by-One Reveal:</strong> Gradually reveals
                competitors (suspenseful)
              </li>
              <li>
                <strong>Freeze Display:</strong> Temporarily lock current
                display from changes
              </li>
              <li>
                <strong>Hide Sensitive Info:</strong> Removes team/personal
                information
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LiveDisplayControl;
