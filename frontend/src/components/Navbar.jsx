import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Plus, Shield } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import icon from "@/assets/icon.svg";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token, logout } = useAuthStore();
    const isAuthenticated = !!token;

    const isPrivatePage =
        location.pathname === "/dashboard" ||
        location.pathname.startsWith("/editor") ||
        location.pathname === "/admin";

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
                <img src={icon} alt="ImageLab logo" className="h-7 w-7" />
                ImageLab
            </Link>

            <div className="flex items-center gap-3">
                {isPrivatePage && isAuthenticated ? (
                    <>
                        <Link to="/editor">
                            <Button size="sm" className="gap-2">
                                <Plus size={16} />
                                New Project
                            </Button>
                        </Link>

                        {user?.role === "ADMIN" && (
                            <Link to="/admin">
                                <Button variant="ghost" size="sm" className="gap-1.5">
                                    <Shield size={15} />
                                    Admin
                                </Button>
                            </Link>
                        )}

                        <span className="text-sm text-gray-600">{user?.name}</span>

                        <Link to="/dashboard">
                            <Button variant="ghost" size="icon">
                                <User size={17} />
                            </Button>
                        </Link>

                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut size={17} />
                        </Button>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            <Button variant="ghost" size="sm">
                                Sign In
                            </Button>
                        </Link>

                        <Link to="/register">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
