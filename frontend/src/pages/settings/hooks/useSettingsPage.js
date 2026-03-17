import { useCallback, useEffect, useState } from "react";
import {
  getSettingsProfile,
  updateSettingsPassword,
  updateSettingsProfile,
} from "../../../api/settingsApi";
import { useAuthStore } from "../../../stores/authStore";

const INITIAL_SETTINGS = {
  username: "",
  email: "",
  dateCreated: "--",
  lastPasswordUpdated: "--",
  theme: "light",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function formatDateLabel(value) {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message ?? fallbackMessage;
}

export function useSettingsPage() {
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState(INITIAL_SETTINGS);
  const [passwordNotice, setPasswordNotice] = useState({
    type: "",
    message: "",
  });

  const syncProfileToState = useCallback((profile) => {
    const mappedProfile = {
      username: profile?.fullName ?? "",
      email: profile?.email ?? "",
      dateCreated: formatDateLabel(profile?.createdAt),
      lastPasswordUpdated: formatDateLabel(profile?.passwordUpdatedAt),
    };

    setSettings((prev) => ({
      ...prev,
      username: mappedProfile.username,
      email: mappedProfile.email,
      dateCreated: mappedProfile.dateCreated,
      lastPasswordUpdated: mappedProfile.lastPasswordUpdated,
    }));

    setOriginalSettings((prev) => ({
      ...prev,
      username: mappedProfile.username,
      email: mappedProfile.email,
      dateCreated: mappedProfile.dateCreated,
      lastPasswordUpdated: mappedProfile.lastPasswordUpdated,
    }));
  }, []);

  const loadSettingsProfile = useCallback(async () => {
    setIsLoadingProfile(true);

    try {
      const profile = await getSettingsProfile();
      syncProfileToState(profile);
    } catch (error) {
      console.error("Failed to load settings profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [syncProfileToState]);

  useEffect(() => {
    if (!authUser) {
      setIsLoadingProfile(false);
      return;
    }

    void loadSettingsProfile();
  }, [authUser, loadSettingsProfile]);

  const handleChange = useCallback((field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (
      field === "currentPassword" ||
      field === "newPassword" ||
      field === "confirmPassword"
    ) {
      setPasswordNotice({
        type: "",
        message: "",
      });
    }
  }, []);

  const hasPreferencesChanged = settings.theme !== originalSettings.theme;

  const hasProfileChanged =
    settings.username !== originalSettings.username ||
    settings.email !== originalSettings.email;

  const canSaveProfile = Boolean(
    settings.username.trim() &&
      settings.email.trim() &&
      hasProfileChanged &&
      !isSavingProfile,
  );

  const handleSavePreferences = useCallback(() => {
    setOriginalSettings((prev) => ({
      ...prev,
      theme: settings.theme,
    }));
  }, [settings.theme]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      username: originalSettings.username,
      email: originalSettings.email,
    }));
    setIsEditing(false);
  }, [originalSettings.email, originalSettings.username]);

  const handleSaveProfile = useCallback(async () => {
    if (!canSaveProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateSettingsProfile({
        fullName: settings.username,
        email: settings.email,
      });

      syncProfileToState(updatedProfile);

      setAuthUser({
        ...(authUser ?? {}),
        id: updatedProfile.id ?? authUser?.id,
        _id: updatedProfile.id ?? authUser?._id,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        profilePic: updatedProfile.profilePic ?? authUser?.profilePic ?? null,
      });

      setIsEditing(false);
    } catch (error) {
      console.error(
        getApiErrorMessage(error, "Failed to save profile settings."),
      );
    } finally {
      setIsSavingProfile(false);
    }
  }, [authUser, canSaveProfile, setAuthUser, settings, syncProfileToState]);

  const handleSaveNewPassword = useCallback(async () => {
    if (!isChangingPassword) {
      return;
    }

    setIsSavingPassword(true);
    setPasswordNotice({
      type: "",
      message: "",
    });

    try {
      const updatedPassword = await updateSettingsPassword({
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
        confirmNewPassword: settings.confirmPassword,
      });

      const updatedLabel = formatDateLabel(
        updatedPassword?.passwordUpdatedAt ?? new Date(),
      );

      setSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        lastPasswordUpdated: updatedLabel,
      }));

      setOriginalSettings((prev) => ({
        ...prev,
        lastPasswordUpdated: updatedLabel,
      }));

      setIsChangingPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setPasswordNotice({
        type: "success",
        message: "Password updated successfully.",
      });
    } catch (error) {
      setPasswordNotice({
        type: "error",
        message: getApiErrorMessage(error, "Failed to update password."),
      });
    } finally {
      setIsSavingPassword(false);
    }
  }, [
    isChangingPassword,
    settings.confirmPassword,
    settings.currentPassword,
    settings.newPassword,
  ]);

  const handleToggleChangePassword = useCallback(() => {
    setPasswordNotice({
      type: "",
      message: "",
    });

    if (isChangingPassword) {
      setIsChangingPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      return;
    }

    setIsChangingPassword(true);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setSettings((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  }, [isChangingPassword]);

  return {
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
  };
}
