import { useEffect, useState } from "react";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ServerIcon,
    StarIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

interface QbitClient {
    id: number;
    name: string;
    url: string;
    username: string | null;
}

interface FormState {
    name: string;
    url: string;
    username: string;
    password: string;
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

const emptyForm: FormState = { name: "", url: "", username: "", password: "" };

export default function QbitClients() {
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<QbitClient | null>(null);
    const [deletingClient, setDeletingClient] = useState<QbitClient | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [showPassword, setShowPassword] = useState(false);

    const [clients, setClients] = useState<QbitClient[]>([]);
    const [mainId, setMainId] = useState<number | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api("qbit-clients"),
            api("qbit-mirror-settings"),
        ]).then(([clientsData, settings]) => {
            console.log(settings, clientsData)
            setClients(clientsData);
            setMainId(settings.mainId);
            setEnabled(settings.enabled);
            setLoading(false);
        });
    }, []);

    function openAdd() {
        setEditingClient(null);
        setForm(emptyForm);
        setShowPassword(false);
        setModalOpen(true);
    }

    function openEdit(client: QbitClient) {
        setEditingClient(client);
        setForm({
            name: client.name,
            url: client.url,
            username: client.username ?? "",
            password: "",
        });
        setShowPassword(false);
        setModalOpen(true);
    }

    function openDelete(client: QbitClient) {
        setDeletingClient(client);
        setDeleteModalOpen(true);
    }

    async function handleSave() {
        const body = JSON.stringify({
            name: form.name,
            url: form.url,
            username: form.username || null,
            password: form.password || null,
        });

        if (editingClient) {
            const res = await api(`qbit-clients/${editingClient.id}`, {
                method: "PUT",
                body,
            });
            if (res.success) {
                setClients(clients.map((c) =>
                    c.id === editingClient.id ? res.client : c
                ));
            }
        } else {
            const res = await api("qbit-clients", { method: "POST", body });
            if (res.success) {
                setClients([...clients, res.client]);
            }
        }
        setModalOpen(false);
    }

    async function handleDelete() {
        if (!deletingClient) return;
        const res = await api(`qbit-clients/${deletingClient.id}`, {
            method: "DELETE",
        });
        if (res.success) {
            setClients(clients.filter((c) => c.id !== deletingClient.id));
            if (mainId === deletingClient.id) setMainId(null);
        }
        setDeleteModalOpen(false);
    }

    async function handleToggleEnabled() {
        const next = !enabled;
        const res = await api("qbit-mirror-settings", {
            method: "PUT",
            body: JSON.stringify({ enabled: next }),
        });
        if (res.success) setEnabled(next);
    }

    async function handleSetMain(client: QbitClient) {
        const res = await api("qbit-mirror-settings", {
            method: "PUT",
            body: JSON.stringify({ mainId: client.id }),
        });
        if (res.success) setMainId(client.id);
    }

    const main = clients.find((c) => c.id === mainId);
    const mirrors = clients.filter((c) => c.id !== mainId);

    if (loading)
        return (
            <div className="flex items-center justify-center h-48">
                <span className="loading loading-spinner loading-md" />
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">qBittorrent Clients</h1>
                    <p className="text-sm text-base-content/50 mt-0.5">
                        Manage your main instance and mirrors
                    </p>
                </div>
                <button className="btn btn-primary btn-sm gap-2" onClick={openAdd}>
                    <PlusIcon className="w-4 h-4" />
                    Add Client
                </button>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Mirror Sync</p>
                            <p className="text-sm text-base-content/50">
                                Automatically sync completed private torrents from
                                main to mirrors every 5 minutes
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={enabled}
                            onChange={handleToggleEnabled}
                        />
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Main Instance
                </p>
                {main ? (
                    <ClientCard
                        client={main}
                        isMain
                        onEdit={() => openEdit(main)}
                        onDelete={() => openDelete(main)}
                    />
                ) : (
                    <div className="card bg-base-100 shadow-sm border border-dashed border-base-300">
                        <div className="card-body p-4 text-center text-base-content/40 text-sm">
                            No main instance set — click ★ on a client to set it as main
                        </div>
                    </div>
                )}
            </div>

            <div>
                <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Mirrors ({mirrors.length})
                </p>
                {mirrors.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm border border-dashed border-base-300">
                        <div className="card-body p-4 text-center text-base-content/40 text-sm">
                            No mirrors added yet
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {mirrors.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                isMain={false}
                                onSetMain={() => handleSetMain(client)}
                                onEdit={() => openEdit(client)}
                                onDelete={() => openDelete(client)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-lg">
                            {editingClient ? "Edit Client" : "Add Client"}
                        </h3>
                        <p className="text-sm text-base-content/50 mb-6">
                            {editingClient
                                ? "Update the connection details for this client"
                                : "Add a new qBittorrent instance to manage"}
                        </p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <div className="label py-1">
                                        <span className="label-text font-medium">Name</span>
                                    </div>
                                    <input
                                        className="input input-bordered input-sm"
                                        placeholder="e.g. main"
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({ ...form, name: e.target.value })
                                        }
                                    />
                                </label>

                                <label className="form-control">
                                    <div className="label py-1">
                                        <span className="label-text font-medium">URL</span>
                                    </div>
                                    <input
                                        className="input input-bordered input-sm"
                                        placeholder="http://host:8080"
                                        value={form.url}
                                        onChange={(e) =>
                                            setForm({ ...form, url: e.target.value })
                                        }
                                    />
                                </label>
                            </div>

                            <div className="divider text-xs text-base-content/40 my-1">
                                Authentication
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <div className="label py-1">
                                        <span className="label-text font-medium">Username</span>
                                        <span className="label-text-alt text-base-content/40">
                                            optional
                                        </span>
                                    </div>
                                    <input
                                        className="input input-bordered input-sm"
                                        placeholder="admin"
                                        value={form.username}
                                        onChange={(e) =>
                                            setForm({ ...form, username: e.target.value })
                                        }
                                    />
                                </label>

                                <label className="form-control">
                                    <div className="label py-1">
                                        <span className="label-text font-medium">Password</span>
                                        <span className="label-text-alt text-base-content/40">
                                            optional
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            className="input input-bordered input-sm w-full pr-8"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={
                                                editingClient
                                                    ? "Leave blank to keep current"
                                                    : "••••••••"
                                            }
                                            value={form.password}
                                            onChange={(e) =>
                                                setForm({ ...form, password: e.target.value })
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                                            onClick={() => setShowPassword((v) => !v)}
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="w-4 h-4" />
                                            ) : (
                                                <EyeIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </label>
                            </div>

                            {(!form.name || !form.url) && (
                                <p className="text-xs text-warning flex items-center gap-1">
                                    <span>⚠</span> Name and URL are required
                                </p>
                            )}
                        </div>

                        <div className="modal-action mt-6">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleSave}
                                disabled={!form.name || !form.url}
                            >
                                {editingClient ? "Save Changes" : "Add Client"}
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => setModalOpen(false)}
                    />
                </div>
            )}

            {deleteModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Delete Client</h3>
                        <p className="py-4 text-sm text-base-content/70">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-base-content">
                                {deletingClient?.name}
                            </span>
                            ? This cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error btn-sm"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => setDeleteModalOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}

interface ClientCardProps {
    client: QbitClient;
    isMain: boolean;
    onSetMain?: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function ClientCard({
    client,
    isMain,
    onSetMain,
    onEdit,
    onDelete,
}: ClientCardProps) {
    return (
        <div
            className={`card bg-base-100 shadow-sm ${isMain ? "border border-primary/30" : ""
                }`}
        >
            <div className="card-body p-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${isMain ? "bg-primary/10" : "bg-base-200"
                            }`}
                    >
                        <ServerIcon
                            className={`w-5 h-5 ${isMain
                                    ? "text-primary"
                                    : "text-base-content/50"
                                }`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{client.name}</p>
                            {isMain && (
                                <span className="badge badge-primary badge-xs">
                                    main
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-base-content/50 truncate">
                            {client.url}
                        </p>
                        {client.username && (
                            <p className="text-xs text-base-content/40">
                                {client.username}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {!isMain && (
                            <button
                                className="btn btn-ghost btn-xs tooltip"
                                data-tip="Set as main"
                                onClick={onSetMain}
                            >
                                <StarIcon className="w-4 h-4 text-base-content/40 hover:text-warning" />
                            </button>
                        )}
                        {isMain && (
                            <button className="btn btn-ghost btn-xs" disabled>
                                <StarSolid className="w-4 h-4 text-warning" />
                            </button>
                        )}
                        <button className="btn btn-ghost btn-xs" onClick={onEdit}>
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={onDelete}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}