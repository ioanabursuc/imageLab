import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import mockImages from "@/data/mockImages";

const COLORS = ["#8884d8", "#82ca9d"];

export default function ImageChart() {
    const data = [
        {
            name: "Nature",
            value: mockImages.filter((img) => img.category === "nature").length,
        },
        {
            name: "Architecture",
            value: mockImages.filter((img) => img.category === "architecture").length,
        },
    ];

    return (
        <div className="mt-8 w-full rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">Image Categories Overview</h2>
            <p className="mb-6 text-sm text-gray-500">
                Interactive chart showing the distribution of uploaded images by category.
            </p>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>

                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}