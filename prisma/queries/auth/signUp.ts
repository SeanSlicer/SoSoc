import { prisma } from "~/../lib/client/db";
import bcrypt from "bcrypt";

export async function createUser(
  username: string,
  email: string,
  password: string,
) {
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  return user;
}
