"use client";

import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <div className="ui errpage">
      <div className="errcard">
        <div className="erric">⚠️</div>
        <div className="errt">{t("err.title")}</div>
        <p className="errp">{t("err.note")}</p>
        <button className="am-btn am-btn-primary" onClick={() => reset()}>
          {t("err.retry")}
        </button>
      </div>
    </div>
  );
}
