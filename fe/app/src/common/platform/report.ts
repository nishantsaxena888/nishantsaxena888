// Error reporting seam — pluggable sink (Sentry/Bugsnag/OTel) without
// touching engine code. Default sink is console.error; a host app calls
// setReporter() at boot to forward to a real service. Keep the payload
// shape stable so sinks work unchanged across web/native/desktop.

export interface ReportContext {
  // Where it came from — "render:<def.type>", "api:<endpoint>", ...
  source?: string;
  extra?: Record<string, unknown>;
}

export type Reporter = (error: unknown, context: ReportContext) => void;

let reporter: Reporter = (error, context) => {
  console.error(`[report] ${context.source ?? "unknown"}`, error, context.extra ?? {});
};

export function setReporter(next: Reporter) {
  reporter = next;
}

export function reportError(error: unknown, context: ReportContext = {}) {
  try {
    reporter(error, context);
  } catch {
    // A broken reporter must never crash the app it observes.
  }
}
