const { PrismaClient } = require("@prisma/client");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run admin:promote -- user@example.com");
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: { email: true, username: true, role: true },
    });
    console.log(`Promoted ${user.username} (${user.email}) to ${user.role}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
