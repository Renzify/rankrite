import { useState } from "react";
import { useJudgesTabContext } from "./useJudgesTabContext";

export function useJudgeLinkModal(showLinkGeneration) {
  const { eventDetails, eventTitle, selectedSport, activeContestantId } =
    useJudgesTabContext();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState("qr");
  const [activeJudgeName, setActiveJudgeName] = useState("");
  const [activeJudgeLink, setActiveJudgeLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const eventId = eventDetails?.event?.id ?? "";
  const shouldShowLinkGeneration =
    showLinkGeneration ?? Boolean(eventDetails?.event?.id);

  const createJudgeScoringLink = (judge) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();

    if (eventId) params.set("eventId", eventId);
    if (eventTitle) params.set("eventTitle", eventTitle);
    if (selectedSport) params.set("sport", selectedSport);
    if (judge.id) params.set("judgeId", judge.id);
    if (judge.fullName) params.set("judgeName", judge.fullName);
    if (judge.judgeType) params.set("judgeType", judge.judgeType);
    if (activeContestantId) {
      params.set("activeContestantId", activeContestantId);
    }

    const queryString = params.toString();
    return `${baseUrl}/judge-score${queryString ? `?${queryString}` : ""}`;
  };

  const handleGenerateLink = (judge) => {
    if (!eventId) return;

    setActiveJudgeName(judge.fullName);
    setActiveJudgeLink(createJudgeScoringLink(judge));
    setLinkModalTab("qr");
    setCopyMessage("");
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setCopyMessage("");
  };

  const handleCopyLink = async () => {
    if (!activeJudgeLink) return;

    try {
      await navigator.clipboard.writeText(activeJudgeLink);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage("Unable to copy automatically.");
    }
  };

  return {
    activeJudgeLink,
    activeJudgeName,
    closeLinkModal,
    copyMessage,
    eventId,
    handleCopyLink,
    handleGenerateLink,
    isLinkModalOpen,
    linkModalTab,
    setLinkModalTab,
    shouldShowLinkGeneration,
  };
}
