import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/orgs";

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

/** Get the signed-in user or redirect to /login. */
export async function requireUser(): Promise<AppUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
}

/** Get the user together with their primary organization id. */
export async function requireUserAndOrg(): Promise<{ user: AppUser; orgId: string }> {
  const user = await requireUser();
  const orgId = await getActiveOrgId(user.id);
  return { user, orgId };
}
