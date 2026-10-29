"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "councilSoundOn";
const CHANGE_EVENT = "council-sound-change";

export function useCouncilSound() {
  const isSoundOn = useSyncExternalStore(subscribe, readSetting, () => true);

  const setSoundOn = useCallback((value: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { isSoundOn, setSoundOn };
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSetting() {
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}
