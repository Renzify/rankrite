import { useState } from "react";
import toast from "react-hot-toast";
import { createJudgeAccessLink } from "../../../../../api/eventApi";
import { useJudgesTabContext } from "./useJudgesTabContext";

export function useJudgeLinkModal(showLinkGeneration) {
  const { eventDetails, canGenerateJudgeLinks } = useJudgesTabContext();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState("qr");
  const [activeJudgeName, setActiveJudgeName] = useState("");
  const [activeJudgeLink, setActiveJudgeLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const eventId = eventDetails?.event?.id ?? "";
  const shouldShowLinkGeneration =
    showLinkGeneration ?? Boolean(eventDetails?.event?.id);

  const createJudgeScoringLink = (accessToken) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const hashParams = new URLSearchParams();

    if (accessToken) {
      hashParams.set("access", accessToken);
    }

    return `${baseUrl}/judge-score${hashParams.toString() ? `#${hashParams.toString()}` : ""}`;
  };

  const handleGenerateLink = async (judge) => {
    if (!eventId || !canGenerateJudgeLinks || !judge?.id) return;

    try {
      const { accessToken } = await createJudgeAccessLink(eventId, judge.id);

      setActiveJudgeName(judge.fullName);
      setActiveJudgeLink(createJudgeScoringLink(accessToken));
      setLinkModalTab("qr");
      setCopyMessage("");
      setIsLinkModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to generate the secure judge access link.",
      );
    }
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
    canGenerateJudgeLinks,
    linkModalTab,
    setLinkModalTab,
    shouldShowLinkGeneration,
  };
}
