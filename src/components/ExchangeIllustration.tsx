import { useId, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "../lib/motion";

/*
 * Hero illustration: Norway in the middle exchanging SEDs with other
 * EESSI countries. Packets travel along the routes with SMIL animateMotion;
 * they are not rendered when the user prefers reduced motion.
 */

const COUNTRIES = [
  { code: "SE", name: "Sverige" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Polen" },
  { code: "DE", name: "Tyskland" },
  { code: "IT", name: "Italia" },
  { code: "ES", name: "Spania" },
  { code: "FR", name: "Frankrike" },
  { code: "NL", name: "Nederland" },
  { code: "DK", name: "Danmark" },
];

const CX = 210;
const CY = 180;

const ROUTES = COUNTRIES.map((country, i) => {
  const angle = ((-90 + (i * 360) / COUNTRIES.length) * Math.PI) / 180;
  const x = CX + Math.cos(angle) * 160;
  const y = CY + Math.sin(angle) * 132;
  const bend = (i % 2 === 0 ? 1 : -1) * 0.2;
  const qx = (CX + x) / 2 - (y - CY) * bend;
  const qy = (CY + y) / 2 + (x - CX) * bend;
  return {
    ...country,
    x,
    y,
    d: `M ${CX} ${CY} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`,
    incoming: i % 2 === 1,
    duration: 2.8 + (i % 3) * 0.6,
    delay: i * 0.45,
  };
});

export function ExchangeIllustration() {
  const reduced = usePrefersReducedMotion();
  const idPrefix = useId().replace(/:/g, "");

  return (
    <svg
      className="ep-exchange"
      viewBox="0 0 420 360"
      role="img"
      aria-label="Illustrasjon: Norge utveksler SED-er med andre europeiske land"
    >
      <circle className="ep-exchange__orbit" cx={CX} cy={CY} r={92} />
      <circle className="ep-exchange__orbit ep-exchange__orbit--outer" cx={CX} cy={CY} r={196} />

      {ROUTES.map((route, i) => {
        const pathId = `${idPrefix}-route-${i}`;
        const timing = { dur: `${route.duration}s`, begin: `${route.delay}s`, repeatCount: "indefinite" };
        return (
          <g
            key={route.code}
            className="ep-exchange__route"
            data-direction={route.incoming ? "in" : "out"}
            style={{ "--i": i } as CSSProperties}
          >
            <title>{`${route.name} (${route.code})`}</title>
            <path id={pathId} className="ep-exchange__link" d={route.d} />
            {!reduced && (
              <circle className="ep-exchange__packet" r={3.5} opacity={0}>
                <animateMotion
                  {...timing}
                  keyPoints={route.incoming ? "1;0" : "0;1"}
                  keyTimes="0;1"
                  calcMode="linear"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate {...timing} attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" />
              </circle>
            )}
            <g className="ep-exchange__node" transform={`translate(${route.x.toFixed(1)} ${route.y.toFixed(1)})`}>
              <g className="ep-exchange__bob">
                <circle r={19} />
                <text dy="0.35em">{route.code}</text>
              </g>
            </g>
          </g>
        );
      })}

      <g className="ep-exchange__home" transform={`translate(${CX} ${CY})`}>
        <circle className="ep-exchange__pulse" r={34} />
        <circle className="ep-exchange__pulse ep-exchange__pulse--late" r={34} />
        <circle className="ep-exchange__core" r={34} />
        <text dy="0.35em">NO</text>
      </g>
    </svg>
  );
}
