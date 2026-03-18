import { useSettingsPage } from "./hooks/useSettingsPage";
import AccountProfile from "./components/AccountProfile";
import ChangePassword from "./components/ChangePassword";
import Preferences from "./components/Preferences";
import ConfirmDeleteModal from "../../shared/components/ConfirmDeleteModal";
import { useState } from "react";

function Settings() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const {
    canSaveProfile,
    handleCancelEditing,
    handleChange,
    handleDeleteAccount,
    handleLogout,
    handleProfilePhotoSelect,
    handleSaveNewPassword,
    handleSavePreferences,
    handleSaveProfile,
    handleStartEditing,
    handleToggleChangePassword,
    hasPreferencesChanged,
    isChangingPassword,
    isDeletingAccount,
    isEditing,
    isLoadingProfile,
    isLoggingOut,
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
            handleProfilePhotoSelect={handleProfilePhotoSelect}
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
          <AccountActions
            isDeletingAccount={isDeletingAccount}
            isLoggingOut={isLoggingOut}
            onDeleteAccount={() => setIsDeleteModalOpen(true)}
            onLogout={handleLogout}
          />
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        name={settings.username || settings.email}
        descriptionLines={[
          "This will permanently remove your account and cannot be undone.",
          "You will be signed out immediately after deletion.",
        ]}
        confirmLabel="Delete Account"
        isDeleting={isDeletingAccount}
        onClose={() => {
          if (isDeletingAccount) return;
          setIsDeleteModalOpen(false);
        }}
        onConfirm={async () => {
          await handleDeleteAccount();
          setIsDeleteModalOpen(false);
        }}
      />
    </div>
  );
}

export default Settings;

function AccountActions({
  isDeletingAccount,
  isLoggingOut,
  onDeleteAccount,
  onLogout,
}) {
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
          <button
            type="button"
            className="btn btn-error btn-outline w-full sm:w-auto"
            onClick={onDeleteAccount}
            disabled={isDeletingAccount || isLoggingOut}
          >
            {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
          </button>
          <button
            type="button"
            className="btn btn-neutral w-full sm:w-auto"
            onClick={onLogout}
            disabled={isDeletingAccount || isLoggingOut}
          >
            {isLoggingOut ? "Logging Out..." : "Log Out"}
          </button>
        </div>
      </div>
    </section>
  );
}
