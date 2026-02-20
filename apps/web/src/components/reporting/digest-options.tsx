'use client';

import { useMemo, useState } from "react";

const SECTION_LABELS: Record<string, string> = {
  load: "Agent load",
  stuck: "Stuck tasks",
  tasks: "Task status",
  audits: "Audit log"
};

export interface DigestOptionState {
  sections: string[];
  format: "markdown" | "slack";
}

export function DigestOptions({
  defaultSections = ["load", "stuck", "tasks"],
  defaultFormat = "markdown",
  onChange
}: {
  defaultSections?: string[];
  defaultFormat?: DigestOptionState["format"];
  onChange?: (state: DigestOptionState) => void;
}) {
  const [sections, setSections] = useState<string[]>(defaultSections);
  const [format, setFormat] = useState<DigestOptionState["format"]>(defaultFormat);

  const orderedSections = useMemo(() => Object.keys(SECTION_LABELS), []);

  const handleSectionToggle = (section: string) => {
    setSections((prev) => {
      const next = prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section];
      onChange?.({ sections: next, format });
      return next;
    });
  };

  const handleFormatChange = (next: DigestOptionState["format"]) => {
    setFormat(next);
    onChange?.({ sections, format: next });
  };

  return (
    <div className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
      <div className="flex flex-wrap gap-2">
        {orderedSections.map((section) => (
          <button
            key={section}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              sections.includes(section) ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/60 hover:text-white"
            }`}
            onClick={() => handleSectionToggle(section)}
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
        Format
        <select
          value={format}
          onChange={(event) => handleFormatChange(event.target.value as DigestOptionState["format"])}
          className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white focus:border-indigo-300 focus:outline-none"
        >
          <option value="markdown">Markdown</option>
          <option value="slack">Slack</option>
        </select>
      </div>
    </div>
  );
}
