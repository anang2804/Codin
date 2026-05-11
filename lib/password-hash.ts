import bcrypt from "bcryptjs";

const HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS ?? 10);

export async function hashPassword(password: string) {
  if (!password) {
    throw new Error("Password is required");
  }

  return bcrypt.hash(password, HASH_ROUNDS);
}
