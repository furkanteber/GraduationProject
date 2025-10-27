"use client";
import * as React from "react"
import {
  IconAi,
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconNotes,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link  from "next/link"

const data = {
  user: {
    name: "Furkan Teber",
    email: "info@furkanteber.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Ana Sayfa",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Analizler",
      url: "/admin/analyses",
      icon: IconListDetails,
    },
    {
      title: "Notlarım",
      url: "/admin/notes",
      icon: IconNotes,
    },
    {
      title: "Geçmiş Mülakatlar",
      url: "/admin/pastinterviews",
      icon: IconFolder,
    },
    {
      title: "Yardım & Destek",
      url: "/admin/help",
      icon: IconHelp,
    },
    {
      title: "İpuçları & Eğitim",
      url: "/admin/hints-education",
      icon: IconAi,
    },
    {
      title: "Diğer Adaylar",
      url: "/admin/other-candidates",
      icon: IconUsers,
    },  
  ],
  navClouds: [
    {
      title: "İpuçları & Eğitim",
      icon: IconCamera,
      isActive: true,
      url: "/admin#",
      items: [
        {
          title: "Active Proposals",
          url: "/admin#",
        },
        {
          title: "Archived",
          url: "/admin#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "/admin#",
      items: [
        {
          title: "Active Proposals",
          url: "/admin#",
        },
        {
          title: "Archived",
          url: "/admin#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "/admin#",
      items: [
        {
          title: "Active Proposals",
          url: "/admin#",
        },
        {
          title: "Archived",
          url: "/admin#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Ayarlar",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/admin#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/admin#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/admin#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "/admin#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "/admin#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">TeberSoft</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
