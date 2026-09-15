"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchWallet,
  type PendingReleaseBreakdown,
  type WalletLedgerEntry,
} from "@/features/wallet";
import { WalletBalanceOverview } from "@/features/wallet/components/wallet-balance-overview";
import { WalletLedgerSection } from "@/features/wallet/components/wallet-ledger-section";
import { WalletReleaseBreakdown } from "@/features/wallet/components/wallet-release-breakdown";
import { downloadWalletCsv, summarizeLedger } from "@/features/wallet/wallet-ledger-utils";
import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { ApiError } from "@/lib/api/errors";

const EMPTY_RELEASE: PendingReleaseBreakdown = {
  totalCents: 0,
  releasesTodayCents: 0,
  releasesUpcomingCents: 0,
  inDisputeCents: 0,
  holds: [],
};

export function WalletClient() {
  const [balanceCents, setBalanceCents] = useState(0);
  const [entries, setEntries] = useState<WalletLedgerEntry[]>([]);
  const [pendingPayoutCents, setPendingPayoutCents] = useState(0);
  const [pendingRelease, setPendingRelease] = useState<PendingReleaseBreakdown>(EMPTY_RELEASE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWallet();
        if (!cancelled) {
          setBalanceCents(data.balanceCents);
          setEntries(data.entries);
          setPendingPayoutCents(data.pendingPayoutCents);
          setPendingRelease(data.pendingRelease);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar a carteira.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ledgerSummary = useMemo(() => summarizeLedger(entries), [entries]);
  if (loading) {
    return <WalletSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <WalletBalanceOverview
        balanceCents={balanceCents}
        pendingRelease={pendingRelease}
        pendingPayoutCents={pendingPayoutCents}
        movementCount={entries.length}
        creditsCents={ledgerSummary.creditsCents}
        debitsCents={ledgerSummary.debitsCents}
      />

      <WalletReleaseBreakdown
        pendingRelease={pendingRelease}
        pendingPayoutCents={pendingPayoutCents}
      />

      <WalletLedgerSection
        entries={entries}
        balanceCents={balanceCents}
        onExport={() => downloadWalletCsv(balanceCents, entries)}
      />
    </div>
  );
}
