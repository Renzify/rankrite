import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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

function Settings() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [settings, setSettings] = useState({
    username: "Admin",
    email: "admin@rankrite.com",
    notifications: true,
    theme: "light",
    currentPassword: "********",
    newPassword: "",
    confirmPassword: "",
    lastPasswordUpdated: "January 15, 2025",
  });
  const [originalSettings, setOriginalSettings] = useState({ ...settings });

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasPreferencesChanged =
    settings.theme !== originalSettings.theme ||
    settings.notifications !== originalSettings.notifications;

  const hasProfileChanged =
    settings.username !== originalSettings.username ||
    settings.email !== originalSettings.email;

  const canSaveProfile = Boolean(
    settings.username.trim() && settings.email.trim() && hasProfileChanged,
  );

  const handleSavePreferences = () => {
    setOriginalSettings((prev) => ({
      ...prev,
      theme: settings.theme,
      notifications: settings.notifications,
    }));
    console.log("Preferences saved:", {
      theme: settings.theme,
      notifications: settings.notifications,
    });
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setSettings((prev) => ({
      ...prev,
      username: originalSettings.username,
      email: originalSettings.email,
    }));
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    setOriginalSettings((prev) => ({
      ...prev,
      username: settings.username,
      email: settings.email,
    }));
    setIsEditing(false);
    console.log("Profile saved:", {
      username: settings.username,
      email: settings.email,
    });
  };

  const handleToggleChangePassword = () => {
    if (!isChangingPassword) {
      setSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
    setIsChangingPassword(!isChangingPassword);
  };

  return (
    <div className="app-page app-page-wide">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-7xl">
          <section className="app-surface mb-5">
            <div className="app-section">
              <h1 className="app-page-title">Settings</h1>
              <p className="app-page-subtitle">
                Manage your account settings and preferences.
              </p>
            </div>
          </section>

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
                <p className="mt-1 text-sm text-base-content/60">
                  Personal details used across the Rankrite workspace.
                </p>

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
                  <div className="badge badge-outline">Administrator</div>
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
                      <ProfileFieldCard label="Role" value="Administrator" />
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

                      <ProfileFieldCard label="Role" value="Administrator" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="mb-5 grid gap-5 xl:grid-cols-2">
            <section className="app-surface">
              <div className="app-section">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Change Password</h2>
                  {/* <div
                    className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                    data-tip="Change Password: Update your account password to keep your account secure. It lets you change your current password and set a new one."
                  >
                    ?
                  </div> */}
                </div>
                <p className="mt-1 text-sm text-base-content/60">
                  Update your credentials and review when the password was last
                  changed.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Current Password</span>
                    </span>
                    <div className="relative mb-4">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className={`input input-bordered w-full pr-10 ${!isChangingPassword ? "input-disabled bg-base-200" : ""}`}
                        value={settings.currentPassword}
                        onChange={(event) =>
                          handleChange("currentPassword", event.target.value)
                        }
                        placeholder="Enter current password"
                        disabled={!isChangingPassword}
                      />
                      {isChangingPassword ? (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </label>

                  {!isChangingPassword ? (
                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text">Last Updated</span>
                      </span>
                      <input
                        type="text"
                        className="input input-bordered mb-4 w-full input-disabled bg-base-200"
                        value={settings.lastPasswordUpdated}
                        disabled
                      />
                    </label>
                  ) : null}

                  {isChangingPassword ? (
                    <>
                      <label className="form-control w-full">
                        <span className="label">
                          <span className="label-text">New Password</span>
                        </span>
                        <div className="relative mb-4">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="input input-bordered w-full pr-10"
                            placeholder="Enter new password"
                            value={settings.newPassword}
                            onChange={(event) =>
                              handleChange("newPassword", event.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </label>

                      <label className="form-control w-full">
                        <span className="label">
                          <span className="label-text">Confirm Password</span>
                        </span>
                        <div className="relative mb-4">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="input input-bordered w-full pr-10"
                            placeholder="Confirm new password"
                            value={settings.confirmPassword}
                            onChange={(event) =>
                              handleChange(
                                "confirmPassword",
                                event.target.value,
                              )
                            }
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </label>
                    </>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={handleToggleChangePassword}
                  >
                    {isChangingPassword ? "Update Password" : "Change Password"}
                  </button>
                </div>
              </div>
            </section>

            <section className="app-surface">
              <div className="app-section">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Preferences</h2>
                  {/* <div
                    className="tooltip tooltip-warning tooltip-bottom z-[100] w-[25px] h-[25px] rounded-full border-2 border-warning bg-transparent text-warning flex items-center justify-center text-sm font-medium cursor-help hover:bg-warning hover:text-warning-content transition-all duration-200"
                    data-tip="Preferences: Manage how the system looks and how alerts work. It lets you adjust your viewing and notification settings."
                  >
                    ?
                  </div> */}
                </div>
                <p className="mt-1 text-sm text-base-content/60">
                  Adjust the interface theme and notification behavior for this
                  account.
                </p>

                <div className="mt-6 space-y-6">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">System Appearance</span>
                    </span>
                    <select
                      className="select select-bordered mb-4 w-full"
                      value={settings.theme}
                      onChange={(event) =>
                        handleChange("theme", event.target.value)
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>

                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Notifications</span>
                    </span>
                    <select
                      className="select select-bordered mb-4 w-full"
                      value={settings.notifications ? "enabled" : "disabled"}
                      onChange={(event) =>
                        handleChange(
                          "notifications",
                          event.target.value === "enabled",
                        )
                      }
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className={`btn w-full ${hasPreferencesChanged ? "btn-primary" : "btn-disabled"}`}
                    disabled={!hasPreferencesChanged}
                    onClick={handleSavePreferences}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="app-surface">
            <div className="app-section flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Account Actions</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Sign out of this session or permanently remove the account.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" className="btn btn-error btn-outline">
                  Delete Account
                </button>
                <button type="button" className="btn btn-neutral">
                  Log Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
