"use client";

import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Search,
  Settings,
  Plus,
  FolderKanban,
  CheckSquare,
  BarChart2,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import UserMenu from "@/components/UserMenu";

// ─── Nav sections ─────────────────────────────────────────────────────────────

const APPLICATION_ITEMS = [
  { title: "Dashboard",    url: "/",        icon: LayoutDashboard },
  { title: "Search",       url: "/search",  icon: Search },
  { title: "Inbox",        url: "/inbox",   icon: Inbox,        badge: 24 },
];

const WORK_ITEMS = [
  { title: "My Tasks",  url: "/tasks",    icon: CheckSquare },
  { title: "Calendar",  url: "/calendar", icon: CalendarDays },
];

const INSIGHT_ITEMS = [
  { title: "Reports", url: "/reports", icon: BarChart2 },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AppSidebar = () => {
  return (
      <Sidebar collapsible="icon">

        {/* ── Header / Brand ── */}
        <SidebarHeader className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <FolderKanban size={13} className="text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight">ProjectFlow</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>

          {/* ── Application ── */}
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {APPLICATION_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* ── Projects (collapsible) ── */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center">
                  Projects
                  <ChevronDown
                      size={14}
                      className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>

              {/* + New Project action */}
              <SidebarGroupAction asChild>
                <Link href="/projects?new=true" aria-label="New project">
                  <Plus size={14} />
                </Link>
              </SidebarGroupAction>

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="All Projects">
                        <Link href="/projects">
                          <FolderKanban />
                          <span>All Projects</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="New Project">
                        <Link href="/projects?new=true">
                          <Plus />
                          <span>New Project</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          <SidebarSeparator />

          {/* ── Work ── */}
          <SidebarGroup>
            <SidebarGroupLabel>Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {WORK_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* ── Insights ── */}
          <SidebarGroup>
            <SidebarGroupLabel>Insights</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {INSIGHT_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        <SidebarSeparator />

        {/* ── Footer: Settings + User ── */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <UserMenu showName triggerClassName="w-full px-2 py-2 justify-start" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

      </Sidebar>
  );
};

export default AppSidebar;