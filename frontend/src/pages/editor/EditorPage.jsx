import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    RotateCcw,
    Download,
    Save,
    Upload,
    Expand,
    Shield,
    Trash2,
    ArrowLeft,
    RotateCw,
    Bot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { imageApi, aiApi } from "@/lib/api";

export default function EditorPage() {
    const { imageId } = useParams();
    const navigate = useNavigate();
    const imgRef = useRef(null);

    const [activeTab, setActiveTab] = useState("adjust");
    const [imageMeta, setImageMeta] = useState(null);
    const [originalBlobUrl, setOriginalBlobUrl] = useState(null);
    const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
    const [activeBaseUrl, setActiveBaseUrl] = useState(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [aiMessage, setAiMessage] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const imageStyle = {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    };

    const loadImage = useCallback(async () => {
        try {
            const meta = await imageApi.getById(imageId);
            setImageMeta(meta);

            const origUrl = await imageApi.getFile(imageId);
            setOriginalBlobUrl(origUrl);

            if (meta.hasProcessed) {
                const procUrl = await imageApi.getProcessedFile(imageId);
                setProcessedBlobUrl(procUrl);
                setActiveBaseUrl(procUrl);
            } else {
                setActiveBaseUrl(origUrl);
            }
        } catch {
            setError("Image not found.");
        }
    }, [imageId]);

    useEffect(() => {
        loadImage();
        return () => {
            setOriginalBlobUrl((url) => { if (url) URL.revokeObjectURL(url); return null; });
            setProcessedBlobUrl((url) => { if (url) URL.revokeObjectURL(url); return null; });
        };
    }, [loadImage]);

    function resetSliders() {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    }

    function handleRevert() {
        setActiveBaseUrl(originalBlobUrl);
        resetSliders();
    }

    async function handleDeleteProcessed() {
        try {
            await imageApi.revertProcessed(imageId);
            if (processedBlobUrl) URL.revokeObjectURL(processedBlobUrl);
            setProcessedBlobUrl(null);
            setActiveBaseUrl(originalBlobUrl);
            setImageMeta((prev) => ({ ...prev, hasProcessed: false }));
            resetSliders();
        } catch {
            setError("Failed to delete edited version.");
        }
    }

    async function handleSave() {
        if (!imgRef.current) return;
        setSaving(true);
        setError("");

        const img = imgRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (blob) => {
            try {
                const fd = new FormData();
                fd.append("file", blob, "processed.png");
                const updated = await imageApi.saveProcessed(imageId, fd);
                setImageMeta(updated);

                if (processedBlobUrl) URL.revokeObjectURL(processedBlobUrl);
                const newProcUrl = await imageApi.getProcessedFile(imageId);
                setProcessedBlobUrl(newProcUrl);
                setActiveBaseUrl(newProcUrl);
                resetSliders();
            } catch {
                setError("Failed to save.");
            } finally {
                setSaving(false);
            }
        }, "image/png");
    }

    async function handleAskAi() {
        setAiLoading(true); setAiResponse(""); setAiError("");
        try {
            const text = await aiApi.analyze(imageId, aiMessage);
            setAiResponse(text);
        } catch { setAiError("Failed to get AI recommendation."); }
        finally { setAiLoading(false); }
    }

    function handleExport() {
        if (!imgRef.current) return;
        const img = imgRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = imageMeta?.originalFileName?.replace(/\.[^.]+$/, "") + "_edited.png" ?? "export.png";
            a.click();
            URL.revokeObjectURL(url);
        }, "image/png");
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="grid grid-cols-[320px_1fr]">
                {/* SIDEBAR */}
                <aside className="min-h-[calc(100vh-80px)] border-r bg-white p-6">
                    <div className="mb-8 flex rounded-2xl bg-gray-100 p-1">
                        <button
                            onClick={() => setActiveTab("adjust")}
                            className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                                activeTab === "adjust" ? "bg-white shadow-sm" : "text-gray-600"
                            }`}
                        >
                            Adjust
                        </button>
                        <button
                            onClick={() => setActiveTab("tools")}
                            className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                                activeTab === "tools" ? "bg-white shadow-sm" : "text-gray-600"
                            }`}
                        >
                            Tools
                        </button>
                    </div>

                    {activeTab === "adjust" ? (
                        <div className="space-y-8">
                            <SliderControl label="Brightness" value={brightness} onChange={setBrightness} />
                            <SliderControl label="Contrast" value={contrast} onChange={setContrast} />
                            <SliderControl label="Saturation" value={saturation} onChange={setSaturation} />
                        </div>
                    ) : (
                        <div>
                            <div className="space-y-3">
                                <ToolButton icon={<Upload size={18} />} label="Upload Image" />
                                <ToolButton icon={<Expand size={18} />} label="Image Retargeting" />
                                <ToolButton icon={<Expand size={18} />} label="Image Retargeting with Protection Mask" />
                                <ToolButton icon={<Shield size={18} />} label="Poisson Editing" />
                                <ToolButton icon={<Trash2 size={18} />} label="Criminisi" />
                            </div>
                            <div className="mt-8 border-t pt-4">
                                <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
                                    <p className="mb-3 font-medium text-gray-700">Tool Instructions:</p>
                                    <p className="mb-2">• <span className="font-semibold">Retarget:</span> Resize while preserving important content</p>
                                    <p className="mb-2">• <span className="font-semibold">Protect:</span> Mark faces and bodies to preserve</p>
                                    <p>• <span className="font-semibold">Remove:</span> Click and drag over objects to remove</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-8 border-t pt-6 space-y-3">
                        <h3 className="flex items-center gap-2 font-medium text-sm">
                            <Bot size={16} /> AI Assistant
                        </h3>
                        <p className="text-xs text-gray-500">What do you want to do with this image?</p>
                        <textarea
                            rows={3}
                            className="w-full rounded-md border px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder='e.g. "Remove the person from the background."'
                            value={aiMessage}
                            onChange={(e) => setAiMessage(e.target.value)}
                        />
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={handleAskAi}
                            disabled={aiLoading || !aiMessage.trim() || !activeBaseUrl}
                        >
                            {aiLoading ? "Analyzing..." : "Ask AI"}
                        </Button>
                        {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                        {aiResponse && (
                            <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700 leading-relaxed">
                                {aiResponse}
                            </div>
                        )}
                    </div>
                </aside>

                {/* MAIN CANVAS */}
                <main className="p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            <ArrowLeft size={16} /> Back to Dashboard
                        </button>

                        <div className="flex gap-2 flex-wrap justify-end">
                            <Button variant="outline" size="sm" onClick={resetSliders}>
                                <RotateCcw size={16} /> Reset
                            </Button>

                            {processedBlobUrl && (
                                <Button variant="outline" size="sm" onClick={handleRevert}>
                                    <RotateCw size={16} /> Revert
                                </Button>
                            )}

                            {imageMeta?.hasProcessed && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={handleDeleteProcessed}
                                >
                                    <Trash2 size={16} /> Delete Edited
                                </Button>
                            )}

                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download size={16} /> Export
                            </Button>

                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>

                    {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}

                    <Card className="mx-auto max-w-3xl">
                        <CardContent className="flex items-center justify-center p-6">
                            {activeBaseUrl ? (
                                <img
                                    ref={imgRef}
                                    src={activeBaseUrl}
                                    alt="Editing preview"
                                    style={imageStyle}
                                    className="max-h-[520px] w-full rounded-md object-contain"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="h-[520px] w-full flex items-center justify-center text-gray-400">
                                    {error ? error : "Loading image..."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

function SliderControl({ label, value, onChange }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <span className="text-sm text-gray-500">{value}%</span>
            </div>
            <Slider
                value={[value]}
                min={0}
                max={200}
                step={1}
                onValueChange={(newValue) => onChange(newValue[0])}
            />
        </div>
    );
}

function ToolButton({ icon, label }) {
    return (
        <button className="flex w-full items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50">
            {icon}
            {label}
        </button>
    );
}
