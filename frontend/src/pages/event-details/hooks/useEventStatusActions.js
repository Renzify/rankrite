import { Flag, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { updateEvent } from "../../../api/eventApi";
import { buildEventPayload } from "../../../shared/lib/eventPayload";
import {
  formatEventStatusLabel,
  getApiErrorMessage,
  isEventInfoComplete,
} from "./eventDetailsHelpers";

export function useEventStatusActions({
  eventId,
  eventDetails,
  judges,
  contestants,
  syncLoadedEventDetails,
}) {
  const currentEventStatus = eventDetails?.event?.status ?? "";
  const canManageSetup =
    currentEventStatus === "draft" || currentEventStatus === "to_be_held";
  const canGenerateJudgeLinks =
    currentEventStatus !== "draft" && currentEventStatus !== "to_be_held";
  const canSetToBeHeld = useMemo(
    () =>
      isEventInfoComplete(eventDetails) &&
      judges.length > 0 &&
      contestants.length > 0,
    [eventDetails, judges.length, contestants.length],
  );
  const isDraftToBeHeldRestricted =
    currentEventStatus === "draft" && !canSetToBeHeld;
  const [isUpdatingEventStatus, setIsUpdatingEventStatus] = useState(false);
  const [pendingEventStatusAction, setPendingEventStatusAction] = useState("");
  const hasAttemptedAutoToBeHeldRef = useRef(false);

  const manualEventStatusActions =
    currentEventStatus === "to_be_held"
      ? [
          {
            nextStatus: "live",
            label: "Go Live",
            description:
              "Start judging and unlock the live event controls for this event.",
            icon: Play,
            toneClassName:
              "border-success/30 bg-success/10 hover:border-success/50 hover:bg-success/15",
          },
        ]
      : currentEventStatus === "live"
        ? [
            {
              nextStatus: "to_be_held",
              label: "Move to To Be Held",
              description:
                "Pause the event and return it to the ready state without finishing it.",
              icon: Pause,
              toneClassName:
                "border-warning/30 bg-warning/10 hover:border-warning/50 hover:bg-warning/15",
            },
            {
              nextStatus: "finished",
              label: "Finish Event",
              description:
                "Close the event after judging and scoring are complete.",
              icon: Flag,
              toneClassName:
                "border-primary/30 bg-primary/10 hover:border-primary/50 hover:bg-primary/15",
            },
          ]
        : [];

  const eventStatusBadgeClass =
    currentEventStatus === "live"
      ? "badge-success"
      : currentEventStatus === "to_be_held"
        ? "badge-warning"
        : currentEventStatus === "finished"
          ? "badge-neutral"
          : "badge-ghost";

  const handleEventStatusChange = async (nextStatus) => {
    if (!eventId || !eventDetails) {
      toast.error("Missing event details.");
      return;
    }

    const currentStatus = eventDetails.event?.status;

    if (!nextStatus || !currentStatus || nextStatus === currentStatus) {
      return;
    }

    if (
      currentStatus === "draft" &&
      nextStatus === "to_be_held" &&
      !canSetToBeHeld
    ) {
      toast.error(
        "To change Draft Status, complete event details and add at least 1 judge and 1 contestant.",
      );
      return;
    }

    if (
      nextStatus === "to_be_held" &&
      currentStatus !== "draft" &&
      currentStatus !== "live"
    ) {
      toast.error("Only Live events can be moved back to To Be Held.");
      return;
    }

    if (nextStatus === "live" && currentStatus !== "to_be_held") {
      toast.error("Only To Be Held events can be set to Live.");
      return;
    }

    if (nextStatus === "finished" && currentStatus !== "live") {
      toast.error("Only Live events can be set to Finished.");
      return;
    }

    if (
      nextStatus !== "to_be_held" &&
      nextStatus !== "live" &&
      nextStatus !== "finished"
    ) {
      toast.error("Unsupported event status change.");
      return;
    }

    try {
      const payload = {
        ...buildEventPayload({
          template: eventDetails.template,
          formValues: eventDetails.formValues ?? {},
          eventTitle: eventDetails.event.title,
        }),
        status: nextStatus,
      };

      setPendingEventStatusAction(nextStatus);
      setIsUpdatingEventStatus(true);
      const updatedDetails = await updateEvent(eventId, payload);

      syncLoadedEventDetails(updatedDetails);
      toast.success(`Status updated to ${formatEventStatusLabel(nextStatus)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NO_TEMPLATE_SELECTED") {
          toast.error("No template selected.");
          return;
        }
        if (error.message === "NO_EVENT_TITLE") {
          toast.error("Please enter an event title.");
          return;
        }
      }

      const message = getApiErrorMessage(
        error,
        "Failed to update event status.",
      );
      console.error("Failed to update event status:", error);
      toast.error(message);
    } finally {
      setIsUpdatingEventStatus(false);
      setPendingEventStatusAction("");
    }
  };

  useEffect(() => {
    if (!eventId || !eventDetails) {
      hasAttemptedAutoToBeHeldRef.current = false;
      return;
    }

    if (currentEventStatus !== "draft" || !canSetToBeHeld) {
      hasAttemptedAutoToBeHeldRef.current = false;
      return;
    }

    if (isUpdatingEventStatus || hasAttemptedAutoToBeHeldRef.current) {
      return;
    }

    hasAttemptedAutoToBeHeldRef.current = true;

    const autoPromoteToBeHeld = async () => {
      try {
        const payload = {
          ...buildEventPayload({
            template: eventDetails.template,
            formValues: eventDetails.formValues ?? {},
            eventTitle: eventDetails.event.title,
          }),
          status: "to_be_held",
        };

        setIsUpdatingEventStatus(true);
        const updatedDetails = await updateEvent(eventId, payload);

        syncLoadedEventDetails(updatedDetails);
      } catch (error) {
        hasAttemptedAutoToBeHeldRef.current = false;

        if (error instanceof Error) {
          if (error.message === "NO_TEMPLATE_SELECTED") {
            toast.error("No template selected.");
            return;
          }
          if (error.message === "NO_EVENT_TITLE") {
            toast.error("Please enter an event title.");
            return;
          }
        }

        const message = getApiErrorMessage(
          error,
          "Failed to automatically update event status.",
        );
        console.error("Failed to automatically update event status:", error);
        toast.error(message);
      } finally {
        setIsUpdatingEventStatus(false);
        setPendingEventStatusAction("");
      }
    };

    void autoPromoteToBeHeld();
  }, [
    canSetToBeHeld,
    currentEventStatus,
    eventDetails,
    eventId,
    isUpdatingEventStatus,
    syncLoadedEventDetails,
  ]);

  return {
    canGenerateJudgeLinks,
    canManageSetup,
    currentEventStatus,
    eventStatusBadgeClass,
    handleEventStatusChange,
    isDraftToBeHeldRestricted,
    isUpdatingEventStatus,
    manualEventStatusActions,
    pendingEventStatusAction,
  };
}