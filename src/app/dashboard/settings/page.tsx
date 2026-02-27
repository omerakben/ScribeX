"use client";

import { useState } from "react";
import { Bell, BookMarked, Globe, Save, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [authorName, setAuthorName] = useState("Ozzy Akben");
  const [institution, setInstitution] = useState("TUEL AI");
  const [defaultJournal, setDefaultJournal] = useState("Nature");
  const [disclosureEnabled, setDisclosureEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <>
      <TopBar
        title="Settings"
        subtitle="Configure workspace defaults, academic preferences, and export behavior."
        showSearch={false}
      />

      <div className="flex flex-1 flex-col overflow-auto px-5 pb-8 pt-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink-950">Profile defaults</h2>
            <p className="mt-1 text-sm text-ink-600">Applied to new manuscripts and export metadata.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800" htmlFor="author-name">
                  Author name
                </label>
                <Input
                  id="author-name"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  className="h-10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800" htmlFor="institution">
                  Institution
                </label>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  className="h-10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800" htmlFor="default-journal">
                  Default target journal
                </label>
                <Input
                  id="default-journal"
                  value={defaultJournal}
                  onChange={(event) => setDefaultJournal(event.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-950">Academic policy controls</h2>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-surface-secondary p-3">
                  <input
                    type="checkbox"
                    checked={disclosureEnabled}
                    onChange={(event) => setDisclosureEnabled(event.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Enable AI contribution reporting</p>
                    <p className="mt-1 text-xs text-ink-500">Track generated and edited spans for disclosure exports.</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-surface-secondary p-3">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(event) => setNotificationsEnabled(event.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Review reminders</p>
                    <p className="mt-1 text-xs text-ink-500">Prompt full-paper review before exporting.</p>
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-950">Workspace status</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                <li className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-mercury-600" />
                  API key loaded and model access enabled
                </li>
                <li className="inline-flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-brand-600" />
                  Citation API configured
                </li>
                <li className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brand-600" />
                  Region: United States
                </li>
                <li className="inline-flex items-center gap-2">
                  <Bell className="h-4 w-4 text-brand-600" />
                  Notifications active
                </li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="gap-2" variant="mercury">
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </div>
      </div>
    </>
  );
}
