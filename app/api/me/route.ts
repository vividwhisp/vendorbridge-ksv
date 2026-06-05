import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "../../lib/api-helper";
import { getUserFromRequest } from "../../lib/server-api-helper";
import { normalizeRole } from "../../lib/rbac";

export async function GET(request: Request) {
  try {
    const me = await getUserFromRequest(request);
    const profile = await prisma.profile.findUnique({ where: { userId: me.id } });
    return NextResponse.json({
      id: me.id,
      email: me.email,
      role: normalizeRole(profile?.role),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
