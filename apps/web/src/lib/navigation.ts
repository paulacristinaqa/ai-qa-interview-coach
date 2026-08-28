export interface NavigationItem {
  label: string;
  href: string;
  shortLabel: string;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Coach",
    items: [
      { label: "Dashboard", href: "/dashboard", shortLabel: "DB" },
      { label: "Interviews", href: "/interviews", shortLabel: "IN" },
      { label: "Grill Me", href: "/grill-me", shortLabel: "GM" },
      { label: "Technical Lab", href: "/technical-lab", shortLabel: "TL" },
      { label: "Knowledge Base", href: "/knowledge-base", shortLabel: "KB" },
      { label: "Developer Diary", href: "/developer-diary", shortLabel: "DD" }
    ]
  },
  {
    label: "Career Intelligence",
    items: [
      { label: "Jobs", href: "/career/jobs", shortLabel: "JB" },
      { label: "Applications", href: "/career/applications", shortLabel: "AP" },
      { label: "Companies", href: "/career/companies", shortLabel: "CO" },
      { label: "Evidence", href: "/career/evidence", shortLabel: "EV" },
      { label: "Documents", href: "/career/documents", shortLabel: "DO" }
    ]
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", shortLabel: "ST" }]
  }
];
