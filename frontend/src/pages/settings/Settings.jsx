import { useSettingsPage } from "./hooks/useSettingsPage";
import AccountProfile from "./components/AccountProfile";
import ChangePassword from "./components/ChangePassword";
import Preferences from "./components/Preferences";

function Settings() {
  const {
    canSaveProfile,
    handleCancelEditing,
    handleChange,
    handleSaveNewPassword,
    handleSavePreferences,
    handleSaveProfile,
    handleStartEditing,
    handleToggleChangePassword,
    hasPreferencesChanged,
    isChangingPassword,
    isEditing,
    isLoadingProfile,
    isSavingPassword,
    isSavingProfile,
    passwordNotice,
    setShowConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    settings,
    showConfirmPassword,
    showCurrentPassword,
    showNewPassword,
  } = useSettingsPage();

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

          <AccountProfile
            settings={settings}
            isEditing={isEditing}
            canSaveProfile={canSaveProfile}
            isLoadingProfile={isLoadingProfile}
            isSavingProfile={isSavingProfile}
            handleChange={handleChange}
            handleCancelEditing={handleCancelEditing}
            handleSaveProfile={handleSaveProfile}
            handleStartEditing={handleStartEditing}
          />
          <div className="mb-5 grid gap-5 xl:grid-cols-2">
            <ChangePassword
              settings={settings}
              showCurrentPassword={showCurrentPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              isChangingPassword={isChangingPassword}
              handleChange={handleChange}
              handleSaveNewPassword={handleSaveNewPassword}
              handleToggleChangePassword={handleToggleChangePassword}
              setShowCurrentPassword={setShowCurrentPassword}
              setShowNewPassword={setShowNewPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              isSavingPassword={isSavingPassword}
              passwordNotice={passwordNotice}
            />
            <Preferences
              settings={settings}
              handleChange={handleChange}
              handleSavePreferences={handleSavePreferences}
              hasPreferencesChanged={hasPreferencesChanged}
            />
          </div>
          <AccountActions />
        </div>
      </div>
    </div>
  );
}

export default Settings;

function AccountActions() {
  return (
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
  );
}
