"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";

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
        subtitle="Manage your profile and preferences"
        showSearch={false}
      />

      <div className="flex flex-1 flex-col overflow-auto p-8">
        <div className="max-w-4xl w-full mx-auto">

          {/* Card 1: Profile */}
          <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
            <h2 className="text-base font-semibold text-ink-900 mb-4">Profile</h2>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-ink-700 mb-1.5"
                htmlFor="author-name"
              >
                Author name
              </label>
              <input
                id="author-name"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-ink-700 mb-1.5"
                htmlFor="institution"
              >
                Institution
              </label>
              <input
                id="institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium text-ink-700 mb-1.5"
                htmlFor="default-journal"
              >
                Default target journal
              </label>
              <input
                id="default-journal"
                type="text"
                value={defaultJournal}
                onChange={(e) => setDefaultJournal(e.target.value)}
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Card 2: Academic Controls */}
          <div className="bg-white border border-ink-200 rounded-xl p-6 mb-6">
            <h2 className="text-base font-semibold text-ink-900 mb-4">Academic Controls</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclosureEnabled}
                  onChange={(e) => setDisclosureEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/20"
                />
                <div>
                  <p className="text-sm font-medium text-ink-700">Enable AI contribution reporting</p>
                  <p className="mt-0.5 text-xs text-ink-500">Track generated and edited spans for disclosure exports.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/20"
                />
                <div>
                  <p className="text-sm font-medium text-ink-700">Review reminders</p>
                  <p className="mt-0.5 text-xs text-ink-500">Prompt full-paper review before exporting.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Card 3: Workspace Status */}
          <div className="bg-white border border-ink-200 rounded-xl p-6 mb-8">
            <h2 className="text-base font-semibold text-ink-900 mb-4">Workspace Status</h2>

            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-ink-600">API key loaded and model access enabled</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-ink-600">Citation API configured</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-ink-600">Region: United States</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm text-ink-600">Notifications active</span>
              </li>
            </ul>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save settings
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
