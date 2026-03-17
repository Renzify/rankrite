import bcrypt from "bcrypt";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema.ts";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
};

export type UpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function normalizeEmail(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
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
  const profilePic = (input.profilePic ?? "").trim() || null;

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

  const existingUser = await db.query.user.findFirst({
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

  const [updatedUser] = await db
    .update(user)
    .set({
      fullName,
      email,
      updatedAt: new Date(),
    })
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

  const [updatedUser] = await db
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

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return updatedUser.passwordUpdatedAt;
}
