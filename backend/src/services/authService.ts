import bcrypt from "bcrypt";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db/index.ts";
import { event, user } from "../db/schema.ts";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PROFILE_PIC_MAX_LENGTH = 2_500_000;

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  profilePic: string | null;
};

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePic?: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SettingsProfile = {
  id: string;
  fullName: string;
  email: string;
  profilePic: string | null;
  passwordUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateProfileInput = {
  fullName: string;
  email: string;
  profilePic?: string | null;
};

export type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type DeletedAccount = {
  id: string;
  fullName: string;
  email: string;
};

function normalizeEmail(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeProfilePic(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > PROFILE_PIC_MAX_LENGTH) {
    throw new Error("PROFILE_PIC_TOO_LARGE");
  }

  return normalized;
}

function buildDefaultProfilePic() {
  const avatarSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128' role='img' aria-label='User silhouette'><rect width='128' height='128' rx='20' fill='#0f766e'/><circle cx='64' cy='44' r='20' fill='#f8d7c8'/><path d='M24 108c5-23 20-34 40-34s35 11 40 34H24z' fill='#5eead4'/><path d='M40 40c4-10 13-16 24-16s20 6 24 16c-5-4-12-6-24-6s-19 2-24 6z' fill='#134e4a'/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`;
}

function isUndefinedColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42703"
  );
}

function mapToAuthUser(record: Pick<
  typeof user.$inferSelect,
  "id" | "fullName" | "email" | "profilePic"
>): AuthUser {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    profilePic: record.profilePic,
  };
}

function mapToSettingsProfile(record: Pick<
  typeof user.$inferSelect,
  | "id"
  | "fullName"
  | "email"
  | "profilePic"
  | "passwordUpdatedAt"
  | "createdAt"
  | "updatedAt"
>): SettingsProfile {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    profilePic: record.profilePic,
    passwordUpdatedAt: record.passwordUpdatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  const fullName = (input.fullName ?? "").trim();
  const email = normalizeEmail(input.email);
  const password = input.password ?? "";
  const confirmPassword = input.confirmPassword ?? "";
  const providedProfilePic = normalizeProfilePic(input.profilePic);

  if (!fullName || !email || !password || !confirmPassword) {
    throw new Error("INVALID_AUTH_INPUT");
  }

  if (password !== confirmPassword) {
    throw new Error("PASSWORD_MISMATCH");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("INVALID_EMAIL_FORMAT");
  }

  if (password.length < 6) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  const profilePic = providedProfilePic ?? buildDefaultProfilePic();

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [createdUser] = await db
    .insert(user)
    .values({
      fullName,
      email,
      passwordHash,
      profilePic,
    })
    .returning({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });

  if (!createdUser) {
    throw new Error("FAILED_TO_CREATE_USER");
  }

  return mapToAuthUser(createdUser);
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const password = input.password ?? "";

  if (!email || !password) {
    throw new Error("INVALID_AUTH_INPUT");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!existingUser) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isPasswordCorrect = await bcrypt.compare(password, existingUser.passwordHash);

  if (!isPasswordCorrect) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return mapToAuthUser(existingUser);
}

export async function getAuthUserById(userId: string): Promise<AuthUser | null> {
  const normalizedUserId = (userId ?? "").trim();

  if (!normalizedUserId) {
    return null;
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, normalizedUserId),
    columns: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
    },
  });

  if (!existingUser) {
    return null;
  }

  return mapToAuthUser(existingUser);
}

export async function getSettingsProfileById(
  userId: string,
): Promise<SettingsProfile | null> {
  const normalizedUserId = (userId ?? "").trim();

  if (!normalizedUserId) {
    return null;
  }

  let existingUser: {
    id: string;
    fullName: string;
    email: string;
    profilePic: string | null;
    passwordUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  } | null = null;

  try {
    const result = await db.query.user.findFirst({
      where: eq(user.id, normalizedUserId),
      columns: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        passwordUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (result) {
      existingUser = result;
    }
  } catch (error) {
    if (!isUndefinedColumnError(error)) {
      throw error;
    }

    const fallbackUser = await db.query.user.findFirst({
      where: eq(user.id, normalizedUserId),
      columns: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (fallbackUser) {
      existingUser = {
        ...fallbackUser,
        passwordUpdatedAt: fallbackUser.updatedAt,
      };
    }
  }

  if (!existingUser) {
    return null;
  }

  return mapToSettingsProfile(existingUser);
}

export async function updateSettingsProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<SettingsProfile> {
  const normalizedUserId = (userId ?? "").trim();
  const fullName = (input.fullName ?? "").trim();
  const email = normalizeEmail(input.email);
  const hasProfilePicInput = Object.prototype.hasOwnProperty.call(
    input,
    "profilePic",
  );
  const profilePic = normalizeProfilePic(input.profilePic);

  if (!normalizedUserId || !fullName || !email) {
    throw new Error("INVALID_AUTH_INPUT");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error("INVALID_EMAIL_FORMAT");
  }

  const emailConflict = await db.query.user.findFirst({
    where: and(eq(user.email, email), ne(user.id, normalizedUserId)),
    columns: {
      id: true,
    },
  });

  if (emailConflict) {
    throw new Error("EMAIL_EXISTS");
  }

  let updatedUser:
    | {
        id: string;
        fullName: string;
        email: string;
        profilePic: string | null;
        passwordUpdatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;
  const updatePayload: {
    fullName: string;
    email: string;
    updatedAt: Date;
    profilePic?: string | null;
  } = {
    fullName,
    email,
    updatedAt: new Date(),
  };

  if (hasProfilePicInput) {
    updatePayload.profilePic = profilePic ?? null;
  }

  try {
    const [result] = await db
      .update(user)
      .set(updatePayload)
      .where(eq(user.id, normalizedUserId))
      .returning({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        passwordUpdatedAt: user.passwordUpdatedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    updatedUser = result;
  } catch (error) {
    if (!isUndefinedColumnError(error)) {
      throw error;
    }

    const [fallbackUpdatedUser] = await db
      .update(user)
      .set(updatePayload)
      .where(eq(user.id, normalizedUserId))
      .returning({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    if (fallbackUpdatedUser) {
      updatedUser = {
        ...fallbackUpdatedUser,
        passwordUpdatedAt: fallbackUpdatedUser.updatedAt,
      };
    }
  }

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return mapToSettingsProfile(updatedUser);
}

export async function updateSettingsPassword(
  userId: string,
  input: UpdatePasswordInput,
): Promise<Date> {
  const normalizedUserId = (userId ?? "").trim();
  const currentPassword = input.currentPassword ?? "";
  const newPassword = input.newPassword ?? "";
  const confirmNewPassword = input.confirmNewPassword ?? "";

  if (
    !normalizedUserId ||
    !currentPassword ||
    !newPassword ||
    !confirmNewPassword
  ) {
    throw new Error("INVALID_AUTH_INPUT");
  }

  if (newPassword !== confirmNewPassword) {
    throw new Error("PASSWORD_MISMATCH");
  }

  if (newPassword.length < 6) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, normalizedUserId),
    columns: {
      id: true,
      passwordHash: true,
    },
  });

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    existingUser.passwordHash,
  );

  if (!isCurrentPasswordCorrect) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  let updatedUser: { passwordUpdatedAt: Date } | undefined;

  try {
    const [result] = await db
      .update(user)
      .set({
        passwordHash,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, normalizedUserId))
      .returning({
        passwordUpdatedAt: user.passwordUpdatedAt,
      });

    updatedUser = result;
  } catch (error) {
    if (!isUndefinedColumnError(error)) {
      throw error;
    }

    const [fallbackResult] = await db
      .update(user)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(user.id, normalizedUserId))
      .returning({
        updatedAt: user.updatedAt,
      });

    if (fallbackResult) {
      updatedUser = {
        passwordUpdatedAt: fallbackResult.updatedAt,
      };
    }
  }

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return updatedUser.passwordUpdatedAt;
}

export async function deleteAccountById(userId: string): Promise<DeletedAccount> {
  const normalizedUserId = (userId ?? "").trim();

  if (!normalizedUserId) {
    throw new Error("USER_NOT_FOUND");
  }

  return db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, normalizedUserId))
      .limit(1);

    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    await tx
      .update(event)
      .set({
        createdByUserId: null,
        updatedAt: new Date(),
      })
      .where(eq(event.createdByUserId, normalizedUserId));

    const [deletedUser] = await tx
      .delete(user)
      .where(eq(user.id, normalizedUserId))
      .returning({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      });

    if (!deletedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    return deletedUser;
  });
}
