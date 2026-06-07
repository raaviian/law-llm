import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getInvitationByToken } from "@/lib/invites";
import { acceptInvite } from "@/lib/actions";
import { Button, Card, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { Logo } from "@/components/brand";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/invite/${token}`);

  const invite = await getInvitationByToken(token);
  const userEmail = session.user.email ?? "";

  let body: React.ReactNode;
  if (!invite || invite.status === "revoked") {
    body = <Message text="This invitation link is invalid or has been revoked." />;
  } else if (invite.status === "accepted") {
    body = (
      <Message text="This invitation has already been accepted." action="dashboard" />
    );
  } else if (new Date(invite.expires_at) < new Date()) {
    body = <Message text="This invitation has expired. Ask for a new one." />;
  } else if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    body = (
      <div className="text-center">
        <p className="text-sm text-foreground">
          This invitation is for <strong>{invite.email}</strong>, but you&apos;re
          signed in as <strong>{userEmail}</strong>.
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: `/login?callbackUrl=/invite/${token}` });
          }}
          className="mt-4"
        >
          <Button type="submit" variant="secondary">
            Sign in with a different account
          </Button>
        </form>
      </div>
    );
  } else {
    body = (
      <div className="text-center">
        <p className="text-sm text-muted">You&apos;ve been invited to join</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {invite.org_name}
        </p>
        <p className="mt-1 text-sm text-muted">
          as a <span className="capitalize">{invite.role}</span>
        </p>
        <form action={acceptInvite.bind(null, token)} className="mt-6">
          <SubmitButton pendingText="Joining…" className="w-full">
            Accept invitation
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        {body}
      </Card>
    </div>
  );
}

function Message({
  text,
  action,
}: {
  text: string;
  action?: "dashboard";
}) {
  return (
    <div className="text-center">
      <p className="text-sm text-foreground">{text}</p>
      <div className="mt-4">
        <LinkButton href={action === "dashboard" ? "/dashboard" : "/"}>
          {action === "dashboard" ? "Go to dashboard" : "Back to home"}
        </LinkButton>
      </div>
    </div>
  );
}
