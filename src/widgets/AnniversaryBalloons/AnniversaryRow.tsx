import { useState } from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/shared/ui";
import { type Anniversary } from "@/actions/anniversaryActions";
import { avatarSrc, plural } from "@/shared/lib/format";

const NAMES_LIMIT = 5;

export default function AnniversaryRow({
  anniversary,
  viewerId,
  onCheer,
  onNavigate,
}: {
  anniversary: Anniversary;
  viewerId: number | null;
  onCheer: (event: React.MouseEvent<HTMLButtonElement>, userId: number) => void;
  onNavigate: () => void;
}) {
  const { userId, username, avatarUrl, years, cheeredBy } = anniversary;
  const isSelf = userId === viewerId;
  const hasCheered = cheeredBy.some((c) => c.id === viewerId);
  const yearsText = `${years} ${plural(years, "год", "года", "лет")} в гильдии`;

  return (
    <div className="flex gap-3 px-4 py-3">
      <Link
        href={`/profile/${userId}`}
        onClick={onNavigate}
        className="shrink-0"
      >
        <Avatar className="size-10">
          <AvatarImage src={avatarSrc(username, avatarUrl)} alt={username} />
          <AvatarFallback>{username.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <Link
            href={`/profile/${userId}`}
            onClick={onNavigate}
            className="block truncate font-medium hover:underline"
          >
            {username}
          </Link>
          <div className="text-xs text-muted-foreground">
            {isSelf ? `Твой юбилей — ${yearsText}!` : yearsText}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={hasCheered ? "outline" : "default"}
            onClick={(e) => onCheer(e, userId)}
          >
            <PartyPopper />
            {hasCheered ? "Ещё ура!" : "Ура!"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {isSelf ? "Тебя поздравили" : "Поздравили"}: {cheeredBy.length}
          </span>
        </div>
        <CheeredByNames cheeredBy={cheeredBy} />
      </div>
    </div>
  );
}

function CheeredByNames({
  cheeredBy,
}: {
  cheeredBy: Anniversary["cheeredBy"];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (cheeredBy.length === 0) return null;

  const shown = isExpanded ? cheeredBy : cheeredBy.slice(0, NAMES_LIMIT);
  const restCount = cheeredBy.length - NAMES_LIMIT;
  const names = shown.map((c) => c.username).join(", ");

  return (
    <div className="text-xs text-muted-foreground">
      {names}
      {restCount > 0 && (
        <>
          {" "}
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((value) => !value)}
            className="cursor-pointer font-medium text-foreground/80 hover:underline"
          >
            {isExpanded ? "свернуть" : `и ещё ${restCount}`}
          </button>
        </>
      )}
    </div>
  );
}
