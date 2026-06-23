import { useEffect, useRef, useState } from "react";

const CHANNELS = {
    rgb: "RGB",
    red: "Red",
    green: "Green",
    blue: "Blue",
    luminance: "Luminance",
};

function calculateHistogram(img, canvasFilter = "none") {
    const maxSize = 700;

    const scale = Math.min(
        1,
        maxSize / Math.max(img.naturalWidth, img.naturalHeight)
    );

    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.filter = canvasFilter || "none";
    ctx.drawImage(img, 0, 0, width, height);

    const pixels = ctx.getImageData(0, 0, width, height).data;

    const red = new Array(256).fill(0);
    const green = new Array(256).fill(0);
    const blue = new Array(256).fill(0);
    const luminance = new Array(256).fill(0);

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        red[r]++;
        green[g]++;
        blue[b]++;

        const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        luminance[y]++;
    }

    return {
        red,
        green,
        blue,
        luminance,
    };
}

function drawSingleChannel(ctx, data, color, width, height) {
    const maxValue = Math.max(...data);

    if (!maxValue) {
        return;
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    data.forEach((value, index) => {
        const x = (index / 255) * width;
        const y = height - (value / maxValue) * height;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();
}

function drawHistogram(canvas, histogram, selectedChannel) {
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    if (selectedChannel === "rgb") {
        drawSingleChannel(
            ctx,
            histogram.red,
            "rgba(239, 68, 68, 0.95)",
            width,
            height
        );

        drawSingleChannel(
            ctx,
            histogram.green,
            "rgba(34, 197, 94, 0.95)",
            width,
            height
        );

        drawSingleChannel(
            ctx,
            histogram.blue,
            "rgba(59, 130, 246, 0.95)",
            width,
            height
        );

        return;
    }

    if (selectedChannel === "red") {
        drawSingleChannel(
            ctx,
            histogram.red,
            "rgba(239, 68, 68, 0.95)",
            width,
            height
        );
    }

    if (selectedChannel === "green") {
        drawSingleChannel(
            ctx,
            histogram.green,
            "rgba(34, 197, 94, 0.95)",
            width,
            height
        );
    }

    if (selectedChannel === "blue") {
        drawSingleChannel(
            ctx,
            histogram.blue,
            "rgba(59, 130, 246, 0.95)",
            width,
            height
        );
    }

    if (selectedChannel === "luminance") {
        drawSingleChannel(
            ctx,
            histogram.luminance,
            "rgba(229, 231, 235, 0.95)",
            width,
            height
        );
    }
}

export default function HistogramPanel({ imageUrl, canvasFilter }) {
    const canvasRef = useRef(null);

    const [histogram, setHistogram] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState("rgb");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!imageUrl) {
            setHistogram(null);
            return;
        }

        let cancelled = false;

        setError("");
        setHistogram(null);

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            if (cancelled) {
                return;
            }

            try {
                const result = calculateHistogram(img, canvasFilter || "none");
                setHistogram(result);
            } catch (err) {
                console.error(err);
                setError("Could not calculate histogram for this image.");
            }
        };

        img.onerror = () => {
            if (!cancelled) {
                setError("Could not load image for histogram.");
            }
        };

        img.src = imageUrl;

        return () => {
            cancelled = true;
        };
    }, [imageUrl, canvasFilter]);

    useEffect(() => {
        if (!histogram || !canvasRef.current) {
            return;
        }

        drawHistogram(canvasRef.current, histogram, selectedChannel);
    }, [histogram, selectedChannel]);

    return (
        <section className="mt-5 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Histogram
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                        Pixel intensity distribution by color channel.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {Object.entries(CHANNELS).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedChannel(key)}
                            className={
                                selectedChannel === key
                                    ? "rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                                    : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    {error}
                </div>
            ) : (
                <>
                    <canvas
                        ref={canvasRef}
                        width={512}
                        height={180}
                        className="block h-[180px] w-full rounded-xl bg-slate-950"
                    />

                    <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                        <span>0</span>
                        <span>Intensity</span>
                        <span>255</span>
                    </div>
                </>
            )}
        </section>
    );
}