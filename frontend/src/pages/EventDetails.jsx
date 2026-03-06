import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useEventStore } from "../stores/eventStore";
import { useDynamicTemplate } from "../hooks/useDynamicTemplate";
import toast from "react-hot-toast";

const VIEWS = [
  { key: "event_info", label: "Event Info" },
  { key: "scoring", label: "Scoring" },
  { key: "judges", label: "Judges" },
  { key: "contestants", label: "Contestants" },
  { key: "rankings", label: "Rankings" },
  { key: "display", label: "Display Controls" },
];

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    events,
    selectedView,
    setSelectedView,
    getStatusInfo,
    getJudgeTypes,
    submitScore,
    computeRankings,
    setCurrentPhase,
    setCurrentContestant,
    addJudgeToEvent,
    removeJudgeFromEvent,
    addContestantToEvent,
    removeContestantFromEvent,
    updateEventStatus,
    updateEvent,
  } = useEventStore();

  // Get dynamic template functionality
  const {
    catalog,
    isCatalogLoading,
    selectedEventType,
    selectedSport,
    template,
    formValues,
    isTemplateLoading,
    eventTypeOptions,
    sportOptions,
    visibleFields,
    setSelectedEventType,
    setSelectedSport,
    updateFieldValue,
    getFilteredOptions,
  } = useDynamicTemplate();

  const event = events.find((e) => e.id === id);

  const [scoreInputs, setScoreInputs] = useState({});
  const [newJudge, setNewJudge] = useState({
    fullName: "",
    judgeType: "",
    judgeNumber: 1,
  });
  const [newContestant, setNewContestant] = useState({
    fullName: "",
    teamName: "",
    entryNo: "",
  });
  const [editEvent, setEditEvent] = useState({
    title: "",
    sport: "",
    templateName: "",
    status: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (event) {
      setEditEvent({
        title: event.title,
        sport: event.sport,
        templateName: event.templateName,
        status: event.status,
      });
    }
  }, [event]);

  useEffect(() => {
    if (event && event.rankings.length === 0 && event.judges.length > 0) {
      computeRankings(event.id);
    }
  }, [event, computeRankings]);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Event not found</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => navigate("/events")}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const { label: statusLabel, color: statusColor } = getStatusInfo(
    event.status,
  );
  const judgeTypes = getJudgeTypes();

  const currentPhase = event.phases.find((p) => p.id === event.currentPhaseId);
  const currentContestant = event.contestants.find(
    (c) => c.id === event.currentContestantId,
  );

  // Calculate submission progress
  const totalPossibleScores = event.judges.length * event.contestants.length;
  const submittedScores = Object.keys(event.scores).reduce((count, key) => {
    return count + Object.keys(event.scores[key] || {}).length;
  }, 0);
  const progressPercent =
    totalPossibleScores > 0 ? (submittedScores / totalPossibleScores) * 100 : 0;

  const handleSubmitScore = (judgeId) => {
    const score = parseFloat(scoreInputs[judgeId]);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("Please enter a valid score (0-10)");
      return;
    }
    submitScore(event.id, event.currentContestantId, judgeId, score);
    setScoreInputs((prev) => ({ ...prev, [judgeId]: "" }));
    computeRankings(event.id);
    toast.success("Score submitted!");
  };

  const handleAddJudge = () => {
    if (!newJudge.fullName.trim()) {
      toast.error("Please enter judge's name");
      return;
    }
    if (!newJudge.judgeType) {
      toast.error("Please select judge type");
      return;
    }
    addJudgeToEvent(event.id, newJudge);
    setNewJudge({ fullName: "", judgeType: "", judgeNumber: 1 });
    toast.success("Judge added!");
  };

  const handleAddContestant = () => {
    if (!newContestant.fullName.trim()) {
      toast.error("Please enter contestant's name");
      return;
    }
    if (!newContestant.entryNo) {
      toast.error("Please enter entry number");
      return;
    }
    addContestantToEvent(event.id, {
      ...newContestant,
      entryNo: parseInt(newContestant.entryNo),
    });
    setNewContestant({ fullName: "", teamName: "", entryNo: "" });
    toast.success("Contestant added!");
  };

  const handleSaveEventInfo = () => {
    updateEvent(event.id, editEvent);
    setIsEditing(false);
    toast.success("Event updated successfully!");
  };

  // Render Event Info View
  const renderEventInfoView = () => (
    <div className="grid gap-4">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Event Information</h3>
            {!isEditing && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            // Edit Mode with Dynamic Form
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Event Title
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={editEvent.title}
                    onChange={(e) =>
                      setEditEvent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">Status</span>
                  </div>
                  <select
                    className="select select-bordered w-full"
                    value={editEvent.status}
                    onChange={(e) =>
                      setEditEvent((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="to_be_held">To Be Held</option>
                    <option value="ongoing">On Going</option>
                    <option value="finished">Finished</option>
                  </select>
                </label>
              </div>

              <div className="divider">Template Selection</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Select Event Type
                    </span>
                  </div>
                  <select
                    className={`select select-bordered w-full ${isCatalogLoading ? "select-disabled" : ""}`}
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    disabled={isCatalogLoading}
                  >
                    <option value="">-- Select Event Type --</option>
                    {eventTypeOptions.map((eventType) => (
                      <option key={eventType.value} value={eventType.value}>
                        {eventType.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label pb-1">
                    <span className="label-text font-semibold">
                      Select Sport
                    </span>
                  </div>
                  <select
                    className={`select select-bordered w-full ${!selectedEventType || isCatalogLoading ? "select-disabled" : ""}`}
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    disabled={!selectedEventType || isCatalogLoading}
                  >
                    <option value="">-- Select Sport --</option>
                    {sportOptions.map((sport) => (
                      <option key={sport.value} value={sport.value}>
                        {sport.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Template Fields */}
              {selectedSport && template && !isTemplateLoading ? (
                <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                    Template: {template.name}
                  </p>
                  <p className="mt-1 text-sm text-base-content/70">
                    {template.description}
                  </p>

                  {visibleFields.length > 0 ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visibleFields.map((field) => {
                        const fieldOptions = getFilteredOptions(field);
                        return (
                          <label key={field.id} className="form-control w-full">
                            <div className="label pb-1">
                              <span className="label-text font-semibold">
                                {field.label}
                              </span>
                            </div>
                            {field.fieldType === "select" ? (
                              <select
                                className={`select select-bordered w-full ${fieldOptions.length === 0 ? "select-disabled" : ""}`}
                                id={field.key}
                                value={formValues[field.key] || ""}
                                onChange={(e) =>
                                  updateFieldValue(field.key, e.target.value)
                                }
                                disabled={fieldOptions.length === 0}
                              >
                                <option value="">-- Select --</option>
                                {fieldOptions.map((option) => (
                                  <option key={option.id} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            {field.fieldType === "text" ? (
                              <input
                                id={field.key}
                                type="text"
                                className="input input-bordered w-full"
                                value={formValues[field.key] || ""}
                                onChange={(e) =>
                                  updateFieldValue(field.key, e.target.value)
                                }
                              />
                            ) : null}
                            {field.fieldType === "number" ? (
                              <input
                                id={field.key}
                                type="number"
                                className="input input-bordered w-full"
                                value={formValues[field.key] || ""}
                                onChange={(e) =>
                                  updateFieldValue(field.key, e.target.value)
                                }
                              />
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 alert border border-base-300 bg-base-200/60 text-base-content">
                      <span>
                        No additional fields are required for this sport.
                      </span>
                    </div>
                  )}
                </div>
              ) : selectedSport && isTemplateLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="loading loading-spinner loading-sm" />
                  Loading template...
                </div>
              ) : null}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditEvent({
                      title: event.title,
                      sport: event.sport,
                      templateName: event.templateName,
                      status: event.status,
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveEventInfo}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-control">
                <div className="label">
                  <span className="label-text font-semibold">Event Title</span>
                </div>
                <div className="text-lg">{event.title}</div>
              </div>

              <div className="form-control">
                <div className="label">
                  <span className="label-text font-semibold">Status</span>
                </div>
                <div>
                  <span
                    className={`badge ${getStatusInfo(event.status).color}`}
                  >
                    {getStatusInfo(event.status).label}
                  </span>
                </div>
              </div>

              <div className="form-control">
                <div className="label">
                  <span className="label-text font-semibold">Template</span>
                </div>
                <div>{event.templateName || "-"}</div>
              </div>

              <div className="form-control">
                <div className="label">
                  <span className="label-text font-semibold">Sport</span>
                </div>
                <div>{event.sport || "-"}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Event Summary */}
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Event Summary</h3>
          <div className="stats stats-vertical border border-base-300 bg-base-200/40">
            <div className="stat py-3">
              <div className="stat-title">Total Judges</div>
              <div className="stat-value">{event.judges.length}</div>
            </div>
            <div className="stat py-3">
              <div className="stat-title">Total Contestants</div>
              <div className="stat-value">{event.contestants.length}</div>
            </div>
            <div className="stat py-3">
              <div className="stat-title">Total Phases</div>
              <div className="stat-value">{event.phases.length}</div>
            </div>
            <div className="stat py-3">
              <div className="stat-title">Created</div>
              <div className="stat-value text-base">
                {new Date(event.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Render Scoring View
  const renderScoringView = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg">Current Contestant</h3>
          {currentContestant ? (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-content">
                {currentContestant.entryNo}
              </div>
              <div>
                <p className="text-xl font-semibold">
                  {currentContestant.fullName}
                </p>
                <p className="text-base-content/60">
                  {currentContestant.teamName}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-base-content/60">No contestant selected</p>
          )}

          <div className="divider">Select Contestant</div>
          <select
            className="select select-bordered w-full"
            value={event.currentContestantId || ""}
            onChange={(e) => setCurrentContestant(event.id, e.target.value)}
          >
            <option value="">-- Select Contestant --</option>
            {event.contestants.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.entryNo} - {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg">Submit Scores</h3>
          <p className="text-sm text-base-content/60">
            Enter scores for {currentContestant?.fullName || "contestant"}
          </p>

          <div className="space-y-3">
            {event.judges.map((judge) => {
              const scoreKey = `${event.currentContestantId}-${event.currentPhaseId}`;
              const existingScore = event.scores[scoreKey]?.[judge.id];

              return (
                <div key={judge.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-semibold">{judge.fullName}</p>
                    <p className="text-xs text-base-content/60">
                      Judge #{judge.judgeNumber} - {judge.judgeType}
                    </p>
                  </div>
                  {existingScore !== undefined ? (
                    <span className="badge badge-success badge-lg">
                      {existingScore.toFixed(2)}
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="input input-bordered w-20"
                        placeholder="0.00"
                        value={scoreInputs[judge.id] || ""}
                        onChange={(e) =>
                          setScoreInputs((prev) => ({
                            ...prev,
                            [judge.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSubmitScore(judge.id)}
                      >
                        Submit
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {event.judges.length === 0 && (
            <div className="alert alert-warning">
              <span>No judges assigned to this event</span>
            </div>
          )}
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100/90 shadow-xl lg:col-span-2">
        <div className="card-body">
          <h3 className="card-title text-lg">Contestant Queue</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Entry #</th>
                  <th>Name</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {event.contestants.map((contestant) => {
                  const scoreKey = `${contestant.id}-${event.currentPhaseId}`;
                  const contestantScores = event.scores[scoreKey] || {};
                  const isComplete =
                    Object.keys(contestantScores).length ===
                    event.judges.length;
                  const isCurrent = contestant.id === event.currentContestantId;

                  return (
                    <tr
                      key={contestant.id}
                      className={isCurrent ? "bg-primary/10" : "hover"}
                    >
                      <td>{contestant.entryNo}</td>
                      <td className="font-semibold">{contestant.fullName}</td>
                      <td>{contestant.teamName}</td>
                      <td>
                        {isComplete ? (
                          <span className="badge badge-success">Complete</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() =>
                            setCurrentContestant(event.id, contestant.id)
                          }
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );

  // Render Judges View
  const renderJudgesView = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Add Judge</h3>
          <div className="grid gap-3">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Full Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. John Doe"
                value={newJudge.fullName}
                onChange={(e) =>
                  setNewJudge((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </label>
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Judge Type</span>
              </div>
              <select
                className="select select-bordered w-full"
                value={newJudge.judgeType}
                onChange={(e) =>
                  setNewJudge((prev) => ({
                    ...prev,
                    judgeType: e.target.value,
                  }))
                }
              >
                <option value="">-- Select --</option>
                {judgeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Judge Number</span>
              </div>
              <input
                type="number"
                className="input input-bordered w-full"
                min="1"
                value={newJudge.judgeNumber}
                onChange={(e) =>
                  setNewJudge((prev) => ({
                    ...prev,
                    judgeNumber: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </label>
            <button className="btn btn-primary" onClick={handleAddJudge}>
              Add Judge
            </button>
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Judges List</h3>
          <div className="stats stats-vertical border border-base-300 bg-base-200/40">
            <div className="stat py-3">
              <div className="stat-title">Total Judges</div>
              <div className="stat-value">{event.judges.length}</div>
            </div>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {event.judges.map((judge) => (
              <div
                key={judge.id}
                className="flex items-center justify-between rounded-lg border border-base-300 bg-base-200/40 p-3"
              >
                <div>
                  <p className="font-semibold">{judge.fullName}</p>
                  <p className="text-xs text-base-content/60">
                    Judge #{judge.judgeNumber} - {judge.judgeType}
                  </p>
                </div>
                <button
                  className="btn btn-xs btn-error btn-outline"
                  onClick={() => removeJudgeFromEvent(event.id, judge.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Render Contestants View
  const renderContestantsView = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Add Contestant</h3>
          <div className="grid gap-3">
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Full Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Jane Doe"
                value={newContestant.fullName}
                onChange={(e) =>
                  setNewContestant((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />
            </label>
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Team Name</span>
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Manila Team"
                value={newContestant.teamName}
                onChange={(e) =>
                  setNewContestant((prev) => ({
                    ...prev,
                    teamName: e.target.value,
                  }))
                }
              />
            </label>
            <label className="form-control w-full">
              <div className="label pb-1">
                <span className="label-text font-semibold">Entry Number</span>
              </div>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="e.g. 1"
                value={newContestant.entryNo}
                onChange={(e) =>
                  setNewContestant((prev) => ({
                    ...prev,
                    entryNo: e.target.value,
                  }))
                }
              />
            </label>
            <button className="btn btn-primary" onClick={handleAddContestant}>
              Add Contestant
            </button>
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Contestants List</h3>
          <div className="stats stats-vertical border border-base-300 bg-base-200/40">
            <div className="stat py-3">
              <div className="stat-title">Total Contestants</div>
              <div className="stat-value">{event.contestants.length}</div>
            </div>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {event.contestants
              .sort((a, b) => a.entryNo - b.entryNo)
              .map((contestant) => (
                <div
                  key={contestant.id}
                  className="flex items-center justify-between rounded-lg border border-base-300 bg-base-200/40 p-3"
                >
                  <div>
                    <p className="font-semibold">
                      #{contestant.entryNo} - {contestant.fullName}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {contestant.teamName}
                    </p>
                  </div>
                  <button
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() =>
                      removeContestantFromEvent(event.id, contestant.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Render Rankings View
  const renderRankingsView = () => (
    <div className="grid gap-4">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Rankings</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                computeRankings(event.id);
                toast.success("Rankings recomputed!");
              }}
            >
              Recompute Rankings
            </button>
          </div>

          {event.rankings.length === 0 ? (
            <div className="alert border border-base-300 bg-base-200/60">
              <span>
                No rankings available yet. Submit scores to see rankings.
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Entry #</th>
                    <th>Name</th>
                    <th>Team</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {event.rankings.map((ranking) => (
                    <tr key={ranking.contestantId} className="hover">
                      <td>
                        <span
                          className={`badge badge-lg ${
                            ranking.rank === 1
                              ? "badge-warning"
                              : ranking.rank === 2
                                ? "badge-neutral"
                                : ranking.rank === 3
                                  ? "badge-secondary"
                                  : ""
                          }`}
                        >
                          #{ranking.rank}
                        </span>
                      </td>
                      <td>{ranking.entryNo}</td>
                      <td className="font-semibold">
                        {ranking.contestantName}
                      </td>
                      <td>{ranking.teamName}</td>
                      <td className="text-lg font-bold">
                        {ranking.totalScore.toFixed(2)}
                      </td>
                      <td>
                        {ranking.isComplete ? (
                          <span className="badge badge-success">Complete</span>
                        ) : (
                          <span className="badge badge-warning">
                            {ranking.submittedScores}/{event.judges.length}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  // Render Display Controls View
  const renderDisplayView = () => (
    <div className="grid gap-4">
      <section className="card border border-base-300 bg-base-100/90 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Event Status</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Current Status:</span>
              <select
                className="select select-bordered"
                value={event.status}
                onChange={(e) => updateEventStatus(event.id, e.target.value)}
              >
                <option value="to_be_held">To Be Held</option>
                <option value="ongoing">On Going</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-300/40 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <section className="card border border-base-300 bg-gradient-to-br from-slate-900 via-blue-800 to-violet-600 text-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <button
                  className="btn btn-sm btn-ghost mb-2 text-base-100"
                  onClick={() => navigate("/events")}
                >
                  ← Back to Events
                </button>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
                  Event Details
                </p>
                <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                  {event.title}
                </h1>
                <p className="mt-2 text-sm opacity-95">
                  {event.templateName} - {event.sport}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${statusColor} badge-lg`}>
                  {statusLabel}
                </span>
                <span className="text-xs text-base-100/60">
                  Created: {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="font-semibold text-base-100">
                Current Apparatus:
              </span>
              <select
                className="select select-bordered border-white bg-white text-black"
                value={event.currentPhaseId || ""}
                onChange={(e) => setCurrentPhase(event.id, e.target.value)}
              >
                <option value="">-- Select Apparatus --</option>
                {event.phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.label}
                  </option>
                ))}
              </select>
              {currentPhase && (
                <span className="badge badge-outline text-base-100">
                  {currentPhase.label}
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span>Score Submission Progress</span>
                <span>
                  {submittedScores} / {totalPossibleScores} (
                  {progressPercent.toFixed(0)}%)
                </span>
              </div>
              <progress
                className="progress progress-success w-full"
                value={progressPercent}
                max="100"
              />
            </div>
          </div>
        </section>

        <section className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body py-3">
            <div className="tabs tabs-boxed">
              {VIEWS.map((view) => (
                <button
                  key={view.key}
                  className={`tab ${selectedView === view.key ? "tab-active" : ""}`}
                  onClick={() => setSelectedView(view.key)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {selectedView === "event_info" && renderEventInfoView()}
        {selectedView === "scoring" && renderScoringView()}
        {selectedView === "judges" && renderJudgesView()}
        {selectedView === "contestants" && renderContestantsView()}
        {selectedView === "rankings" && renderRankingsView()}
        {selectedView === "display" && renderDisplayView()}
      </main>
    </div>
  );
}

export default EventDetails;
