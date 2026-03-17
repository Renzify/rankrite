import { useOutletContext } from "react-router";
import { useTemplateStore } from "../../../../../stores/templateStore";

const NOOP = () => {};

export function useJudgesTabContext() {
  const outletContext = useOutletContext() ?? {};
  const storeJudges = useTemplateStore((state) => state.judges);
  const storeSetJudges = useTemplateStore((state) => state.setJudges);

  return {
    activeContestantId: outletContext.activeContestantId ?? "",
    contestants: outletContext.contestants ?? [],
    eventDetails: outletContext.eventDetails,
    eventTitle: outletContext.eventTitle ?? "",
    isSavingJudge: outletContext.isSavingJudge ?? false,
    isSwitchingActiveContestant:
      outletContext.isSwitchingActiveContestant ?? false,
    judges: outletContext.judges ?? storeJudges,
    onCreateJudge: outletContext.onCreateJudge,
    onDeleteJudge: outletContext.onDeleteJudge,
    onSetActiveContestant: outletContext.onSetActiveContestant,
    onUpdateJudge: outletContext.onUpdateJudge,
    selectedSport: outletContext.selectedSport ?? "",
    setActiveContestantId: outletContext.setActiveContestantId ?? NOOP,
    setJudges: outletContext.setJudges ?? storeSetJudges,
  };
}
