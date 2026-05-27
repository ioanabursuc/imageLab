import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiApi } from "@/lib/api";

import { useEditorImage } from "./hooks/useEditorImage";
import { useBeforeAfterPreview } from "./hooks/useBeforeAfterPreview";
import { useMaskCanvas } from "./hooks/useMaskCanvas";
import { useOpenCvTools } from "./hooks/useOpenCvTools";
import { applyFiltersToCanvas } from "./utils/canvasUtils";

import EditorSidebar from "./components/EditorSidebar";
import EditorTopBar from "./components/EditorTopBar";
import EditorCanvas from "./components/EditorCanvas";

export default function EditorPage() {
    const { imageId } = useParams();
    const navigate = useNavigate();
    const imgRef = useRef(null);

    const [activeTab, setActiveTab] = useState("adjust");
    const [selectedTool, setSelectedTool] = useState(null);

    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);

    const [removeCols, setRemoveCols] = useState(50);
    const [removeRows, setRemoveRows] = useState(0);

    const [aiMessage, setAiMessage] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const imageEditor = useEditorImage(imageId);
    const {
        imageMeta, setImageMeta,
        originalBlobUrl, processedBlobUrl,
        activeBaseUrl, setActiveBaseUrl,
        imageDimensions,
        saving, error, setError,
        handleImageLoad: onImageLoadBase,
        saveProcessed, deleteProcessed, refreshProcessed,
    } = imageEditor;

    const { showBefore, setShowBefore, canCompare, previewUrl } = useBeforeAfterPreview({
        originalBlobUrl,
        processedBlobUrl,
        activeBaseUrl,
    });

    const maskCanvas = useMaskCanvas({ imgRef, selectedTool });
    const {
        maskCanvasRef, overlayCanvasRef,
        hasMask, brushSize, setBrushSize,
        prepareMaskCanvas, clearMask,
        handleMaskPointerDown, handleMaskPointerMove, stopMaskDrawing,
    } = maskCanvas;

    const {
        processingTool,
        applySeamCarving,
        applyProtectedSeamCarving,
        applyCriminisi,
    } = useOpenCvTools({
        imageId,
        imageDimensions,
        async onSuccess(updatedMeta) {
            setImageMeta(updatedMeta);
            await refreshProcessed();
            clearMask();
            setShowBefore(false);
            resetSliders();
        },
        onError: setError,
    });

    function resetSliders() {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    }

    function handleImageLoad(event) {
        onImageLoadBase(event);

        if (selectedTool === "seam_protect" || selectedTool === "criminisi") {
            setTimeout(() => prepareMaskCanvas(), 0);
        }
    }

    function handleSave() {
        if (!imgRef.current) return;
        const canvas = applyFiltersToCanvas(imgRef.current, brightness, contrast, saturation);
        saveProcessed(canvas, () => {
            setShowBefore(false);
            resetSliders();
        });
    }

    function handleExport() {
        if (!imgRef.current) return;
        const canvas = applyFiltersToCanvas(imgRef.current, brightness, contrast, saturation);
        const baseName = imageMeta?.originalFileName?.replace(/\.[^.]+$/, "") || "export";
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${baseName}_edited.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, "image/png");
    }

    function handleRevert() {
        setActiveBaseUrl(originalBlobUrl);
        setShowBefore(false);
        resetSliders();
    }

    async function handleDeleteProcessed() {
        await deleteProcessed(() => {
            setShowBefore(false);
            resetSliders();
        });
    }

    async function handleAskAi() {
        setAiLoading(true);
        setAiResponse("");
        setAiError("");
        try {
            const text = await aiApi.analyze(imageId, aiMessage);
            setAiResponse(text);
        } catch {
            setAiError("Failed to get AI recommendation.");
        } finally {
            setAiLoading(false);
        }
    }

    const imageStyle = {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50">
            <div className="grid grid-cols-[320px_1fr]">
                <EditorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedTool={selectedTool}
                    setSelectedTool={setSelectedTool}
                    brightness={brightness}
                    setBrightness={setBrightness}
                    contrast={contrast}
                    setContrast={setContrast}
                    saturation={saturation}
                    setSaturation={setSaturation}
                    removeCols={removeCols}
                    setRemoveCols={setRemoveCols}
                    removeRows={removeRows}
                    setRemoveRows={setRemoveRows}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    imageDimensions={imageDimensions}
                    processingTool={processingTool}
                    activeBaseUrl={activeBaseUrl}
                    hasMask={hasMask}
                    onApplySeam={() => applySeamCarving("seam", Number(removeCols), Number(removeRows))}
                    onApplyProtected={() =>
                        applyProtectedSeamCarving(
                            Number(removeCols),
                            Number(removeRows),
                            maskCanvasRef.current
                        )
                    }
                    onApplyCriminisi={() =>
                        applyCriminisi(
                            maskCanvasRef.current,
                            5
                        )
                    }
                    onClearMask={clearMask}
                    onPrepareMask={() => {
                        setError("");
                        setShowBefore(false);
                        setTimeout(() => prepareMaskCanvas(), 0);
                    }}
                    aiMessage={aiMessage}
                    setAiMessage={setAiMessage}
                    aiResponse={aiResponse}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    onAskAi={handleAskAi}
                />

                <main className="p-8">
                    <EditorTopBar
                        imageMeta={imageMeta}
                        processedBlobUrl={processedBlobUrl}
                        saving={saving}
                        error={error}
                        onBack={() => navigate("/dashboard")}
                        onReset={resetSliders}
                        onRevert={handleRevert}
                        onDeleteProcessed={handleDeleteProcessed}
                        onExport={handleExport}
                        onSave={handleSave}
                    />

                    <EditorCanvas
                        imgRef={imgRef}
                        maskCanvasRef={maskCanvasRef}
                        overlayCanvasRef={overlayCanvasRef}
                        previewUrl={previewUrl}
                        imageStyle={imageStyle}
                        showBefore={showBefore}
                        canCompare={canCompare}
                        selectedTool={selectedTool}
                        error={error}
                        onImageLoad={handleImageLoad}
                        onPointerDown={handleMaskPointerDown}
                        onPointerMove={handleMaskPointerMove}
                        onPointerUp={stopMaskDrawing}
                    />
                </main>
            </div>
        </div>
    );
}