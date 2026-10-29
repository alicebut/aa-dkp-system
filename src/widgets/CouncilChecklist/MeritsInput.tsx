"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/shared/ui";

type Props = {
  id: string;
  merits: number | null;
  onSave: (merits: number | null) => void;
};

export default function MeritsInput({ id, merits, onSave }: Props) {
  const [draft, setDraft] = useState(merits === null ? "" : String(merits));

  const handleBlur = () => {
    const value = draft.trim() === "" ? null : Number(draft);
    if (value === merits) return;
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      setDraft(merits === null ? "" : String(merits));
      return;
    }
    onSave(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };

  return (
    <Input
      id={id}
      type="number"
      min={0}
      inputMode="numeric"
      className="w-36"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
