import { useState } from "react";

const INITIAL_SETTINGS = {
  username: "Admin",
  email: "admin@rankrite.com",
  notifications: true,
  theme: "light",
  currentPassword: "********",
  newPassword: "",
  confirmPassword: "",
  lastPasswordUpdated: "January 15, 2025",
};

export function useSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState(INITIAL_SETTINGS);

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

    setIsChangingPassword((prev) => !prev);
  };

  return {
    canSaveProfile,
    handleCancelEditing,
    handleChange,
    handleSavePreferences,
    handleSaveProfile,
    handleStartEditing,
    handleToggleChangePassword,
    hasPreferencesChanged,
    isChangingPassword,
    isEditing,
    setShowConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    settings,
    showConfirmPassword,
    showCurrentPassword,
    showNewPassword,
  };
}
