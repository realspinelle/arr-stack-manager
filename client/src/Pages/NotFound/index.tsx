import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <p className="text-xl font-medium text-base-content">Page not found</p>
            <p className="text-sm text-base-content/50">
                The page you're looking for doesn't exist.
            </p>
            <Link to="/" className="btn btn-primary btn-sm mt-2">
                Back to Dashboard
            </Link>
        </div>
    );
}
