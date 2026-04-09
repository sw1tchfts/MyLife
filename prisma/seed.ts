import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const tasks = [
  {
    title: "Set up project infrastructure",
    description: "Configure linting, testing, CI/CD, and deployment",
    status: "DONE" as const,
    priority: "HIGH" as const,
  },
  {
    title: "Buy groceries",
    description: "Milk, eggs, bread, chicken, vegetables",
    status: "TODO" as const,
    priority: "MEDIUM" as const,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
  },
  {
    title: "Read chapter 5",
    description: "Finish reading the current book chapter",
    status: "IN_PROGRESS" as const,
    priority: "LOW" as const,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
  },
  {
    title: "Pay electricity bill",
    description: "Due by end of month",
    status: "TODO" as const,
    priority: "HIGH" as const,
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday (overdue)
  },
  {
    title: "Morning workout routine",
    description: "30 min cardio + stretching",
    status: "TODO" as const,
    priority: "MEDIUM" as const,
  },
];

async function main() {
  console.log("Seeding database...");

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`Created ${tasks.length} tasks.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
