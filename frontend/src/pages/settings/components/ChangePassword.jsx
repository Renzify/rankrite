import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  label,
  value,
  onChange,
  isVisible,
  onToggleVisibility,
  placeholder,
}) {
  return (
    <label className="form-control w-full">
      <span className="label">
        <span className="label-text mb-2">{label}</span>
      </span>
      <div className="relative mb-4">
        <input
          type={isVisible ? "text" : "password"}
          className="input input-bordered w-full pr-12"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-base-content/60 hover:text-base-content"
          onClick={onToggleVisibility}
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function ChangePassword({
  settings,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  isChangingPassword,
  handleChange,
  handleSaveNewPassword,
  handleToggleChangePassword,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  isSavingPassword,
  passwordNotice,
}) {
  return (
    <section className="app-surface">
      <div className="app-section">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        <p className="mt-1 text-sm text-base-content/60">
          Update your password and review when it was last changed.
        </p>

        {!isChangingPassword ? (
          <div className="mt-6 space-y-4">
            <label className="form-control w-full">
              <span className="label">
                <span className="label-text mb-2">Current Password</span>
              </span>
              <input
                type="password"
                className="input input-bordered w-full cursor-not-allowed bg-base-200 mb-4"
                value="********"
                disabled
                readOnly
              />
            </label>

            <label className="form-control w-full">
              <span className="label">
                <span className="label-text mb-2">Last Updated</span>
              </span>
              <input
                type="text"
                className="input input-bordered w-full cursor-not-allowed bg-base-200 mb-4"
                value={settings.lastPasswordUpdated || "--"}
                disabled
                readOnly
              />
            </label>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleToggleChangePassword}
            >
              Change Password
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <PasswordInput
              label="Current Password"
              value={settings.currentPassword}
              onChange={(event) =>
                handleChange("currentPassword", event.target.value)
              }
              isVisible={showCurrentPassword}
              onToggleVisibility={() =>
                setShowCurrentPassword((current) => !current)
              }
              placeholder="Enter current password"
            />

            <PasswordInput
              label="New Password"
              value={settings.newPassword}
              onChange={(event) =>
                handleChange("newPassword", event.target.value)
              }
              isVisible={showNewPassword}
              onToggleVisibility={() =>
                setShowNewPassword((current) => !current)
              }
              placeholder="Enter new password"
            />

            <PasswordInput
              label="Confirm New Password"
              value={settings.confirmPassword}
              onChange={(event) =>
                handleChange("confirmPassword", event.target.value)
              }
              isVisible={showConfirmPassword}
              onToggleVisibility={() =>
                setShowConfirmPassword((current) => !current)
              }
              placeholder="Confirm new password"
            />

            {passwordNotice.message ? (
              <p
                className={`text-sm ${
                  passwordNotice.type === "error"
                    ? "text-error"
                    : "text-success"
                }`}
              >
                {passwordNotice.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={handleSaveNewPassword}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Saving..." : "Save New Password"}
              </button>
              <button
                type="button"
                className="btn btn-outline flex-1"
                onClick={handleToggleChangePassword}
                disabled={isSavingPassword}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ChangePassword;
