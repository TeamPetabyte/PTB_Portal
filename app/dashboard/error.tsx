"use client";

/**
 * Error boundary for /dashboard/* — mostly hit when the internal Postgres
 * server is unreachable. Shows a friendly explanation instead of a hang.
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="ui errpage">
      <div className="errcard">
        <div className="erric">⚠️</div>
        <div className="errt">Couldn&apos;t load the portal</div>
        <p className="errp">
          Your sign-in is fine — the portal just couldn&apos;t reach its database.
          It may be a network hiccup or the internal server being unavailable.
          Try again in a moment; if it keeps happening, tell IT.
        </p>
        <button className="am-btn am-btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
