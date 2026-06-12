"use client";

import { useActionState } from "react";
import { requestConsultation, type BookingState } from "@/lib/actions";
import { Button, Input, Label } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

const PRACTICE_AREAS = [
  "Litigation & Disputes",
  "Corporate & Commercial",
  "Family Law",
  "Immigration",
  "Intellectual Property",
  "Real Estate",
  "Other",
];

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ConsultationForm() {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    requestConsultation,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
          Request received
        </h3>
        <p className="mt-2 text-sm text-muted">
          Thank you. A member of our team will reach out within one business day
          to schedule your consultation.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" name="name" required placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="jane@email.com" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="practice_area">Practice area</Label>
          <select id="practice_area" name="practice_area" defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select an area…
            </option>
            {PRACTICE_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="preferred_date">Preferred date</Label>
          <Input id="preferred_date" name="preferred_date" type="date" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message">How can we help?</Label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Briefly describe your matter…"
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 text-sm text-red-600">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-5 w-full">
        {pending ? "Sending…" : "Request consultation"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted">
        Submitting this form does not create an attorney–client relationship.
      </p>
    </form>
  );
}
