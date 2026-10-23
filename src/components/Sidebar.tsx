import { useEffect, useState } from "react";
import { ExternalLinkIcon, MenuHamburgerIcon, XMarkIcon } from "@navikt/aksel-icons";
import { NAV_SECTIONS, isActive } from "../lib/navigation";
import { usePathname } from "../lib/router";
import type { UserState } from "../lib/user";
import { UserMenu } from "./UserMenu";

/** Twelve stars in a ring — a quiet nod to the EU flag. */
export function BrandMark({ className }: { className?: string }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { cx: 16 + Math.cos(a) * 8, cy: 16 + Math.sin(a) * 8 };
  });
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" className="ep-brand__tile" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx.toFixed(2)} cy={d.cy.toFixed(2)} r="1.55" className="ep-brand__star" />
      ))}
    </svg>
  );
}

export function Sidebar({ user }: { user: UserState }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <aside className="ep-sidebar" data-open={open} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <div className="ep-sidebar__top">
        <a href="/" className="ep-brand">
          <BrandMark className="ep-brand__mark" />
          <span className="ep-brand__text">
            <span className="ep-brand__name">EESSI Pensjon</span>
            <span className="ep-brand__sub">Dokumentasjon · Nav</span>
          </span>
        </a>
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
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <UserMenu state={user} />
      </div>
    </aside>
  );
}
