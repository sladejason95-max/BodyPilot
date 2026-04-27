export const BODY_PILOT_BRAND = {
  name: "BodyPilot",
  shortName: "BP",
  tagline: "Precision coaching for daily execution.",
  productLine: "BodyPilot OS",
} as const;

type BodyPilotLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: {
    mark: "h-8 w-8 text-[11px]",
    name: "text-sm",
    tagline: "text-[10px]",
  },
  md: {
    mark: "h-10 w-10 text-sm",
    name: "text-base",
    tagline: "text-[11px]",
  },
  lg: {
    mark: "h-12 w-12 text-base",
    name: "text-xl",
    tagline: "text-xs",
  },
} as const;

export function BodyPilotLogo(props: BodyPilotLogoProps) {
  const { size = "md", showWordmark = true, className = "" } = props;
  const classes = sizeClasses[size];

  return (
    <div className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <div
        aria-hidden="true"
        className={[
          "bodypilot-logo-mark relative grid shrink-0 place-items-center rounded-[14px] font-black tracking-normal text-white shadow-lg",
          classes.mark,
        ].join(" ")}
      >
        <span className="relative z-10">BP</span>
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <div className={`truncate font-bold tracking-normal text-slate-950 dark:text-slate-100 ${classes.name}`}>
            {BODY_PILOT_BRAND.name}
          </div>
          <div className={`truncate font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 ${classes.tagline}`}>
            {BODY_PILOT_BRAND.tagline}
          </div>
        </div>
      ) : null}
    </div>
  );
}
