import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/home/HomePage";
import LoginPage from "@/pages/login/LoginPage";
import RegisterPage from "@/pages/register/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import EditorPage from "@/pages/editor/EditorPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/editor/:imageId" element={<EditorPage />} />
                </Route>
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminUsersPage />} />
                </Route>
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
    );
}