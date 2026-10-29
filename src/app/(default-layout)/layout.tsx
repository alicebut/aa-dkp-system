import "@/shared/lib/valibot";
import Image from "next/image";
import Link from "next/link";
import { SidebarProvider, Toaster } from "@/shared/ui";
import { getSessionUserId } from "@/actions/getSessionUserId";
import { hasTag } from "@/actions/hasTag";
import { canOpenCouncilChecklist } from "@/server/councilAccess";
import { canSeeHealcount } from "@/server/healcount";
import { SCANNER_USER_TAGS } from "@/server/scanner/auth";
import { getActivePromoLink } from "@/server/promo";
import AppSidebar from "@/widgets/sidebar";
import MobileNav from "@/widgets/sidebar/MobileNav";
import { HeartbeatTracker } from "@/widgets/sidebar/HeartbeatTracker";
import { SessionGuard } from "@/widgets/sidebar/SessionGuard";
import { GuildLocationBadge } from "@/widgets/sidebar/GuildLocationBadge";
import { OnlineUsersWidget } from "@/widgets/sidebar/OnlineUsersWidget";
import { EventNotifications } from "@/widgets/EventNotifications/EventNotifications";
import AnniversaryBalloons from "@/widgets/AnniversaryBalloons/AnniversaryBalloons";
import HeaderClocks from "@/widgets/HeaderClocks";
import NotificationCenter from "@/widgets/NotificationCenter";
import UserMenu from "@/widgets/UserMenu";
import { cookies } from "next/headers";

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore?.get("session_token")?.value ?? "";
  const sidebarOpen = cookieStore?.get("sidebar_state")?.value !== "false";
  const isAdmin = await hasTag(sessionToken, ["Администратор"]);
  const canUseScanner = await hasTag(sessionToken, SCANNER_USER_TAGS);
  const canSeeHeals = canSeeHealcount(await getSessionUserId());
  const isRealAdmin = await hasTag(sessionToken, ["Администратор"], {
    ignorePreview: true,
  });
  const viewingAsRegular = isRealAdmin && !isAdmin;
  const canSeeCouncil = await canOpenCouncilChecklist();
  const promo = await getActivePromoLink();
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <HeartbeatTracker />
      <SessionGuard />
      <EventNotifications />
      <AnniversaryBalloons placement="floating" />
      <div className="flex w-full bg-background text-foreground [--app-header:3.5rem]">
        <AppSidebar
          isAdmin={isAdmin}
          canUseScanner={canUseScanner}
          canSeeHealcount={canSeeHeals}
          locationBadge={<GuildLocationBadge />}
          locationIcon={<GuildLocationBadge variant="icon" />}
          promo={promo}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 h-(--app-header) border-b bg-background/95 px-4 backdrop-blur sm:px-8">
            <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-2.5">
              <Link
                href="/"
                className="flex min-w-0 flex-1 items-center gap-2.5 md:hidden"
              >
                <Image
                  src="/images/logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                />
                <span className="truncate text-lg font-bold text-primary">
                  No Fear
                </span>
              </Link>
              <GuildLocationBadge variant="compact" className="md:hidden" />
              <div className="hidden md:block">
                <HeaderClocks />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="hidden md:block">
                  <OnlineUsersWidget />
                </div>
                <NotificationCenter isAdmin={isAdmin} />
                <UserMenu
                  isRealAdmin={isRealAdmin}
                  viewingAsRegular={viewingAsRegular}
                  canSeeCouncil={canSeeCouncil}
                />
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 pt-6 pb-28 sm:px-8 md:p-8">
            {children}
            <Toaster
              richColors
              mobileOffset={{
                bottom: "calc(5rem + env(safe-area-inset-bottom))",
              }}
            />
          </main>
        </div>
      </div>
      <MobileNav
        isAdmin={isAdmin}
        canUseScanner={canUseScanner}
        canSeeHealcount={canSeeHeals}
        promo={promo}
      />
    </SidebarProvider>
  );
}
