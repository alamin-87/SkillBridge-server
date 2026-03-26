
import { UserRole } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
  console.log("🌱 Seeding Super Admin...");

  try {
    // 🔹 Validate ENV first
    if (!envVars.SUPER_ADMIN_EMAIL || !envVars.SUPER_ADMIN_PASSWORD) {
      throw new Error("SUPER_ADMIN_EMAIL or PASSWORD missing in env");
    }

    // 🔹 Check if already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: envVars.SUPER_ADMIN_EMAIL,
      },
      include: {
        admin: true,
      },
    });

    if (existingUser) {
      console.log("✅ Super Admin already exists. Skipping...");
      return;
    }

    // 🔹 Create user using auth system
    const superAdminUser = await auth.api.signUpEmail({
      body: {
        email: envVars.SUPER_ADMIN_EMAIL,
        password: envVars.SUPER_ADMIN_PASSWORD,
        name: "Super Admin",
        role: UserRole.ADMIN,
        rememberMe: false,
      },
    });

    if (!superAdminUser?.user?.id) {
      throw new Error("Failed to create super admin user");
    }

    // 🔹 Transaction (atomic)
    await prisma.$transaction(async (tx) => {
      // ✅ Mark email verified
      await tx.user.update({
        where: { id: superAdminUser.user.id },
        data: { emailVerified: true },
      });

      // ✅ Create admin profile
      await tx.admin.create({
        data: {
          userId: superAdminUser.user.id,
          name: "Super Admin",
          email: envVars.SUPER_ADMIN_EMAIL,
        },
      });
    });

    // 🔹 Final fetch
    const superAdmin = await prisma.admin.findUnique({
      where: {
        email: envVars.SUPER_ADMIN_EMAIL,
      },
      include: {
        user: true,
      },
    });

    console.log("🎉 Super Admin Created Successfully:");
    console.dir(superAdmin, { depth: null });

  } catch (error: any) {
    console.error("❌ Error seeding super admin:", error.message);

    // 🔥 SAFE CLEANUP (only if partially created)
    try {
      await prisma.admin.deleteMany({
        where: {
          email: envVars.SUPER_ADMIN_EMAIL,
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: envVars.SUPER_ADMIN_EMAIL,
        },
      });

      console.log("🧹 Cleanup completed");
    } catch (cleanupError) {
      console.error("⚠️ Cleanup failed:", cleanupError);
    }
  }
};