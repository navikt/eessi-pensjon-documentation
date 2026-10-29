import { useEffect, useState, type ReactElement } from "react";
import { Tooltip } from "@navikt/ds-react";
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  MenuHamburgerIcon,
  PadlockLockedIcon,
  XMarkIcon,
} from "@navikt/aksel-icons";
import { NAV_SECTIONS, isActive, type NavItem } from "../lib/navigation";
import { usePathname } from "../lib/router";
import { isDesktop, toggleCollapsed, useCollapsed, useDesktop } from "../lib/sidebar";
import type { UserState } from "../lib/user";
import { UserMenu } from "./UserMenu";

/** Twelve stars in a ring, a quiet nod to the EU flag. The ring turns on hover. */
export function BrandMark({ className }: { className?: string }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { cx: 16 + Math.cos(a) * 8, cy: 16 + Math.sin(a) * 8 };
  });
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" className="ep-brand__tile" />
      <g className="ep-brand__ring">
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx.toFixed(2)} cy={d.cy.toFixed(2)} r="1.55" className="ep-brand__star" />
        ))}
      </g>
    </svg>
  );
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Wraps the element in a tooltip only in the icon rail, where labels are hidden. */
function RailTip({ rail, content, children }: { rail: boolean; content: string; children: ReactElement }) {
  return rail ? (
    <Tooltip content={content} placement="right">
      {children}
    </Tooltip>
  ) : (
    children
  );
}

function hint(item: NavItem): string {
  if (item.external) return `${item.label} (åpnes i ny fane)`;
  if (item.comingSoon) return `${item.label} · kommer snart`;
  if (item.requiresLogin) return `${item.label} · krever innlogging`;
  return item.label;
}

export function Sidebar({ user }: { user: UserState }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const collapsed = useCollapsed();
  const desktop = useDesktop();
  // The icon-only rail only exists on wide screens; the mobile menu is unaffected.
  const rail = collapsed && desktop;

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  // ⌘B / Ctrl+B toggles the rail, like in most editors.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "b" &&
        !event.isComposing &&
        isDesktop() &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        if (!event.repeat) toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <aside className="ep-sidebar" data-open={open} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <Tooltip
        content={collapsed ? "Vis sidemeny" : "Skjul sidemeny"}
        keys={[isMac ? "⌘" : "Ctrl", "B"]}
        placement="right"
      >
        <button
          type="button"
          className="ep-sidebar__collapse"
          aria-expanded={!collapsed}
          aria-controls="ep-sidebar-panel"
          onClick={toggleCollapsed}
        >
          <ChevronLeftIcon aria-hidden />
        </button>
      </Tooltip>

      <div className="ep-sidebar__top">
        <RailTip rail={rail} content="EESSI Pensjon · Oversikt">
          <a href="/" className="ep-brand">
            <BrandMark className="ep-brand__mark" />
            <span className="ep-brand__text">
              <span className="ep-brand__name">EESSI Pensjon</span>
              <span className="ep-brand__sub">Dokumentasjon · Nav</span>
            </span>
          </a>
        </RailTip>
        <button
          type="button"
          className="ep-sidebar__toggle"
          aria-expanded={open}
          aria-controls="ep-sidebar-panel"
          aria-label={open ? "Lukk meny" : "Åpne meny"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <XMarkIcon aria-hidden /> : <MenuHamburgerIcon aria-hidden />}
        </button>
      </div>

      <div id="ep-sidebar-panel" className="ep-sidebar__panel">
        <nav aria-label="Hovedmeny" className="ep-sidebar__nav">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.heading ?? i} className="ep-sidebar__section">
              {section.heading && <div className="ep-sidebar__heading">{section.heading}</div>}
              <ul className="ep-sidebar__list">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <RailTip rail={rail} content={hint(item)}>
                        <a
                          href={item.href}
                          className={"ep-sidebar__link" + (active ? " ep-sidebar__link--active" : "")}
                          aria-current={active ? "page" : undefined}
                          {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        >
                          <item.Icon aria-hidden className="ep-sidebar__icon" />
                          <span className="ep-sidebar__label">{item.label}</span>
                          {item.external && (
                            <ExternalLinkIcon title="åpnes i ny fane" className="ep-sidebar__trail" />
                          )}
                          {item.comingSoon && <span className="ep-sidebar__soon">Snart</span>}
                          {item.requiresLogin && (
                            <PadlockLockedIcon title="krever innlogging" className="ep-sidebar__trail" />
                          )}
                        </a>
                      </RailTip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <UserMenu state={user} compact={rail} />
      </div>
    </aside>
  );
}
