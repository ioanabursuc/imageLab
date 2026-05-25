import { useState, useEffect } from "react";
import { Users, Shield, Pencil, Trash2, Check, X, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function RoleBadge({ role }) {
    const isAdmin = role === "ADMIN";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isAdmin ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
            }`}
        >
            {isAdmin && <Shield size={11} />}
            {role}
        </span>
    );
}

function formatDate(dateString) {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function AdminUsersPage() {
    const currentUser = useAuthStore((state) => state.user);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("CLIENT");
    const [createError, setCreateError] = useState("");
    const [creating, setCreating] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("CLIENT");
    const [rowError, setRowError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchUsers() {
            try {
                const data = await adminApi.getAllUsers();

                if (!cancelled) {
                    setUsers(data);
                }
            } catch (err) {
                if (!cancelled) {
                    if (err?.status === 403) {
                        setError("You do not have permission to access user management.");
                    } else if (err?.status === 401) {
                        setError("Your session expired. Please log in again.");
                    } else {
                        setError(err?.data?.error ?? "Failed to load users.");
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    function openForm() {
        setShowForm(true);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("CLIENT");
        setCreateError("");
    }

    function closeForm() {
        setShowForm(false);
        setCreateError("");
    }

    async function handleCreate(e) {
        e.preventDefault();

        setCreating(true);
        setCreateError("");

        try {
            const created = await adminApi.createUser({
                name: newName.trim(),
                email: newEmail.trim(),
                password: newPassword,
                role: newRole,
            });

            setUsers((prev) => [...prev, created]);
            closeForm();
        } catch (err) {
            if (err?.status === 409) {
                setCreateError("Email already in use.");
            } else if (err?.status === 403) {
                setCreateError("You do not have permission to create users.");
            } else {
                setCreateError(err?.data?.error ?? "Failed to create user.");
            }
        } finally {
            setCreating(false);
        }
    }

    function startEdit(user) {
        setEditingId(user.id);
        setEditName(user.name ?? "");
        setEditEmail(user.email ?? "");
        setEditRole(user.role ?? "CLIENT");
        setRowError("");
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName("");
        setEditEmail("");
        setEditRole("CLIENT");
        setRowError("");
    }

    async function handleSave(id) {
        setSaving(true);
        setRowError("");

        try {
            const updated = await adminApi.updateUser(id, {
                name: editName.trim(),
                email: editEmail.trim(),
                role: editRole,
            });

            setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
            cancelEdit();
        } catch (err) {
            if (err?.status === 409) {
                setRowError("Email already in use.");
            } else if (err?.status === 403) {
                setRowError("You do not have permission to update this user.");
            } else {
                setRowError(err?.data?.error ?? "Failed to save changes.");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user) {
        const isSelf = user.email === currentUser?.email;

        if (isSelf) {
            setError("You cannot delete your own account.");
            return;
        }

        if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
            return;
        }

        setError("");

        try {
            await adminApi.deleteUser(user.id);
            setUsers((prev) => prev.filter((x) => x.id !== user.id));
        } catch (err) {
            if (err?.status === 403) {
                setError("You do not have permission to delete users.");
            } else {
                setError(err?.data?.error ?? "Failed to delete user.");
            }
        }
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-semibold">
                        <Users size={28} />
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">All registered users</p>
                </div>

                <div className="flex items-center gap-3">
                    {!loading && !error && (
                        <span className="text-sm text-gray-400">{users.length} users</span>
                    )}

                    <Button size="sm" className="gap-2" onClick={openForm}>
                        <UserPlus size={16} />
                        New User
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <h2 className="mb-4 font-semibold">Create New User</h2>

                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="new-name">Name</Label>
                                <Input
                                    id="new-name"
                                    placeholder="Full name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new-email">Email</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new-password">Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLIENT">CLIENT</SelectItem>
                                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {createError && (
                                <p className="col-span-2 text-sm text-red-500">
                                    {createError}
                                </p>
                            )}

                            <div className="col-span-2 flex gap-3">
                                <Button type="submit" disabled={creating}>
                                    {creating ? "Creating..." : "Create User"}
                                </Button>

                                <Button type="button" variant="ghost" onClick={closeForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                            Loading...
                        </div>
                    ) : users.length === 0 && !error ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                            No users found.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y">
                            {users.map((user) => {
                                const isEditing = editingId === user.id;
                                const isSelf = user.email === currentUser?.email;

                                return (
                                    <tr
                                        key={user.id}
                                        className="group transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-3">
                                            {isEditing ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) =>
                                                        setEditName(e.target.value)
                                                    }
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-medium">
                                                        {user.name}
                                                    </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-3">
                                            {isEditing ? (
                                                <div>
                                                    <Input
                                                        type="email"
                                                        value={editEmail}
                                                        onChange={(e) =>
                                                            setEditEmail(e.target.value)
                                                        }
                                                    />

                                                    {rowError && (
                                                        <p className="mt-1 text-xs text-red-500">
                                                            {rowError}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600">
                                                        {user.email}
                                                    </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-3">
                                            {isEditing ? (
                                                <Select
                                                    value={editRole}
                                                    onValueChange={setEditRole}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CLIENT">
                                                            CLIENT
                                                        </SelectItem>
                                                        <SelectItem value="ADMIN">
                                                            ADMIN
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <RoleBadge role={user.role} />
                                            )}
                                        </td>

                                        <td className="px-6 py-3 text-gray-500">
                                            {formatDate(user.createdAt)}
                                        </td>

                                        <td className="px-6 py-3">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSave(user.id)}
                                                        disabled={saving}
                                                        className="rounded p-1 text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                                                        title="Save"
                                                    >
                                                        <Check size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        disabled={saving}
                                                        className="rounded p-1 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(user)}
                                                        className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(user)}
                                                        disabled={isSelf}
                                                        className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                                                        title={
                                                            isSelf
                                                                ? "Cannot delete your own account"
                                                                : "Delete"
                                                        }
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}