import { useCallback } from "react";

export default function useDisplayControlHandlers({
  hasContestants,
  contestantsLength,
  isFrozen,
  isBlackout,
  setActiveIndex,
  setIsAutoRunning,
  setSwapSeconds,
  setViewMode,
  setIsFrozen,
  setIsBlackout,
}) {
  const handlePrev = useCallback(() => {
    if (!hasContestants || isFrozen || isBlackout) return;
    setActiveIndex((prev) => (prev === 0 ? contestantsLength - 1 : prev - 1));
  }, [
    contestantsLength,
    hasContestants,
    isBlackout,
    isFrozen,
    setActiveIndex,
  ]);

  const handleNext = useCallback(() => {
    if (!hasContestants || isFrozen || isBlackout) return;
    setActiveIndex((prev) => (prev + 1) % contestantsLength);
  }, [contestantsLength, hasContestants, isBlackout, isFrozen, setActiveIndex]);

  const handleOpenLiveDisplay = useCallback(() => {
    if (typeof window === "undefined") return;
    window.open("/live-display", "_blank", "noopener,noreferrer");
  }, []);

  const handleToggleAutoSwap = useCallback(() => {
    setIsAutoRunning((prev) => !prev);
  }, [setIsAutoRunning]);

  const handleSwapSecondsChange = useCallback(
    (event) => {
      setSwapSeconds(Number(event.target.value));
    },
    [setSwapSeconds],
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
    },
    [setViewMode],
  );

  const handleFreezeStateChange = useCallback(
    (value) => {
      setIsFrozen(value === "frozen");
    },
    [setIsFrozen],
  );

  const handleOutputStateChange = useCallback(
    (value) => {
      setIsBlackout(value === "blackout");
    },
    [setIsBlackout],
  );

  return {
    handlePrev,
    handleNext,
    handleOpenLiveDisplay,
    handleToggleAutoSwap,
    handleSwapSecondsChange,
    handleViewModeChange,
    handleFreezeStateChange,
    handleOutputStateChange,
  };
}
