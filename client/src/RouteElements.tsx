import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
        const res = await fetch("/api/logged-in", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data.success;
    } catch {
        return false;
    }
};

export function ProtectedRoute() {
    const [authed, setAuthed] = useState<boolean | null>(null);

    useEffect(() => {
        checkAuth().then(setAuthed);
    }, []);

    if (authed === null) return <span className="loading loading-spinner loading-lg" />;
    return authed ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
    const [authed, setAuthed] = useState<boolean | null>(null);

    useEffect(() => {
        checkAuth().then(setAuthed);
    }, []);

    if (authed === null) return <span className="loading loading-spinner loading-lg" />;
    return authed ? <Navigate to="/" replace /> : <Outlet />;
}
