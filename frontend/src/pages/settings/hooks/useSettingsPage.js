import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  deleteSettingsAccount,
  getSettingsProfile,
  updateSettingsPassword,
  updateSettingsProfile,
} from "../../../api/settingsApi";
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
} from "../../../shared/lib/theme";
import { useAuthStore } from "../../../stores/authStore";

const INITIAL_THEME = getStoredTheme();
const MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

const INITIAL_SETTINGS = {
  username: "",
  gender: "--",
  email: "",
  profilePic: null,
  dateCreated: "--",
  lastPasswordUpdated: "--",
  theme: INITIAL_THEME,
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("INVALID_FILE_RESULT"));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("FILE_READ_FAILED"));
    };

    reader.readAsDataURL(file);
  });
}

export function useSettingsPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
      gender: profile?.gender ?? "--",
      email: profile?.email ?? "",
      profilePic: profile?.profilePic ?? null,
      dateCreated: formatDateLabel(profile?.createdAt),
      lastPasswordUpdated: formatDateLabel(profile?.passwordUpdatedAt),
    };

    setSettings((prev) => ({
      ...prev,
      username: mappedProfile.username,
      gender: mappedProfile.gender,
      email: mappedProfile.email,
      profilePic: mappedProfile.profilePic,
      dateCreated: mappedProfile.dateCreated,
      lastPasswordUpdated: mappedProfile.lastPasswordUpdated,
    }));

    setOriginalSettings((prev) => ({
      ...prev,
      username: mappedProfile.username,
      gender: mappedProfile.gender,
      email: mappedProfile.email,
      profilePic: mappedProfile.profilePic,
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
      setSettings((prev) => ({
        ...prev,
        username: authUser?.fullName ?? prev.username,
        gender: authUser?.gender ?? prev.gender,
        email: authUser?.email ?? prev.email,
        profilePic: authUser?.profilePic ?? prev.profilePic,
      }));
    } finally {
      setIsLoadingProfile(false);
    }
  }, [
    authUser?.email,
    authUser?.fullName,
    authUser?.gender,
    authUser?.profilePic,
    syncProfileToState,
  ]);

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

  const handleProfilePhotoSelect = useCallback(async (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      toast.error("Profile photo must be 2MB or smaller.");
      return;
    }

    try {
      const profilePicDataUrl = await readFileAsDataUrl(file);
      setSettings((prev) => ({
        ...prev,
        profilePic: profilePicDataUrl,
      }));
      setIsEditing(true);
      toast.success("Photo selected. Save profile to apply changes.");
    } catch (error) {
      console.error("Failed to read profile photo:", error);
      toast.error("Failed to load selected photo.");
    }
  }, []);

  const hasPreferencesChanged = settings.theme !== originalSettings.theme;

  const hasProfileChanged =
    settings.username !== originalSettings.username ||
    settings.email !== originalSettings.email ||
    settings.profilePic !== originalSettings.profilePic;

  const canSaveProfile = Boolean(
    settings.username.trim() &&
      settings.email.trim() &&
      hasProfileChanged &&
      !isSavingProfile,
  );

  const handleSavePreferences = useCallback(() => {
    const savedTheme = persistTheme(settings.theme);
    applyTheme(savedTheme);

    setSettings((prev) => ({
      ...prev,
      theme: savedTheme,
    }));

    setOriginalSettings((prev) => ({
      ...prev,
      theme: savedTheme,
    }));
  }, [settings.theme]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      username: originalSettings.username,
      gender: originalSettings.gender,
      email: originalSettings.email,
      profilePic: originalSettings.profilePic,
    }));
    setIsEditing(false);
  }, [
    originalSettings.email,
    originalSettings.gender,
    originalSettings.profilePic,
    originalSettings.username,
  ]);

  const handleSaveProfile = useCallback(async () => {
    if (!canSaveProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateSettingsProfile({
        fullName: settings.username,
        email: settings.email,
        profilePic: settings.profilePic,
      });

      syncProfileToState(updatedProfile);

      setAuthUser({
        ...(authUser ?? {}),
        id: updatedProfile.id ?? authUser?.id,
        _id: updatedProfile.id ?? authUser?._id,
        fullName: updatedProfile.fullName,
        gender: updatedProfile.gender ?? authUser?.gender ?? null,
        email: updatedProfile.email,
        profilePic: updatedProfile.profilePic ?? authUser?.profilePic ?? null,
      });

      setIsEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to save profile settings.",
      );
      console.error(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  }, [authUser, canSaveProfile, setAuthUser, settings, syncProfileToState]);

  const handleSaveNewPassword = useCallback(async () => {
    if (!isChangingPassword) {
      return;
    }

    if (settings.newPassword !== settings.confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "New password and confirmation do not match.",
      });
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
      toast.success("Password updated successfully.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update password.");
      setPasswordNotice({
        type: "error",
        message,
      });
      toast.error(message);
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

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate("/auth/login", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to log out.");
      toast.error(message);
    }
  }, [isLoggingOut, logout, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteSettingsAccount();
      setAuthUser(null);
      toast.success("Account deleted successfully.");
      navigate("/auth/signup", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete account.");
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  }, [isDeletingAccount, navigate, setAuthUser]);

  return {
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
  };
}
