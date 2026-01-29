import { prisma } from "../lib/prisma";
import { UserRole } from "../types/user/userType";

async function seedAdmin() {
  try {
    const adminData = {
      email: "admin1@gmail.com",
      name: "Admin User",
      role: UserRole.ADMIN,
      password: "admin12345",
      emailVerified: false,
    };
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });
    if (existingUser) {
      throw new Error("user already exists");
    }
    const signUpAdmin = await fetch(
      "http://localhost:5000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify(adminData),
      }
    );
    console.log(signUpAdmin);
    if (signUpAdmin.ok) {
      await prisma.user.update({
        where: {
          email: adminData.email,
        },
        data: {
          emailVerified: true,
        },
      });
    }
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}
seedAdmin();
