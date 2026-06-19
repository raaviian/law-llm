"use client";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 16 characters", test: (v) => v.length >= 16 },
  { label: "A symbol (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: "A number", test: (v) => /[0-9]/.test(v) },
  { label: "Upper- and lower-case letters", test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v) },
];

const LEVELS = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Good", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
];

/** Live password strength feedback shown under the sign-up password field. */
export function PasswordStrengthMeter({ value }: { value: string }) {
  const met = RULES.map((r) => r.test(value));
  const score = met.filter(Boolean).length; // 0–4
  const level = value ? LEVELS[score] : null;

  return (
    <div className="space-y-2">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={RULES.length}
        aria-valuenow={score}
      >
        {RULES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              value && i < score ? level?.bar : "bg-foreground/10",
            )}
          />
        ))}
      </div>
      {level && (
        <p className={cn("text-xs font-medium", level.text)}>
          Strength: {level.label}
        </p>
      )}
      <ul className="space-y-1">
        {RULES.map((r, i) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              met[i] ? "text-emerald-600 dark:text-emerald-400" : "text-muted",
            )}
          >
            <CheckIcon
              className={cn("h-3.5 w-3.5", met[i] ? "opacity-100" : "opacity-30")}
            />
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
