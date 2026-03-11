import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

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

  // Track original settings to detect changes
  const [originalSettings, setOriginalSettings] = useState({ ...settings });

  // Handle input field changes
  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if preferences have changed
  const hasPreferencesChanged =
    settings.theme !== originalSettings.theme ||
    settings.notifications !== originalSettings.notifications;

  const handleSavePreferences = () => {
    setOriginalSettings({ ...settings });
    console.log("Preferences saved:", {
      theme: settings.theme,
      notifications: settings.notifications,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Settings saved:", settings);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleToggleChangePassword = () => {
    if (!isChangingPassword) {
      // Clear password fields when starting to change password
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
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <section className="app-surface mb-5">
            <div className="app-section">
              {/* Top Row: Back Button */}
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-base-content/70 hover:text-primary transition-colors duration-200"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Back</span>
                </Link>
              </div>

              {/* Bottom Row: Title and Subtitle */}
              <div className="p-2">
                <h1 className="text-5xl font-bold tracking-tight mb-3">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-base-content/70">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </section>

          {/* Single Div Box - Account Profile */}
          <section className="app-surface">
            <div className="app-section">
              <h2 className="text-2xl font-semibold mb-6">Account Profile</h2>

              <hr className="border-base-300 mb-6" />

              {/* Profile Section */}
              <div className="flex items-start gap-6 mb-8">
                {/* Profile Picture with Change Photo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="w-24 rounded-full bg-neutral text-neutral-content">
                      <span className="text-3xl">
                        {settings.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {isEditing && (
                    <button type="button" className="btn btn-outline btn-sm">
                      Change Photo
                    </button>
                  )}
                </div>

                {/* Name, Email, and Edit Button */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-4xl font-semibold mt-3">
                        {settings.username}
                      </h3>
                      <p className="text-xl text-base-content/60">
                        {settings.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={toggleEdit}
                    >
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Details Header */}
              <div className="flex items-center gap-2 mb-4">
                <hr className="flex-1 border-base-300" />
                <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">
                  Account Details:
                </span>
                <hr className="flex-1 border-base-300" />
              </div>

              {/* User Information Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Full Name */}
                <div className="border border-base-300 rounded-lg p-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Full Name</span>
                    </span>
                    <input
                      type="text"
                      className={`input input-bordered w-full ${!isEditing ? "input-disabled bg-base-200" : ""}`}
                      value={settings.username}
                      onChange={(e) => handleChange("username", e.target.value)}
                      disabled={!isEditing}
                    />
                  </label>
                </div>

                {/* Email Address */}
                <div className="border border-base-300 rounded-lg p-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Email Address</span>
                    </span>
                    <input
                      type="email"
                      className={`input input-bordered w-full ${!isEditing ? "input-disabled bg-base-200" : ""}`}
                      value={settings.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={!isEditing}
                    />
                  </label>
                </div>

                {/* Role */}
                <div className="border border-base-300 rounded-lg p-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Role</span>
                    </span>
                    <input
                      type="text"
                      className="input input-bordered w-full input-disabled bg-base-200"
                      value="Administrator"
                      disabled
                    />
                  </label>
                </div>

                {/* Date Joined */}
                <div className="border border-base-300 rounded-lg p-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Date Joined</span>
                    </span>
                    <input
                      type="text"
                      className="input input-bordered w-full input-disabled bg-base-200"
                      value="January 15, 2025"
                      disabled
                    />
                  </label>
                </div>

                {/* Last Login */}
                <div className="border border-base-300 rounded-lg p-4 md:col-span-2">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Last Login</span>
                    </span>
                    <input
                      type="text"
                      className="input input-bordered w-full input-disabled bg-base-200"
                      value="January 20, 2026 at 10:30 AM"
                      disabled
                    />
                  </label>
                </div>
              </div>

              {/* Save Button - Only shows when editing */}
              {isEditing && (
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={toggleEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={toggleEdit}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Password and Preferences Row */}
          <div className="grid gap-5 md:grid-cols-2 mt-5">
            {/* Change Password Section */}
            <section className="app-surface">
              <div className="app-section">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>

                <div className="space-y-4">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">Current Password</span>
                    </span>
                    <div className="relative mb-4">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className={`input input-bordered w-full pr-10 ${!isChangingPassword ? "input-disabled bg-base-200" : ""}`}
                        value={settings.currentPassword}
                        onChange={(e) =>
                          handleChange("currentPassword", e.target.value)
                        }
                        placeholder="Enter current password"
                        disabled={!isChangingPassword}
                      />
                      {isChangingPassword && (
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
                      )}
                    </div>
                  </label>

                  {!isChangingPassword && (
                    <label className="form-control w-full">
                      <span className="label">
                        <span className="label-text">Last Updated</span>
                      </span>
                      <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200 mb-4"
                        value={settings.lastPasswordUpdated}
                        disabled
                      />
                    </label>
                  )}

                  {isChangingPassword && (
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
                            onChange={(e) =>
                              handleChange("newPassword", e.target.value)
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
                            onChange={(e) =>
                              handleChange("confirmPassword", e.target.value)
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
                  )}

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

            {/* User Preferences Section */}
            <section className="app-surface">
              <div className="app-section">
                <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                <div className="space-y-6">
                  <label className="form-control w-full">
                    <span className="label">
                      <span className="label-text">System Appearance</span>
                    </span>
                    <select
                      className="select select-bordered w-full mb-4"
                      value={settings.theme}
                      onChange={(e) => handleChange("theme", e.target.value)}
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
                      className="select select-bordered w-full mb-4"
                      value={settings.notifications ? "enabled" : "disabled"}
                      onChange={(e) =>
                        handleChange(
                          "notifications",
                          e.target.value === "enabled",
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

          {/* Sign Out and Delete Account Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
            <button type="button" className="btn btn-error btn-outline">
              Delete Account
            </button>
            <button type="button" className="btn btn-neutral">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
