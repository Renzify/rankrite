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
    <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4">
      <div className="mb-6">
        <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h1 className="pt-2 pl-2 text-md font-semibold uppercase">
                Event Details
              </h1>
            </div>
            <div>
              <button className="rounded bg-blue-500 px-2 py-1 text-white">
                On Going
              </button>
            </div>
          </div>
          <div className="px-5 pb-5">
            <h1 className="text-3xl font-bold">{eventTitle}</h1>
          </div>
        </div>
      </div>

      <div>
        <div className="tabs tabs-border w-full gap-3" role="tablist">
          {TAB_LINKS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              role="tab"
              className={({ isActive }) =>
                `tab ${isActive ? "tab-active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="border border-base-300 bg-base-100 p-6 md:p-8">
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
      </div>
    </div>
  );
}
