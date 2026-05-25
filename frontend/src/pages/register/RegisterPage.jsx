import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import icon from "@/assets/icon.svg";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function validatePassword(value) {
        if (!PASSWORD_REGEX.test(value)) {
            setPasswordError(
                "Min 8 characters with at least one uppercase letter, one digit, and one special character (!@#$%^&*)"
            );
            return false;
        }
        setPasswordError("");
        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        if (!validatePassword(password)) return;

        setLoading(true);
        try {
            const data = await authApi.register({ name, email, password });
            login(data);
            navigate("/dashboard");
        } catch (err) {
            const serverError = err?.data?.error ?? err?.data?.password ?? err?.data?.email;
            setError(serverError ?? "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white px-8 py-5">
                <Link to="/" className="flex items-center gap-3 font-semibold text-lg">
                    <img src={icon} alt="ImageLab logo" className="h-9 w-9" />
                    ImageLab
                </Link>
            </header>

            <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-semibold">Create Account</h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Get started with ImageLab
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) validatePassword(e.target.value);
                                    }}
                                    required
                                />
                                {passwordError && (
                                    <p className="text-xs text-red-500">{passwordError}</p>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-600 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
