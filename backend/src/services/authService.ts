import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
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
