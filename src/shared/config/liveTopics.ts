export const LIVE_TOPICS = [
  "respawn",
  "maintenance",
  "raidSuggestions",
  "raids",
  "loot",
  "lootRequests",
  "notifications",
  "finance",
  "members",
  "council",
] as const;

export type LiveTopic = (typeof LIVE_TOPICS)[number];
