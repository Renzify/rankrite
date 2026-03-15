import React from "react";

function ChangePassword({
  showCurrentPassword,
  isChangingPassword,
  settings,
  handleChange,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  handleToggleChangePassword,
}) {
  return (
    <section className="app-surface">
      <div className="app-section">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Update your credentials and review when the password was last changed.
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
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      handleChange("confirmPassword", event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
  );
}

export default ChangePassword;
