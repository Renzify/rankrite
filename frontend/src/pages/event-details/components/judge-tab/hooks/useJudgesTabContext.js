import { useOutletContext } from "react-router";
import { useTemplateStore } from "../../../../../stores/templateStore";

export function useJudgesTabContext() {
  const outletContext = useOutletContext() ?? {};
  const storeJudges = useTemplateStore((state) => state.judges);
  const storeSetJudges = useTemplateStore((state) => state.setJudges);

  return {
    eventDetails: outletContext.eventDetails,
    eventTitle: outletContext.eventTitle ?? "",
    isSavingJudge: outletContext.isSavingJudge ?? false,
    judges: outletContext.judges ?? storeJudges,
    onCreateJudge: outletContext.onCreateJudge,
    onDeleteJudge: outletContext.onDeleteJudge,
    onUpdateJudge: outletContext.onUpdateJudge,
    selectedSport: outletContext.selectedSport ?? "",
    setJudges: outletContext.setJudges ?? storeSetJudges,
  };
}
