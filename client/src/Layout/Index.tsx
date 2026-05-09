import { NavLink, Outlet } from "react-router-dom";
import {
    HomeIcon,
    Cog6ToothIcon,
    CogIcon,
    NoSymbolIcon,
    ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

const navigation = [
    {
        category: "General",
        items: [
            { name: "Dashboard", href: "/", icon: HomeIcon },
            { name: "Settings", href: "/settings", icon: Cog6ToothIcon }
        ]
    },
    {
        category: "Qbittorrent",
        items: [
            { name: "QbitMirror", href: "/qbitmirror", icon: ClipboardDocumentListIcon },
            { name: "QbitIpBlockList", href: "/qbitipblocklist", icon: NoSymbolIcon }
        ]
    },
    {
        category: "*Arr",
        items: [
            { name: "ArrDeadQueueRemover", href: "/arrdeadqueueremover", icon: CogIcon }
        ]
    },
];

export default function Layout() {
    return (
        <div className="flex h-screen bg-base-200">
            <aside className="w-64 bg-base-100 shadow-md flex flex-col">
                <div className="p-4 border-b border-base-200">
                    <h1 className="text-xl font-bold text-primary">ArrStackManager</h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                    {navigation.map((section) => (
                        <div key={section.category}>
                            <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider px-2 mb-1">
                                {section.category}
                            </p>
                            <ul className="space-y-1">
                                {section.items.map((item) => (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.href}
                                            end
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                                    ${isActive
                                                    ? "bg-primary text-primary-content"
                                                    : "text-base-content hover:bg-base-200"
                                                }`
                                            }
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {item.name}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}
