import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";

const TAB_LINKS = [
  { to: "event-info", label: "Event Info" },
  { to: "judges", label: "Judges" },
  { to: "contestant", label: "Contestants" },
  { to: "scoring", label: "Scoring" },
  { to: "display-control", label: "Display Control" },
];

export default function EventDetails() {
  const {
    isCatalogLoading,
    selectedEventType,
    selectedSport,
    formValues,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    getFilteredOptions,
  } = useDynamicTemplate();

  const [judgeFullName, setJudgeFullName] = useState("");
  const [judgeType, setJudgeType] = useState("");
  const [judges, setJudges] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [judgeScores, setJudgeScores] = useState({});

  const eventTitle = formValues.eventTitle || "Gymnastics Regional 2024";

  const selectableFields = useMemo(
    () => visibleFields.filter((field) => field.fieldType === "select"),
    [visibleFields],
  );

  const canSubmitJudge = Boolean(judgeFullName.trim() && judgeType);

  const handleJudgeSubmit = (event) => {
    event.preventDefault();
    if (!canSubmitJudge) return;

    const nextJudge = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random()}`,
      fullName: judgeFullName.trim(),
      judgeType,
    };

    setJudges((prev) => [...prev, nextJudge]);
    setJudgeFullName("");
    setJudgeType("");
  };

  return (
    <div className="app-page app-page-wide space-y-5">
      <section className="app-surface">
        <div className="app-section flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
              Event Details
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{eventTitle}</h1>
          </div>
          <span className="badge badge-info badge-outline px-3 py-3 text-xs uppercase tracking-[0.1em]">
            Ongoing
          </span>
        </div>
      </section>

      <div className="tabs tabs-boxed w-full gap-2 bg-base-200/50 p-1" role="tablist">
        {TAB_LINKS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            role="tab"
            className={({ isActive }) =>
              `tab rounded-lg px-4 ${isActive ? "tab-active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <section className="app-surface">
        <div className="app-section">
          <Outlet
            context={{
              isCatalogLoading,
              selectedEventType,
              selectedSport,
              formValues,
              eventTypeOptions,
              sportOptions,
              selectableFields,
              setSelectedEventType,
              setSelectedSport,
              updateFieldValue,
              getFilteredOptions,
              eventTitle,
              judgeFullName,
              judgeType,
              judges,
              judgeScores,
              setJudgeScores,
              contestants,
              setContestants,
              setJudgeFullName,
              setJudgeType,
              canSubmitJudge,
              handleJudgeSubmit,
            }}
          />
        </div>
      </section>
    </div>
  );
}
