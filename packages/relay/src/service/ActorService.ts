import type { Bindings } from "@/types";
import { createPrismaClient } from "@/lib/prisma";

export async function listActors(
  limit: number,
  offset: number,
  env: Bindings
) {
  const prisma = createPrismaClient(env.DB);
  try {
    const [actors, total] = await Promise.all([
      prisma.actor.findMany({
        take: limit,
        skip: offset,
        orderBy: { id: "asc" },
      }),
      prisma.actor.count(),
    ]);
    return { actors, total };
  } finally {
    await prisma.$disconnect();
  }
}
