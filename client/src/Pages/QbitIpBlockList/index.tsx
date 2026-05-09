import { useEffect, useState } from "react";
import {
    ShieldExclamationIcon,
    CheckCircleIcon,
    XCircleIcon,
    LinkIcon,
    FolderIcon,
} from "@heroicons/react/24/outline";

interface Settings {
    enabled: boolean;
    link: string;
    path: string;
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
    enabled: false,
    link: "",
    path: "",
};

export default function QbitIpBlockList() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        api("qbitipblocklist")
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
            const res = await api("qbitipblocklist", {
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
                    <h1 className="text-2xl font-bold">qBittorrent IP Block List</h1>
                    <p className="text-sm text-base-content/50 mt-0.5">
                        Automatically fetch and apply an IP block list to qBittorrent
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

            {/* Toggle */}
            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    General
                </p>
                <div className={`card bg-base-100 shadow-sm ${settings.enabled ? "border border-primary/30" : ""}`}>
                    <div className="card-body p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${settings.enabled ? "bg-primary/10" : "bg-base-200"}`}>
                                <ShieldExclamationIcon className={`w-5 h-5 ${settings.enabled ? "text-primary" : "text-base-content/50"}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">
                                    {settings.enabled ? "Enabled" : "Disabled"}
                                </p>
                                <p className="text-xs text-base-content/50">
                                    {settings.enabled
                                        ? "IP block list will be fetched and applied automatically"
                                        : "Enable to start fetching and applying the IP block list"}
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={settings.enabled}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Config */}
            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Configuration
                </p>
                <div className={`card bg-base-100 shadow-sm transition-opacity duration-200 ${settings.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="card-body p-4 space-y-4">

                        {/* Link */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <LinkIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Block List URL</p>
                                <p className="text-xs text-base-content/50">
                                    Remote URL to fetch the IP block list from .gz only
                                </p>
                            </div>
                            <input
                                className="input input-bordered input-sm w-80"
                                placeholder="https://example.com/blocklist.dat.gz"
                                value={settings.link}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, link: e.target.value }))
                                }
                            />
                        </div>

                        <div className="divider my-0" />

                        {/* Path */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <FolderIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Local Save Path</p>
                                <p className="text-xs text-base-content/50">
                                    File path where the block list will be saved on disk
                                </p>
                            </div>
                            <input
                                className="input input-bordered input-sm w-80"
                                placeholder="/config/blocklist.dat"
                                value={settings.path}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, path: e.target.value }))
                                }
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
