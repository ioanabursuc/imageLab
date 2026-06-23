import { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c"];
const UNCATEGORIZED_VALUE = "__uncategorized";

export default function ImageAnalyticsDashboard({ images = [] }) {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const categories = useMemo(() => {
        return [...new Set(images.map((img) => img.category).filter(Boolean))];
    }, [images]);

    const hasUncategorizedImages = useMemo(() => {
        return images.some((img) => !img.category);
    }, [images]);

    const analyticsImages = useMemo(() => {
        if (selectedCategory === "all") {
            return images;
        }

        if (selectedCategory === UNCATEGORIZED_VALUE) {
            return images.filter((img) => !img.category);
        }

        return images.filter((img) => img.category === selectedCategory);
    }, [images, selectedCategory]);

    const activeCategories = useMemo(() => {
        return [...new Set(analyticsImages.map((img) => img.category).filter(Boolean))];
    }, [analyticsImages]);

    const totalImages = analyticsImages.length;

    const editedImages = useMemo(() => {
        return analyticsImages.filter((img) => img.hasProcessed).length;
    }, [analyticsImages]);

    const originalImages = totalImages - editedImages;

    const topCategory = useMemo(() => {
        if (analyticsImages.length === 0) {
            return "No category";
        }

        const grouped = {};

        analyticsImages.forEach((img) => {
            const category = img.category || "No category";
            grouped[category] = (grouped[category] || 0) + 1;
        });

        const result = Object.entries(grouped)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        return result[0]?.category ?? "No category";
    }, [analyticsImages]);

    const categoryData = useMemo(() => {
        if (analyticsImages.length === 0) {
            return [];
        }

        const grouped = {};

        analyticsImages.forEach((img) => {
            const category = img.category || "No category";
            grouped[category] = (grouped[category] || 0) + 1;
        });

        return Object.entries(grouped).map(([category, count]) => ({
            category,
            count,
        }));
    }, [analyticsImages]);

    const processedData = useMemo(() => {
        return [
            { name: "Original images", value: originalImages },
            { name: "Edited images", value: editedImages },
        ];
    }, [originalImages, editedImages]);

    const uploadsByDateData = useMemo(() => {
        const grouped = {};

        analyticsImages.forEach((img) => {
            const date = new Date(img.uploadDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });

            grouped[date] = (grouped[date] || 0) + 1;
        });

        return Object.entries(grouped)
            .map(([date, count]) => ({
                date,
                count,
                timestamp: new Date(date).getTime(),
            }))
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(({ date, count }) => ({
                date,
                count,
            }));
    }, [analyticsImages]);

    const recentImages = useMemo(() => {
        return [...analyticsImages]
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
            .slice(0, 5);
    }, [analyticsImages]);

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    if (images.length === 0) {
        return (
            <section className="mt-10 w-full rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold">Image Analytics Dashboard</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Upload images to see dynamic analytics here.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-10 w-full rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Image Analytics Dashboard</h2>
                    <p className="text-sm text-gray-500">
                        Dynamic overview generated from your uploaded images.
                    </p>
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px] rounded-xl">
                        <SelectValue placeholder="All images" />
                    </SelectTrigger>

                    <SelectContent className="rounded-xl">
                        <SelectItem value="all">All images</SelectItem>

                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}

                        {hasUncategorizedImages && (
                            <SelectItem value={UNCATEGORIZED_VALUE}>
                                No category
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Images in selection</p>
                    <p className="text-3xl font-bold">{totalImages}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Edited images</p>
                    <p className="text-3xl font-bold">{editedImages}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-3xl font-bold">
                        {selectedCategory === "all"
                            ? categories.length
                            : activeCategories.length || (totalImages > 0 ? 1 : 0)}
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Top category</p>
                    <p className="truncate text-2xl font-bold">{topCategory}</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-xl border p-4">
                    <h3 className="mb-4 font-semibold">Images by Category</h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    name="Number of images"
                                    fill="#8884d8"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <h3 className="mb-4 font-semibold">Original vs Edited Images</h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processedData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {processedData.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border p-4 lg:col-span-2">
                    <h3 className="mb-4 font-semibold">Uploads Over Time</h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={uploadsByDateData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Uploaded images"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Recent Images</h3>
                        <p className="text-sm text-gray-500">
                            Last uploaded images from your account.
                        </p>
                    </div>

                    <p className="text-sm text-gray-500">
                        Showing {analyticsImages.length} image(s) for selected filter
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 font-medium text-gray-600">Image</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Upload date</th>
                            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                        </tr>
                        </thead>

                        <tbody>
                        {recentImages.map((img) => (
                            <tr key={img.id} className="border-b last:border-0">
                                <td className="px-4 py-3">{img.originalFileName}</td>
                                <td className="px-4 py-3">
                                    {img.category || "No category"}
                                </td>
                                <td className="px-4 py-3">{formatDate(img.uploadDate)}</td>
                                <td className="px-4 py-3">
                                    {img.hasProcessed ? (
                                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                Edited
                                            </span>
                                    ) : (
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                Original
                                            </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}