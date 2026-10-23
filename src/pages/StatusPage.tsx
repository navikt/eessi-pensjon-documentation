import { BodyLong, Heading, Link } from "@navikt/ds-react";
import { ApiStatus } from "../components/ApiStatus";

export function StatusPage() {
  return (
    <article className="ep-page ep-page--narrow">
      <Heading level="1" size="xlarge" spacing>
        Systemstatus
      </Heading>
      <BodyLong spacing>
        Portalen henter data fra <code>eessi-pensjon-documentation-api</code>. Frontenden veksler
        innloggingstokenet ditt til et on-behalf-of-token via Texas før kallet sendes videre, så en grønn
        status betyr at hele kjeden — Wonderwall, tokenveksling og API — virker.
      </BodyLong>
      <ApiStatus />
      <BodyLong className="ep-page__footnote" size="small">
        Les mer om{" "}
        <Link href="https://doc.nais.io/auth/entra-id/" target="_blank" rel="noreferrer">
          Entra ID på NAIS
        </Link>
        .
      </BodyLong>
    </article>
  );
}
