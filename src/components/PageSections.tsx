import { useEffect, useState, type ReactNode } from "react";
import { Heading } from "@navikt/ds-react";

export type JumpItem = { id: string; label: string };

/** Sticky in-page navigation that highlights the section currently in view. */
export function JumpNav({ items }: { items: JumpItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    items.forEach((j) => {
      const el = document.getElementById(j.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="ep-jumpnav" aria-label="På denne siden">
      {items.map((j) => (
        <a key={j.id} href={`#${j.id}`} className="ep-jumpnav__link" aria-current={active === j.id ? "location" : undefined}>
          {j.label}
        </a>
      ))}
    </nav>
  );
}

export function SectionHead({
  eyebrow,
  title,
  titleId,
  lead,
}: {
  eyebrow: string;
  title: string;
  titleId: string;
  lead?: ReactNode;
}) {
  return (
    <div className="ep-arch-section__head">
      <p className="ep-eyebrow">{eyebrow}</p>
      <Heading level="2" size="large" id={titleId}>
        {title}
      </Heading>
      {lead && <p className="ep-arch-section__lead">{lead}</p>}
    </div>
  );
}
