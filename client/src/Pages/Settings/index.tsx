import { useState, useEffect } from "react";
import {
    UserIcon,
    LockClosedIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";

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

export default function Settings() {
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [savingUsername, setSavingUsername] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [alertUsername, setAlertUsername] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [alertPassword, setAlertPassword] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api("settings/account")
            .then((data) => {
                setUsername(data.username ?? "");
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!alertUsername) return;
        const t = setTimeout(() => setAlertUsername(null), 3000);
        return () => clearTimeout(t);
    }, [alertUsername]);

    useEffect(() => {
        if (!alertPassword) return;
        const t = setTimeout(() => setAlertPassword(null), 3000);
        return () => clearTimeout(t);
    }, [alertPassword]);

    async function handleSaveUsername() {
        if (!username.trim()) {
            setAlertUsername({ type: "error", message: "Username cannot be empty." });
            return;
        }
        setSavingUsername(true);
        try {
            const res = await api("settings/account/username", {
                method: "PUT",
                body: JSON.stringify({ username }),
            });
            if (res.success) {
                setAlertUsername({ type: "success", message: "Username updated successfully." });
            } else {
                setAlertUsername({ type: "error", message: res.message ?? "Failed to update username." });
            }
        } catch {
            setAlertUsername({ type: "error", message: "Failed to update username." });
        } finally {
            setSavingUsername(false);
        }
    }

    async function handleSavePassword() {
        if (!currentPassword) {
            setAlertPassword({ type: "error", message: "Please enter your current password." });
            return;
        }
        if (!newPassword) {
            setAlertPassword({ type: "error", message: "Please enter a new password." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setAlertPassword({ type: "error", message: "Passwords do not match." });
            return;
        }
        setSavingPassword(true);
        try {
            const res = await api("settings/account/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (res.success) {
                setAlertPassword({ type: "success", message: "Password updated successfully." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setAlertPassword({ type: "error", message: res.message ?? "Failed to update password." });
            }
        } catch {
            setAlertPassword({ type: "error", message: "Failed to update password." });
        } finally {
            setSavingPassword(false);
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
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-base-content/50 mt-0.5">
                    Manage your account credentials
                </p>
            </div>

            {/* Username */}
            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Username
                </p>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4 space-y-4">
                        {alertUsername && (
                            <div className={`alert ${alertUsername.type === "success" ? "alert-success" : "alert-error"} py-2 text-sm`}>
                                {alertUsername.type === "success" ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                ) : (
                                    <XCircleIcon className="w-4 h-4" />
                                )}
                                <span>{alertUsername.message}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <UserIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Username</p>
                                <p className="text-xs text-base-content/50">
                                    Your login username
                                </p>
                            </div>
                            <input
                                className="input input-bordered input-sm w-80"
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="btn btn-primary btn-sm gap-2"
                                onClick={handleSaveUsername}
                                disabled={savingUsername}
                            >
                                {savingUsername ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <CheckCircleIcon className="w-4 h-4" />
                                )}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password */}
            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Password
                </p>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4 space-y-4">
                        {alertPassword && (
                            <div className={`alert ${alertPassword.type === "success" ? "alert-success" : "alert-error"} py-2 text-sm`}>
                                {alertPassword.type === "success" ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                ) : (
                                    <XCircleIcon className="w-4 h-4" />
                                )}
                                <span>{alertPassword.message}</span>
                            </div>
                        )}

                        {/* Current password */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <LockClosedIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Current Password</p>
                                <p className="text-xs text-base-content/50">
                                    Enter your current password to confirm
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    className="input input-bordered input-sm w-80 pr-8"
                                    type={showCurrent ? "text" : "password"}
                                    placeholder="••••••••••••••••"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                                    onClick={() => setShowCurrent((p) => !p)}
                                >
                                    {showCurrent ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="divider my-0" />

                        {/* New password */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <LockClosedIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">New Password</p>
                                <p className="text-xs text-base-content/50">
                                    Choose a strong new password
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    className="input input-bordered input-sm w-80 pr-8"
                                    type={showNew ? "text" : "password"}
                                    placeholder="••••••••••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                                    onClick={() => setShowNew((p) => !p)}
                                >
                                    {showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="divider my-0" />

                        {/* Confirm password */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-base-200">
                                <LockClosedIcon className="w-5 h-5 text-base-content/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Confirm Password</p>
                                <p className="text-xs text-base-content/50">
                                    Re-enter your new password
                                </p>
                            </div>
                            <div className="relative">
                                <input
                                    className="input input-bordered input-sm w-80 pr-8"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="••••••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                                    onClick={() => setShowConfirm((p) => !p)}
                                >
                                    {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="btn btn-primary btn-sm gap-2"
                                onClick={handleSavePassword}
                                disabled={savingPassword}
                            >
                                {savingPassword ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    <CheckCircleIcon className="w-4 h-4" />
                                )}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
