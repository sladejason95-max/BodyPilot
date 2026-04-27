import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { BodyPilotLogo } from "./brand";

type SidebarItem = {
  id: string;
  label: string;
  helper: string;
  stat?: string;
  Icon: React.ComponentType<any>;
  onSelect: () => void;
  active?: boolean;
};

type SidebarGroup = {
  id: string;
  label: string;
  description?: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
};

type WorkspaceSidebarProps = {
  title: string;
  subtitle: string;
  modeLabel: string;
  groups: SidebarGroup[];
  footer?: React.ReactNode;
};

export default function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const { title, subtitle, modeLabel, groups, footer } = props;
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, group.defaultOpen ?? true]))
  );

  React.useEffect(() => {
    setOpenGroups((prev) =>
      groups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.id] = prev[group.id] ?? group.defaultOpen ?? true;
        return acc;
      }, {})
    );
  }, [groups]);

  return (
    <aside className="premium-sidebar p-3.5">
      <div className="space-y-3.5">
        {title || subtitle ? (
          <div className="border-b border-slate-200/60 pb-3.5 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <BodyPilotLogo size="sm" showWordmark={false} />
                {title ? (
                  <div className="mt-3 text-lg font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</div>
                ) : null}
                {subtitle ? <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px] font-semibold">
                {modeLabel}
              </Badge>
            </div>
          </div>
        ) : null}

        {groups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          return (
            <section
              key={group.id}
              className="space-y-2.5"
            >
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !isOpen }))}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/50 dark:hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{group.label}</div>
                  {group.description ? (
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{group.description}</p>
                  ) : null}
                </div>
                <div className="shrink-0 rounded-full border border-slate-200 bg-white/70 p-1.5 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </button>

              {isOpen ? (
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onSelect}
                      className={[
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-[1px]",
                        item.active
                          ? "sidebar-item-active shadow-sm"
                          : "border-transparent bg-white/46 text-slate-700 shadow-sm hover:border-slate-200 hover:bg-white dark:bg-white/[0.035] dark:text-slate-100 dark:hover:border-white/12 dark:hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                          item.active
                            ? "sidebar-icon-active"
                            : "border-slate-200/70 bg-white/80 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100",
                        ].join(" ")}
                      >
                        <item.Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <div className="truncate text-sm font-semibold tracking-normal">{item.label}</div>
                          {item.stat ? (
                            <div
                              className={[
                                "inline-flex max-w-full self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                item.active
                                  ? "sidebar-stat-active"
                                  : "border-slate-200/70 bg-white/72 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300",
                              ].join(" ")}
                            >
                              <span className="truncate">{item.stat}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className={["mt-1 text-xs leading-5", item.active ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"].join(" ")}>
                          {item.helper}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        {footer ? <div>{footer}</div> : null}
      </div>
    </aside>
  );
}
