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
} from "recharts";

import mockImages from "@/data/mockImages";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export default function ImageAnalyticsDashboard() {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const categories = useMemo(() => {
        return [...new Set(mockImages.map((img) => img.category))];
    }, []);

    const filteredImages = useMemo(() => {
        if (selectedCategory === "all") return mockImages;

        return mockImages.filter((img) => img.category === selectedCategory);
    }, [selectedCategory]);

    const categoryData = useMemo(() => {
        return categories.map((category) => ({
            category,
            count: mockImages.filter((img) => img.category === category).length,
        }));
    }, [categories]);

    const pieData = useMemo(() => {
        return categories.map((category) => ({
            name: category,
            value: mockImages.filter((img) => img.category === category).length,
        }));
    }, [categories]);

    const sizeData = useMemo(() => {
        return filteredImages.map((img, index) => ({
            name: img.title,
            size: img.size ?? (index + 1) * 120,
        }));
    }, [filteredImages]);

    return (
        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Image Analytics Dashboard</h2>
                    <p className="text-sm text-gray-500">
                        Interactive overview of image categories and image sizes.
                    </p>
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                        <SelectValue placeholder="All images" />
                    </SelectTrigger>

                    <SelectContent className="rounded-xl">
                        <SelectItem value="all">All images</SelectItem>

                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total images</p>
                    <p className="text-3xl font-bold">{filteredImages.length}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-3xl font-bold">{categories.length}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Selected filter</p>
                    <p className="text-3xl font-bold capitalize">
                        {selectedCategory === "all" ? "All images" : selectedCategory}
                    </p>
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
                    <h3 className="mb-4 font-semibold">Category Distribution</h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {pieData.map((entry, index) => (
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
                    <h3 className="mb-4 font-semibold">
                        Filtered Images Size Comparison
                    </h3>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sizeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="size" name="Image size KB" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </section>
    );
}