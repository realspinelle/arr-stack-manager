import { useEffect, useState } from "react";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    EyeSlashIcon,
    LinkIcon,
    KeyIcon,
} from "@heroicons/react/24/outline";
import { TvIcon, FilmIcon } from "@heroicons/react/24/outline";

interface ArrConfig {
    enabled: boolean;
    url: string;
    apiKey: string;
}

interface Settings {
    stalledTime: string;
    sonarr: ArrConfig;
    radarr: ArrConfig;
}

const api = (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    return fetch(`/api/protected/${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers ?? {}),
        },
    }).then((r) => r.json());
};

const defaultSettings: Settings = {
    stalledTime: "30",
    sonarr: { enabled: false, url: "http://exemple.sonarr:8989", apiKey: "" },
    radarr: { enabled: false, url: "http://exemple.radarr:7878", apiKey: "" },
};

export default function ArrDeadQueueRemover() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [showSonarrKey, setShowSonarrKey] = useState(false);
    const [showRadarrKey, setShowRadarrKey] = useState(false);

    useEffect(() => {
        api("arrdeadqueueremover")
            .then((data) => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => {
                setAlert({ type: "error", message: "Failed to load settings." });
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!alert) return;
        const t = setTimeout(() => setAlert(null), 3000);
        return () => clearTimeout(t);
    }, [alert]);

    async function handleSave() {
        setSaving(true);
        try {
            const res = await api("arrdeadqueueremover", {
                method: "PUT",
                body: JSON.stringify(settings),
            });
            if (res.success) {
                setAlert({ type: "success", message: "Settings saved successfully." });
            } else {
                setAlert({ type: "error", message: res.message ?? "Failed to save settings." });
            }
        } catch {
            setAlert({ type: "error", message: "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    }

    if (loading)
        return (
            <div className="flex items-center justify-center h-48">
                <span className="loading loading-spinner loading-md" />
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Arr Dead Queue Remover</h1>
                    <p className="text-sm text-base-content/50 mt-0.5">
                        Automatically remove stalled items from Sonarr and Radarr queues
                    </p>
                </div>
                <button
                    className="btn btn-primary btn-sm gap-2"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                    )}
                    Save Settings
                </button>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`alert ${alert.type === "success" ? "alert-success" : "alert-error"} py-2 text-sm`}>
                    {alert.type === "success" ? (
                        <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                        <XCircleIcon className="w-4 h-4" />
                    )}
                    <span>{alert.message}</span>
                </div>
            )}

            {/* General */}
            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    General
                </p>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <ClockIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Stalled Time</p>
                                <p className="text-xs text-base-content/50">
                                    Minutes before a stalled item is removed from the queue
                                </p>
                            </div>
                            <input
                                className="input input-bordered input-sm w-28"
                                type="number"
                                min={1}
                                value={settings.stalledTime}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, stalledTime: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sonarr */}
            <ArrSection
                title="Sonarr"
                icon={<TvIcon className={`w-5 h-5 ${settings.sonarr.enabled ? "text-primary" : "text-base-content/50"}`} />}
                config={settings.sonarr}
                showKey={showSonarrKey}
                onToggleShow={() => setShowSonarrKey((p) => !p)}
                onChange={(updated) =>
                    setSettings((prev) => ({ ...prev, sonarr: { ...prev.sonarr, ...updated } }))
                }
            />

            {/* Radarr */}
            <ArrSection
                title="Radarr"
                icon={<FilmIcon className={`w-5 h-5 ${settings.radarr.enabled ? "text-primary" : "text-base-content/50"}`} />}
                config={settings.radarr}
                showKey={showRadarrKey}
                onToggleShow={() => setShowRadarrKey((p) => !p)}
                onChange={(updated) =>
                    setSettings((prev) => ({ ...prev, radarr: { ...prev.radarr, ...updated } }))
                }
            />
        </div>
    );
}

function ArrSection({
    title,
    icon,
    config,
    showKey,
    onToggleShow,
    onChange,
}: {
    title: string;
    icon: React.ReactNode;
    config: ArrConfig;
    showKey: boolean;
    onToggleShow: () => void;
    onChange: (updated: Partial<ArrConfig>) => void;
}) {
    return (
        <div>
            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                {title}
            </p>

            {/* Toggle card */}
            <div className={`card bg-base-100 shadow-sm mb-2 ${config.enabled ? "border border-primary/30" : ""}`}>
                <div className="card-body p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.enabled ? "bg-primary/10" : "bg-base-200"}`}>
                            {icon}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">
                                {config.enabled ? "Enabled" : "Disabled"}
                            </p>
                            <p className="text-xs text-base-content/50">
                                {config.enabled
                                    ? `${title} integration is active`
                                    : `Enable to start removing dead items from ${title}`}
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={config.enabled}
                            onChange={(e) => onChange({ enabled: e.target.checked })}
                        />
                    </div>
                </div>
            </div>

            {/* Config card */}
            <div className={`card bg-base-100 shadow-sm transition-opacity duration-200 ${config.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <div className="card-body p-4 space-y-4">

                    {/* URL */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-base-200">
                            <LinkIcon className="w-5 h-5 text-base-content/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">URL</p>
                            <p className="text-xs text-base-content/50">
                                Base URL of your {title} instance
                            </p>
                        </div>
                        <input
                            className="input input-bordered input-sm w-80"
                            placeholder="http://host:8989"
                            value={config.url}
                            onChange={(e) => onChange({ url: e.target.value })}
                        />
                    </div>

                    <div className="divider my-0" />

                    {/* API Key */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-base-200">
                            <KeyIcon className="w-5 h-5 text-base-content/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">API Key</p>
                            <p className="text-xs text-base-content/50">
                                Found in {title} → Settings → General
                            </p>
                        </div>
                        <div className="relative">
                            <input
                                className="input input-bordered input-sm w-80 pr-8"
                                type={showKey ? "text" : "password"}
                                placeholder="••••••••••••••••"
                                value={config.apiKey}
                                onChange={(e) => onChange({ apiKey: e.target.value })}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                                onClick={onToggleShow}
                            >
                                {showKey ? (
                                    <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                    <EyeIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}