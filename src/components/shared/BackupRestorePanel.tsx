import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  MAX_LOCAL_BACKUP_BYTES,
  parseLocalBackup,
  serializeLocalBackup,
  type BackupState,
  type ParsedLocalBackup,
} from "../../app/local_backup";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { listRecoveryArchives } from "../../app/startup_recovery";

const download = (content: string, prefix: string) => {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
};

export function BackupRestorePanel({
  currentState,
  onRestore,
  restoreBlockedReason,
  recoveryCopy,
  archiveStorageKey,
}: {
  currentState: BackupState;
  onRestore: (
    raw: BackupState,
  ) =>
    | { ok: boolean; message?: string }
    | Promise<{ ok: boolean; message?: string }>;
  restoreBlockedReason?: string;
  recoveryCopy?: { content: string; label: string };
  archiveStorageKey?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const readRequest = useRef(0);
  const mounted = useRef(true);
  const restoringRef = useRef(false);
  const [preview, setPreview] = useState<{
    backup: ParsedLocalBackup;
    name: string;
  } | null>(null);
  const [reading, setReading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recoveryCopyRequested, setRecoveryCopyRequested] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [previousRecords, setPreviousRecords] = useState<Array<{ key: string; archivedAt: string; content: string }>>([]);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    if (!archiveStorageKey) return;
    try {
      const result = listRecoveryArchives({ storage: window.localStorage, key: archiveStorageKey });
      setPreviousRecords(result.archives);
      setArchiveError(result.status === "error" ? result.message : "");
    } catch {
      setArchiveError("Previous local records could not be read in this browser.");
    }
  }, [archiveStorageKey]);

  // A previously downloaded copy no longer protects edits made after that copy.
  useEffect(() => {
    setRecoveryCopyRequested(false);
    setConfirmed(false);
  }, [currentState, recoveryCopy?.content]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      readRequest.current += 1;
    };
  }, []);

  const exportCurrent = (beforeRestore = false) => {
    if (restoringRef.current) return;
    try {
      download(
        recoveryCopy?.content ?? serializeLocalBackup(currentState),
        recoveryCopy
          ? "bodypilot-original-recovery-copy"
          : beforeRestore
            ? "bodypilot-before-restore"
            : "bodypilot-backup",
      );
      setError("");
      setNotice(
        "Download requested. Check that the JSON file is saved somewhere you can find before relying on this copy.",
      );
      if (beforeRestore) setRecoveryCopyRequested(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This tab could not create a backup. Your data has not changed.",
      );
    }
  };

  const readFile = async (file: File) => {
    if (restoringRef.current) return;
    const request = ++readRequest.current;
    setPreview(null);
    setConfirmed(false);
    setRecoveryCopyRequested(false);
    setError("");
    setNotice("");
    setReading(true);
    try {
      if (file.size > MAX_LOCAL_BACKUP_BYTES)
        throw new Error(
          "This backup is too large. The maximum supported size is 8 MB.",
        );
      const backup = parseLocalBackup(await file.text());
      if (request === readRequest.current)
        setPreview({ backup, name: file.name });
    } catch (cause) {
      if (request === readRequest.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "This file could not be read. Your current data has not changed.",
        );
    } finally {
      if (request === readRequest.current) setReading(false);
    }
  };

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-semibold">Backup & restore</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Keep a portable copy of your food, meals, workouts, measurements,
            split, and settings. Data is saved on this device; this is not cloud
            sync.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Backup files are not encrypted and include personal fitness data.
            Store them privately. Only restore files you trust.
          </p>
          {recoveryCopy ? (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Saved data could not be loaded. Export keeps its original contents
              for recovery. {recoveryCopy.label}
            </p>
          ) : null}
        </div>
        {previousRecords.length > 0 ? <details className="rounded-xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-medium">Previous local records ({previousRecords.length})</summary>
          <p className="my-3 text-xs text-slate-400">Original records kept when you started fresh. Download a copy for recovery or repair; these files do not change your current workspace.</p>
          <div className="grid gap-2">
            {previousRecords.map(record => <Button key={record.key} variant="outline" className="min-h-11" onClick={() => {
              try {
                download(record.content, "bodypilot-previous-local-record");
                setNotice("Download requested. Check your downloads for the original local record.");
              } catch { setError("The original local record could not be downloaded. It remains stored on this device."); }
            }}>Download original · {new Date(record.archivedAt).toLocaleString()}</Button>)}
          </div>
        </details> : null}
        {archiveError ? <p role="status" className="text-xs text-amber-200">{archiveError}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="min-h-11 gap-2"
            disabled={restoring}
            onClick={() => exportCurrent()}
          >
            <Download className="h-4 w-4" aria-hidden="true" />{" "}
            {recoveryCopy ? "Export original recovery copy" : "Export backup"}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 gap-2"
            disabled={reading || restoring || Boolean(restoreBlockedReason)}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />{" "}
            {reading ? "Reading file…" : "Choose backup to restore"}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Choose BodyPilot backup file"
            tabIndex={-1}
            disabled={restoring || Boolean(restoreBlockedReason)}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void readFile(file);
            }}
          />
        </div>
        {restoring ? (
          <p role="status" aria-live="polite" className="text-sm text-sky-200">
            Restoring and saving… Keep this tab open.
          </p>
        ) : null}
        {restoreBlockedReason ? (
          <p
            role="alert"
            className="text-sm text-amber-700 dark:text-amber-200"
          >
            {restoreBlockedReason}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            {notice}
          </p>
        ) : null}
        {preview ? (
          <section
            aria-label="Backup restore preview"
            className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"
          >
            <div className="min-w-0">
              <h3 className="font-semibold">Review before replacing data</h3>
              <p className="mt-1 break-all text-sm">{preview.name}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {preview.backup.source === "versioned"
                  ? `Backup format ${preview.backup.version} · State version 4`
                  : "Legacy tab copy · State version 4 · Export date unknown"}
                {preview.backup.exportedAt
                  ? ` · Exported ${new Date(preview.backup.exportedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              {preview.backup.counts.map((count) => (
                <div key={count.label}>
                  <dt className="text-slate-500 dark:text-slate-400">
                    {count.label}
                  </dt>
                  <dd className="mt-1 text-base font-semibold">
                    {count.count.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Restoring replaces this device's current data with this file. It
              does not merge records. Previewing has not changed anything.
            </p>
            <Button
              variant="outline"
              className="min-h-11 !h-auto whitespace-normal py-2"
              disabled={restoring || Boolean(restoreBlockedReason)}
              onClick={() => exportCurrent(true)}
            >
              {recoveryCopy
                ? "Download original saved data before restore"
                : "Download current data before restore"}
            </Button>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={confirmed}
                disabled={
                  restoring ||
                  !recoveryCopyRequested ||
                  Boolean(restoreBlockedReason)
                }
                onChange={(event) => setConfirmed(event.currentTarget.checked)}
              />
              <span>
                I saved the{" "}
                {recoveryCopy ? "original recovery" : "current-data"} copy and
                understand that restoring replaces the data on this device.
              </span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={restoring}
                onClick={() => {
                  readRequest.current += 1;
                  setPreview(null);
                  setConfirmed(false);
                  setRecoveryCopyRequested(false);
                  setError("");
                }}
              >
                Cancel restore
              </Button>
              <Button
                className="min-h-11 !h-auto whitespace-normal bg-rose-700 py-2 text-white hover:bg-rose-800"
                disabled={
                  restoring ||
                  !confirmed ||
                  !recoveryCopyRequested ||
                  Boolean(restoreBlockedReason)
                }
                onClick={async () => {
                  if (
                    restoringRef.current ||
                    !confirmed ||
                    !recoveryCopyRequested ||
                    restoreBlockedReason
                  )
                    return;
                  restoringRef.current = true;
                  setRestoring(true);
                  setError("");
                  setNotice("");
                  try {
                    const result = await onRestore(preview.backup.state);
                    if (!mounted.current) return;
                    if (!result.ok) {
                      setError(
                        result.message ||
                          "Restore did not complete. Your current data has not changed.",
                      );
                      return;
                    }
                    setPreview(null);
                    setConfirmed(false);
                    setRecoveryCopyRequested(false);
                    setError("");
                    setNotice(
                      result.message ||
                        "Backup restored and saved on this device. Keep the pre-restore copy if you need to return to your previous data.",
                    );
                  } catch (cause) {
                    if (!mounted.current) return;
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Restore did not complete. Your current data has not changed.",
                    );
                  } finally {
                    restoringRef.current = false;
                    if (mounted.current) setRestoring(false);
                  }
                }}
              >
                {restoring
                  ? "Saving restored backup…"
                  : "Replace data with this backup"}
              </Button>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
