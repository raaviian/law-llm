import { requireUserAndOrg } from "@/lib/session";
import { getOrgRole } from "@/lib/access";
import { getOrgAiSettingsSafe } from "@/lib/ai/llm";
import { saveAiSettings, clearAiSettings } from "@/lib/actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const PROVIDERS = [
  { value: "gemini", label: "Google Gemini", example: "gemini-2.5-pro", keys: "aistudio.google.com" },
  { value: "anthropic", label: "Anthropic (Claude)", example: "claude-opus-4-8", keys: "console.anthropic.com" },
  { value: "openai", label: "OpenAI", example: "gpt-4o", keys: "platform.openai.com" },
];

export default async function AiSettingsPage() {
  const { user, orgId } = await requireUserAndOrg();
  const role = await getOrgRole(user.id, orgId);
  const canManage = role === "owner" || role === "admin";
  const settings = await getOrgAiSettingsSafe(orgId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          AI model
        </h1>
        <p className="mt-1 text-base text-muted">
          By default LexBoard uses a shared free model. Connect your own provider
          to use your preferred model (e.g. Claude Opus) on your own account.
        </p>
      </div>

      <Card className="p-6">
        <p className="text-sm text-muted">Currently using</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {settings.configured
            ? `${PROVIDERS.find((p) => p.value === settings.provider)?.label ?? settings.provider}${settings.model ? ` · ${settings.model}` : ""}`
            : "Shared model (Gemini free tier)"}
        </p>
        {settings.configured && canManage && (
          <form action={clearAiSettings} className="mt-4">
            <Button type="submit" variant="secondary" size="sm">
              Reset to shared model
            </Button>
          </form>
        )}
      </Card>

      {canManage ? (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Connect your own model
          </h2>
          <form action={saveAiSettings} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                name="provider"
                defaultValue={settings.provider}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                defaultValue={settings.model}
                placeholder="e.g. claude-opus-4-8 / gpt-4o / gemini-2.5-pro"
              />
            </div>
            <div>
              <Label htmlFor="api_key">API key</Label>
              <Input
                id="api_key"
                name="api_key"
                type="password"
                required
                placeholder={settings.configured ? "•••••••• (enter to replace)" : "Paste your API key"}
                autoComplete="off"
              />
            </div>
            <SubmitButton pendingText="Saving…">Save & use this model</SubmitButton>
          </form>
          <p className="mt-3 text-xs text-muted">
            Keys are encrypted at rest and never shown again or sent to the
            browser. Get a key from your provider:{" "}
            {PROVIDERS.map((p) => p.keys).join(" · ")}. Usage is billed to your
            own account.
          </p>
        </Card>
      ) : (
        <Card className="p-6 text-sm text-muted">
          Only owners and admins can change the AI model.
        </Card>
      )}
    </div>
  );
}
