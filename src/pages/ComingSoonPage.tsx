import { BodyLong, Button, Heading, Tag } from "@navikt/ds-react";
import { ArrowLeftIcon, HourglassIcon } from "@navikt/aksel-icons";
import type { NavItem } from "../lib/navigation";

export function ComingSoonPage({ page }: { page: NavItem }) {
  return (
    <article className="ep-page ep-page--narrow">
      <Tag size="small" variant="moderate" data-color="warning" icon={<HourglassIcon aria-hidden />}>
        Under arbeid
      </Tag>
      <Heading level="1" size="xlarge" className="ep-page__title" spacing>
        {page.label}
      </Heading>
      <BodyLong size="large" spacing>
        {page.description}
      </BodyLong>
      <BodyLong spacing>Denne siden er ikke skrevet ennå. Den kommer i en av de neste versjonene av portalen.</BodyLong>
      <Button as="a" href="/" variant="secondary" size="small" icon={<ArrowLeftIcon aria-hidden />}>
        Til oversikten
      </Button>
    </article>
  );
}

export function NotFoundPage() {
  return (
    <article className="ep-page ep-page--narrow">
      <Heading level="1" size="xlarge" spacing>
        Fant ikke siden
      </Heading>
      <BodyLong spacing>Lenken kan være feil, eller siden kan ha blitt flyttet.</BodyLong>
      <Button as="a" href="/" variant="secondary" size="small" icon={<ArrowLeftIcon aria-hidden />}>
        Til oversikten
      </Button>
    </article>
  );
}
