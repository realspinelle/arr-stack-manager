import { useEffect, useState } from "react";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilSquareIcon,
    ArrowPathIcon,
    ForwardIcon,
} from "@heroicons/react/24/outline";
import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";

interface Task {
    id: number;
    name: string;
    cron: string;
    enabled: boolean;
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

function humanCron(cron: string) {
    try {
        return cronstrue.toString(cron, { verbose: false });
    } catch {
        return "Invalid cron";
    }
}

function getNextRun(cron: string): string {
    try {
        const interval = CronExpressionParser.parse(cron);
        const next = interval.next().toDate();

        const now = new Date();
        const diffMs = next.getTime() - now.getTime();

        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return `in ${diffSecs}s`;
        if (diffMins < 60) return `in ${diffMins}m ${diffSecs % 60}s`;
        if (diffHours < 24) return `in ${diffHours}h ${diffMins % 60}m`;
        return `in ${diffDays}d ${diffHours % 24}h`;
    } catch (e) {
        console.error("cron parse error", e);
        return "N/A";
    }
}

function NextRunBadge({ cron, enabled }: { cron: string; enabled: boolean }) {
    const [label, setLabel] = useState(() => getNextRun(cron));

    useEffect(() => {
        if (!enabled) return;

        // Refresh the countdown every second
        const id = setInterval(() => {
            setLabel(getNextRun(cron));
        }, 1000);

        return () => clearInterval(id);
    }, [cron, enabled]);

    if (!enabled) {
        return (
            <span className="flex items-center gap-1 text-xs text-base-content/30 italic">
                <ForwardIcon className="w-3.5 h-3.5" />
                Paused
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1 text-xs text-primary font-mono">
            <ForwardIcon className="w-3.5 h-3.5" />
            Next: {label}
        </span>
    );
}

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (t: Task) => void }) {
    const [editing, setEditing] = useState(false);
    const [cronInput, setCronInput] = useState(task.cron);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);

    const cronValid = (() => {
        try { cronstrue.toString(cronInput); return true; } catch { return false; }
    })();

    async function handleSaveCron() {
        if (!cronValid) return;
        setSaving(true);
        setError(null);
        try {
            const res = await api(`tasks/${task.id}`, {
                method: "PUT",
                body: JSON.stringify({ cron: cronInput }),
            });
            if (res.success) {
                onUpdate({ ...task, cron: cronInput });
                setEditing(false);
            } else {
                setError(res.message ?? "Failed to save.");
            }
        } catch {
            setError("Request failed.");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle() {
        setToggling(true);
        try {
            const res = await api(`tasks/${task.id}`, {
                method: "PUT",
                body: JSON.stringify({ enabled: !task.enabled }),
            });
            if (res.success) onUpdate({ ...task, enabled: !task.enabled });
        } finally {
            setToggling(false);
        }
    }

    return (
        <div className={`card bg-base-200 border transition-colors ${task.enabled ? "border-primary/30" : "border-base-300"}`}>
            <div className="card-body p-4 gap-3">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${task.enabled ? "bg-success animate-pulse" : "bg-base-content/20"}`} />
                        <span className="font-semibold text-sm font-mono">{task.name}</span>
                    </div>
                    <button
                        className={`btn btn-xs gap-1 ${task.enabled ? "btn-error btn-outline" : "btn-success btn-outline"}`}
                        onClick={handleToggle}
                        disabled={toggling}
                    >
                        {toggling ? (
                            <span className="loading loading-spinner loading-xs" />
                        ) : task.enabled ? (
                            <><XCircleIcon className="w-3 h-3" />Disable</>
                        ) : (
                            <><CheckCircleIcon className="w-3 h-3" />Enable</>
                        )}
                    </button>
                </div>

                <div className="divider my-0" />

                {/* Cron row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-base-content/50">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{humanCron(task.cron)}</span>
                        </div>
                        {!editing && (
                            <span className="font-mono text-xs text-base-content/70 bg-base-300 px-2 py-0.5 rounded w-fit">
                                {task.cron}
                            </span>
                        )}
                        {/* Next run */}
                        {!editing && (
                            <NextRunBadge cron={task.cron} enabled={task.enabled} />
                        )}
                    </div>
                    {!editing && (
                        <button
                            className="btn btn-xs btn-ghost gap-1"
                            onClick={() => { setCronInput(task.cron); setEditing(true); setError(null); }}
                        >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    )}
                </div>

                {/* Edit cron */}
                {editing && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                            <input
                                className={`input input-bordered input-sm font-mono flex-1 ${!cronValid && cronInput ? "input-error" : ""}`}
                                value={cronInput}
                                onChange={(e) => setCronInput(e.target.value)}
                                placeholder="*/5 * * * *"
                            />
                            <button
                                className="btn btn-sm btn-primary gap-1"
                                onClick={handleSaveCron}
                                disabled={saving || !cronValid}
                            >
                                {saving ? <span className="loading loading-spinner loading-xs" /> : <ArrowPathIcon className="w-4 h-4" />}
                                Save
                            </button>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => { setEditing(false); setError(null); }}
                            >
                                Cancel
                            </button>
                        </div>
                        {cronInput && (
                            <p className={`text-xs ${cronValid ? "text-success" : "text-error"}`}>
                                {cronValid ? `${humanCron(cronInput)} — ${getNextRun(cronInput)}` : "Invalid cron expression"}
                            </p>
                        )}
                        {error && <p className="text-xs text-error">{error}</p>}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api("tasks")
            .then((data) => { setTasks(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    function handleUpdate(updated: Task) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }

    const enabled = tasks.filter((t) => t.enabled).length;

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-base-content/50 text-sm mt-1">Manage scheduled tasks and their cron expressions.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4 flex-row items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ClockIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tasks.length}</p>
                            <p className="text-xs text-base-content/50">Total Tasks</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4 flex-row items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{enabled}</p>
                            <p className="text-xs text-base-content/50">Active</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4 flex-row items-center gap-3">
                        <div className="p-2 bg-error/10 rounded-lg">
                            <XCircleIcon className="w-5 h-5 text-error" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tasks.length - enabled}</p>
                            <p className="text-xs text-base-content/50">Disabled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-md" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-base-content/40 text-sm">No tasks found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={handleUpdate} />
                    ))}
                </div>
            )}
        </div>
    );
}