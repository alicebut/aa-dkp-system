"use client";

import Link from "next/link";
import {
  ChevronDown,
  Crown,
  Eye,
  EyeOff,
  LogOut,
  Moon,
  Volume2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarFrame,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { cn } from "@/shared/lib/tw-merge";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSoundNotificationsEnabled } from "@/hooks/useSoundNotificationsEnabled";
import { logout } from "@/actions/logout";
import MenuSwitchItem from "./MenuSwitchItem";
import { useDarkTheme } from "./useDarkTheme";
import { useViewAsPlayer } from "./useViewAsPlayer";

type Props = {
  isRealAdmin: boolean;
  viewingAsRegular: boolean;
  canSeeCouncil: boolean;
};

export default function UserMenu({
  isRealAdmin,
  viewingAsRegular,
  canSeeCouncil,
}: Props) {
  const user = useCurrentUser();
  const theme = useDarkTheme();
  const sound = useSoundNotificationsEnabled();
  const viewAsPlayer = useViewAsPlayer(viewingAsRegular);

  if (!user) {
    return <span className="size-9 shrink-0 rounded-full bg-muted" />;
  }

  const triggerLabel = viewAsPlayer.checked
    ? "Меню профиля · вы смотрите глазами игрока"
    : "Меню профиля";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        title={triggerLabel}
        className="group flex shrink-0 cursor-pointer items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="relative flex transition-transform duration-200 group-hover:scale-110">
          <UserAvatar user={user} className="size-9" />
          {viewAsPlayer.checked && (
            <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-background">
              <EyeOff className="size-2.5" />
            </span>
          )}
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
        <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
          <Link href={`/profile/${user.id}`}>
            <UserAvatar user={user} className="size-10" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground">Мой профиль</span>
            </span>
          </Link>
        </DropdownMenuItem>
        {canSeeCouncil && (
          <DropdownMenuItem asChild className="cursor-pointer py-2">
            <Link href="/council">
              <Crown />
              Путь в совет
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <MenuSwitchItem
          icon={<Moon />}
          label="Тёмная тема"
          checked={theme.isDark}
          onChange={theme.setDark}
        />
        <MenuSwitchItem
          icon={<Volume2 />}
          label="Звук перед боссами"
          checked={sound.enabled}
          onChange={sound.setSoundEnabled}
        />
        {isRealAdmin && (
          <MenuSwitchItem
            icon={<Eye />}
            label="Глазами игрока"
            checked={viewAsPlayer.checked}
            disabled={viewAsPlayer.isPending}
            onChange={viewAsPlayer.toggle}
          />
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => logout()}
          className="cursor-pointer py-2"
        >
          <LogOut />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar({
  user,
  className,
}: {
  user: { name: string; avatar: string; frame: string | null };
  className: string;
}) {
  return (
    <AvatarFrame frameUrl={user.frame}>
      <Avatar className={cn("rounded-full", className)}>
        <AvatarImage src={user.avatar} alt="" />
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      </Avatar>
    </AvatarFrame>
  );
}
