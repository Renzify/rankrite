import React from "react";

function ProfileFieldCard({ label, value, className = "" }) {
  return (
    <div className={`app-muted-panel ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value || "--"}</p>
    </div>
  );
}
function AccountProfile({
  isEditing,
  settings,
  handleChange,
  canSaveProfile,
  handleCancelEditing,
  handleSaveProfile,
  handleStartEditing,
}) {
  return (
    <div>
      <section className="app-surface mb-5">
        <div className="app-section space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Account Profile</h2>
              <div
                className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                data-tip="Account Profile: View and manage your account information. It lets you update your personal details and profile settings."
              >
                ?
              </div>
            </div>
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCancelEditing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProfile}
                  disabled={!canSaveProfile}
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleStartEditing}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="app-muted-panel flex flex-col items-center justify-center gap-4 text-center">
              <div className="avatar placeholder">
                <div className="w-24 rounded-full bg-neutral text-neutral-content" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  {settings.username}
                </h3>
                <p className="mt-1 text-sm text-base-content/60">
                  {settings.email}
                </p>
              </div>
              {isEditing ? (
                <button type="button" className="btn btn-outline btn-sm">
                  Change Photo
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/70">
                Account Details
              </h3>

              {!isEditing ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ProfileFieldCard
                    label="Full Name"
                    value={settings.username}
                  />
                  <ProfileFieldCard
                    label="Email Address"
                    value={settings.email}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="form-control app-muted-panel w-full">
                    <div className="label px-0 pt-0 pb-1">
                      <span className="label-text font-semibold">
                        Full Name
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.username}
                      onChange={(event) =>
                        handleChange("username", event.target.value)
                      }
                    />
                  </label>

                  <label className="form-control app-muted-panel w-full">
                    <div className="label px-0 pt-0 pb-1">
                      <span className="label-text font-semibold">
                        Email Address
                      </span>
                    </div>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={settings.email}
                      onChange={(event) =>
                        handleChange("email", event.target.value)
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      ;
    </div>
  );
}

export default AccountProfile;
