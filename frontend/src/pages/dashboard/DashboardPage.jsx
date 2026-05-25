import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { imageApi } from "@/lib/api";
import ImageAnalyticsDashboard from "@/components/ImageAnalyticsDashboard";

export default function DashboardPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [images, setImages] = useState([]);
    const [blobUrls, setBlobUrls] = useState({});
    const [category, setCategory] = useState("all");
    const [pendingFile, setPendingFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingCategory, setEditingCategory] = useState("");

    const loadImages = useCallback(async () => {
        try {
            const data = await imageApi.getAll();
            setImages(data);

            const results = await Promise.allSettled(
                data.map(async (img) => {
                    const url = img.hasProcessed
                        ? await imageApi.getProcessedFile(img.id)
                        : await imageApi.getFile(img.id);
                    return { id: img.id, url };
                })
            );

            const urls = {};
            results.forEach((r) => {
                if (r.status === "fulfilled") urls[r.value.id] = r.value.url;
            });

            setBlobUrls((prev) => {
                Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
                return urls;
            });
        } catch {
            setError("Failed to load images.");
        }
    }, []);

    useEffect(() => {
        loadImages();
        return () => {
            setBlobUrls((prev) => {
                Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
                return {};
            });
        };
    }, [loadImages]);

    const categories = ["all", ...new Set(images.map((i) => i.category).filter(Boolean))];

    const filteredImages =
        category === "all" ? images : images.filter((img) => img.category === category);

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (file) {
            setPendingFile(file);
            setUploadCategory("");
            setError("");
        }
        e.target.value = "";
    }

    async function handleUpload() {
        if (!pendingFile) return;
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", pendingFile);
            if (uploadCategory.trim()) formData.append("category", uploadCategory.trim());
            await imageApi.upload(formData);
            setPendingFile(null);
            setUploadCategory("");
            await loadImages();
        } catch (err) {
            setError(err?.data?.error ?? "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(e, id) {
        e.stopPropagation();
        try {
            await imageApi.deleteImage(id);
            URL.revokeObjectURL(blobUrls[id]);
            setBlobUrls((prev) => { const next = { ...prev }; delete next[id]; return next; });
            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch {
            setError("Failed to delete image.");
        }
    }

    async function handleCategoryUpdate(e, id) {
        e.stopPropagation();
        try {
            const updated = await imageApi.updateCategory(id, editingCategory);
            setImages((prev) => prev.map((img) => img.id === id ? updated : img));
        } catch {
            setError("Failed to update category.");
        } finally {
            setEditingId(null);
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
        });
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">My Images</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage and edit your uploaded images
                    </p>
                </div>

                <div className="w-48">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter images" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat === "all" ? "All images" : cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* UPLOAD BOX */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {!pendingFile ? (
                <Card
                    className="mb-8 border-dashed cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CardContent className="flex h-40 flex-col items-center justify-center text-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-3" />
                        <h2 className="font-medium">Upload New Image</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Click to browse — JPG, PNG, WebP up to 10 MB
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="mb-8">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <p className="font-medium text-sm">
                            Selected: <span className="text-gray-600">{pendingFile.name}</span>
                        </p>
                        <Input
                            placeholder="Category (optional)"
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? "Uploading..." : "Upload"}
                            </Button>
                            <Button variant="ghost" onClick={() => setPendingFile(null)}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            {/* IMAGE GRID */}
            {filteredImages.length === 0 ? (
                <p className="text-center text-gray-400 py-16">No images yet. Upload one above.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredImages.map((img) => (
                        <Card
                            key={img.id}
                            onClick={() => navigate(`/editor/${img.id}`)}
                            className="overflow-hidden p-0 cursor-pointer transition hover:shadow-md relative group"
                        >
                            {blobUrls[img.id] ? (
                                <img
                                    src={blobUrls[img.id]}
                                    alt={img.originalFileName}
                                    className="h-56 w-full object-cover"
                                />
                            ) : (
                                <div className="h-56 w-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-sm text-gray-400">Loading...</span>
                                </div>
                            )}
                            {img.hasProcessed && (
                                <span className="absolute top-2 left-2 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
                                    Edited
                                </span>
                            )}

                            <button
                                onClick={(e) => handleDelete(e, img.id)}
                                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                            >
                                <Trash2 size={15} className="text-red-500" />
                            </button>

                            <CardContent className="p-4">
                                <h3 className="font-medium truncate">{img.originalFileName}</h3>
                                <p className="text-sm text-gray-500 mt-1">{formatDate(img.uploadDate)}</p>
                                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                    {editingId === img.id ? (
                                        <input
                                            autoFocus
                                            className="text-xs border rounded px-1 py-0.5 w-full outline-none focus:ring-1 focus:ring-blue-400"
                                            value={editingCategory}
                                            onChange={(e) => setEditingCategory(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleCategoryUpdate(e, img.id);
                                                if (e.key === "Escape") setEditingId(null);
                                            }}
                                            onBlur={(e) => handleCategoryUpdate(e, img.id)}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-1 group/cat">
                                            <span className="text-xs text-blue-600">
                                                {img.category || <span className="text-gray-400">No category</span>}
                                            </span>
                                            <button
                                                className="opacity-0 group-hover/cat:opacity-100 transition"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(img.id);
                                                    setEditingCategory(img.category ?? "");
                                                }}
                                            >
                                                <Pencil size={11} className="text-gray-400 hover:text-blue-600" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-10 mb-8 flex justify-center">
                <ImageAnalyticsDashboard />
            </div>
        </div>
    );
}
