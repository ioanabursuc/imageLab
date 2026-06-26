import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiApi, imageApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

import { useEditorImage } from "./hooks/useEditorImage";
import { useBeforeAfterPreview } from "./hooks/useBeforeAfterPreview";
import { useMaskCanvas } from "./hooks/useMaskCanvas";
import { useOpenCvTools } from "./hooks/useOpenCvTools";
import { applyFiltersToCanvas } from "./utils/canvasUtils";
import {
    createMaskedPreviewUrl,
    resizeImageFileToBlob,
    resizeMaskCanvasToBlob,
} from "./utils/poissonCanvasUtils";

import EditorSidebar from "./components/EditorSidebar";
import EditorTopBar from "./components/EditorTopBar";
import { EditorCanvas } from "./components/EditorCanvas";

const initialPoissonState = {
    stage: "idle",
    sourceFile: null,
    sourceUrl: null,
    maskedPreviewUrl: null,
    previewSize: null,
    centerX: null,
    centerY: null,
    scale: 1,
    mode: "normal",
};

const DEFAULT_FILTER_PRESETS = [
    {
        id: "bright",
        name: "Bright",
        values: {
            brightness: 120,
            contrast: 105,
            saturation: 110,
            grayscale: 0,
            sepia: 0,
            hueRotate: 0,
            blur: 0,
            invert: 0,
        },
    },
    {
        id: "black-white",
        name: "Black & White",
        values: {
            brightness: 100,
            contrast: 115,
            saturation: 100,
            grayscale: 100,
            sepia: 0,
            hueRotate: 0,
            blur: 0,
            invert: 0,
        },
    },
    {
        id: "vintage",
        name: "Vintage",
        values: {
            brightness: 105,
            contrast: 95,
            saturation: 80,
            grayscale: 0,
            sepia: 45,
            hueRotate: 10,
            blur: 0,
            invert: 0,
        },
    },
    {
        id: "warm",
        name: "Warm",
        values: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
            sepia: 30,
            hueRotate: 0,
            blur: 0,
            invert: 0,
        },
    },
    {
        id: "cold",
        name: "Cold",
        values: {
            brightness: 100,
            contrast: 100,
            saturation: 120,
            grayscale: 0,
            sepia: 0,
            hueRotate: 22,
            blur: 0,
            invert: 0,
        },
    },
    {
        id: "high-contrast",
        name: "High Contrast",
        values: {
            brightness: 105,
            contrast: 150,
            saturation: 115,
            grayscale: 0,
            sepia: 0,
            hueRotate: 0,
            blur: 0,
            invert: 0,
        },
    },
];

const USER_PRESETS_STORAGE_KEY_PREFIX = "imagelab-user-filter-presets";

export default function EditorPage() {
    const { imageId } = useParams();
    const navigate = useNavigate();
    const imgRef = useRef(null);

    const user = useAuthStore((state) => state.user);

    const userPresetsStorageKey = `${USER_PRESETS_STORAGE_KEY_PREFIX}-${
        user?.id ?? user?.email ?? "guest"
    }`;

    const [activeTab, setActiveTab] = useState("adjust");
    const [selectedTool, setSelectedTool] = useState(null);

    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [grayscale, setGrayscale] = useState(0);
    const [sepia, setSepia] = useState(0);
    const [hueRotate, setHueRotate] = useState(0);
    const [blur, setBlur] = useState(0);
    const [invert, setInvert] = useState(0);

    const [presetName, setPresetName] = useState("");

    const [userPresets, setUserPresets] = useState([]);

    const [removeCols, setRemoveCols] = useState(50);
    const [removeRows, setRemoveRows] = useState(0);

    const [poissonState, setPoissonState] = useState(initialPoissonState);

    const [aiMessage, setAiMessage] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const [notes, setNotes] = useState("");
    const [notesStatus, setNotesStatus] = useState("");

    const imageEditor = useEditorImage(imageId);

    const {
        imageMeta,
        setImageMeta,
        originalBlobUrl,
        processedBlobUrl,
        activeBaseUrl,
        imageDimensions,
        saving,
        error,
        setError,
        handleImageLoad: onImageLoadBase,
        saveProcessed,
        deleteProcessed,
        refreshProcessed,
    } = imageEditor;

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem(userPresetsStorageKey);
            setUserPresets(savedPresets ? JSON.parse(savedPresets) : []);
        } catch {
            setUserPresets([]);
        }
    }, [userPresetsStorageKey]);

    useEffect(() => {
        localStorage.setItem(
            userPresetsStorageKey,
            JSON.stringify(userPresets)
        );
    }, [userPresets, userPresetsStorageKey]);

    useEffect(() => {
        setNotes(imageMeta?.notes ?? "");
        setNotesStatus("");
    }, [imageMeta?.id]);

    useEffect(() => {
        if (!imageMeta?.id) return;

        const currentNotes = imageMeta.notes ?? "";

        if (notes === currentNotes) {
            return;
        }

        setNotesStatus("Saving...");

        const timeout = setTimeout(async () => {
            try {
                const updated = await imageApi.updateNotes(imageMeta.id, notes);
                setImageMeta(updated);
                setNotesStatus("Saved");
            } catch {
                setNotesStatus("Could not save notes");
            }
        }, 800);

        return () => clearTimeout(timeout);
    }, [notes, imageMeta?.id]);

    const hasActiveFilters =
        brightness !== 100 ||
        contrast !== 100 ||
        saturation !== 100 ||
        grayscale !== 0 ||
        sepia !== 0 ||
        hueRotate !== 0 ||
        blur !== 0 ||
        invert !== 0;

    const { showBefore, setShowBefore, canCompare, previewUrl } =
        useBeforeAfterPreview({
            originalBlobUrl,
            processedBlobUrl,
            activeBaseUrl,
            hasActiveFilters,
        });

    const maskCanvas = useMaskCanvas({ imgRef, selectedTool });

    const {
        maskCanvasRef,
        overlayCanvasRef,
        hasMask,
        brushSize,
        setBrushSize,
        isEraserActive,
        setIsEraserActive,
        prepareMaskCanvas,
        clearMask,
        handleMaskPointerDown,
        handleMaskPointerMove,
        stopMaskDrawing,
        closeCurrentContour,
        fillCurrentContour,
    } = maskCanvas;

    const {
        processingTool,
        applySeamCarving,
        applyProtectedSeamCarving,
        applyCriminisi,
        applyPoisson,
        applyFastInpaint,
        applyDenoise,
        applyDetailEnhance,
    } = useOpenCvTools({
        imageId,
        imageDimensions,
        async onSuccess(updatedMeta) {
            setImageMeta(updatedMeta);
            await refreshProcessed();
            clearMask();
            resetPoissonState();
            setShowBefore(false);
            resetSliders();
        },
        onError: setError,
    });

    function resetSliders() {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setGrayscale(0);
        setSepia(0);
        setHueRotate(0);
        setBlur(0);
        setInvert(0);
    }

    function applyFilterPreset(values) {
        setBrightness(values.brightness);
        setContrast(values.contrast);
        setSaturation(values.saturation);
        setGrayscale(values.grayscale);
        setSepia(values.sepia);
        setHueRotate(values.hueRotate);
        setBlur(values.blur);
        setInvert(values.invert);
        setError("");
    }

    function getCurrentFilterValues() {
        return {
            brightness,
            contrast,
            saturation,
            grayscale,
            sepia,
            hueRotate,
            blur,
            invert,
        };
    }

    function handleSaveUserPreset() {
        const trimmedName = presetName.trim();

        if (!trimmedName) {
            setError("Choose a name for your preset.");
            return;
        }

        const newPreset = {
            id:
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,
            name: trimmedName,
            values: getCurrentFilterValues(),
        };

        setUserPresets((prev) => [...prev, newPreset]);
        setPresetName("");
        setError("");
    }

    function handleDeleteUserPreset(id) {
        setUserPresets((prev) =>
            prev.filter((preset) => preset.id !== id)
        );
    }

    function revokePoissonUrls(state = poissonState) {
        if (state.sourceUrl) {
            URL.revokeObjectURL(state.sourceUrl);
        }

        if (state.maskedPreviewUrl) {
            URL.revokeObjectURL(state.maskedPreviewUrl);
        }
    }

    function resetPoissonState() {
        revokePoissonUrls();
        setPoissonState(initialPoissonState);
    }

    function handleStartPoisson() {
        setError("");
        setShowBefore(false);
        clearMask();
        resetPoissonState();
    }

    function handleCancelPoisson() {
        clearMask();
        resetPoissonState();
    }

    function handlePoissonSourceSelected(file) {
        setError("");
        clearMask();
        revokePoissonUrls();

        const sourceUrl = URL.createObjectURL(file);

        setPoissonState({
            ...initialPoissonState,
            stage: "mask",
            sourceFile: file,
            sourceUrl,
        });

        setShowBefore(false);
    }

    async function handlePoissonContinuePlacement() {
        if (!poissonState.sourceFile || !maskCanvasRef.current || !hasMask) {
            setError("Upload a source image and draw a mask first.");
            return;
        }

        try {
            const preview = await createMaskedPreviewUrl(
                poissonState.sourceFile,
                maskCanvasRef.current
            );

            if (poissonState.maskedPreviewUrl) {
                URL.revokeObjectURL(poissonState.maskedPreviewUrl);
            }

            setPoissonState((prev) => ({
                ...prev,
                stage: "placement",
                maskedPreviewUrl: preview.url,
                previewSize: {
                    width: preview.width,
                    height: preview.height,
                },
                centerX: null,
                centerY: null,
            }));

            setShowBefore(false);
        } catch (err) {
            console.error(err);
            setError("Could not create Poisson preview.");
        }
    }

    function handlePoissonPlacementClick(point) {
        setPoissonState((prev) => ({
            ...prev,
            centerX: point.x,
            centerY: point.y,
        }));
    }

    async function handleApplyPoisson() {
        if (!poissonState.sourceFile || !maskCanvasRef.current) {
            setError("Upload a source image and draw a mask first.");
            return;
        }

        if (poissonState.centerX == null || poissonState.centerY == null) {
            setError(
                "Click on the destination image to choose where to insert the object."
            );
            return;
        }

        try {
            const resizedSourceBlob = await resizeImageFileToBlob(
                poissonState.sourceFile,
                poissonState.scale
            );

            const resizedMaskBlob = await resizeMaskCanvasToBlob(
                maskCanvasRef.current,
                poissonState.scale
            );

            await applyPoisson(
                resizedSourceBlob,
                resizedMaskBlob,
                poissonState.centerX,
                poissonState.centerY,
                poissonState.mode
            );
        } catch (err) {
            console.error(err);
            setError("Could not prepare Poisson source and mask.");
        }
    }

    function handleImageLoad(event) {
        onImageLoadBase(event);

        if (
            selectedTool === "seam_protect" ||
            selectedTool === "criminisi" ||
            selectedTool === "inpaint" ||
            (selectedTool === "poisson" && poissonState.stage === "mask")
        ) {
            setTimeout(() => prepareMaskCanvas(), 0);
        }
    }

    function handleSave() {
        if (!imgRef.current) return;

        const canvas = applyFiltersToCanvas(
            imgRef.current,
            brightness,
            contrast,
            saturation,
            grayscale,
            sepia,
            hueRotate,
            blur,
            invert
        );

        saveProcessed(canvas, () => {
            setShowBefore(false);
            resetSliders();
        });
    }

    function handleExport() {
        if (!imgRef.current) return;

        const canvas = applyFiltersToCanvas(
            imgRef.current,
            brightness,
            contrast,
            saturation,
            grayscale,
            sepia,
            hueRotate,
            blur,
            invert
        );

        const baseName =
            imageMeta?.originalFileName?.replace(/\.[^.]+$/, "") || "export";

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `${baseName}_edited.png`;
            a.click();

            URL.revokeObjectURL(url);
        }, "image/png");
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

    const isPoissonMaskStage =
        selectedTool === "poisson" && poissonState.stage === "mask";

    const displayedPreviewUrl = isPoissonMaskStage
        ? poissonState.sourceUrl
        : previewUrl;

    const imageStyle = isPoissonMaskStage
        ? undefined
        : {
            filter: `
            brightness(${brightness}%)
            contrast(${contrast}%)
            saturate(${saturation}%)
            grayscale(${grayscale}%)
            sepia(${sepia}%)
            hue-rotate(${hueRotate}deg)
            blur(${blur}px)
            invert(${invert}%)
        `,
        };

    const histogramFilter = isPoissonMaskStage
        ? "none"
        : imageStyle?.filter || "none";

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
                    grayscale={grayscale}
                    setGrayscale={setGrayscale}
                    sepia={sepia}
                    setSepia={setSepia}
                    hueRotate={hueRotate}
                    setHueRotate={setHueRotate}
                    blur={blur}
                    setBlur={setBlur}
                    invert={invert}
                    setInvert={setInvert}
                    defaultFilterPresets={DEFAULT_FILTER_PRESETS}
                    userFilterPresets={userPresets}
                    presetName={presetName}
                    setPresetName={setPresetName}
                    onApplyFilterPreset={applyFilterPreset}
                    onSaveUserPreset={handleSaveUserPreset}
                    onDeleteUserPreset={handleDeleteUserPreset}
                    onResetFilters={resetSliders}
                    removeCols={removeCols}
                    setRemoveCols={setRemoveCols}
                    removeRows={removeRows}
                    setRemoveRows={setRemoveRows}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    isEraserActive={isEraserActive}
                    setIsEraserActive={setIsEraserActive}
                    imageDimensions={imageDimensions}
                    processingTool={processingTool}
                    activeBaseUrl={activeBaseUrl}
                    hasMask={hasMask}
                    onApplySeam={() =>
                        applySeamCarving(
                            "seam",
                            Number(removeCols),
                            Number(removeRows)
                        )
                    }
                    onApplyProtected={() =>
                        applyProtectedSeamCarving(
                            Number(removeCols),
                            Number(removeRows),
                            maskCanvasRef.current
                        )
                    }
                    onApplyCriminisi={() =>
                        applyCriminisi(maskCanvasRef.current, 5)
                    }
                    onApplyInpaint={(method) =>
                        applyFastInpaint(maskCanvasRef.current, method, 3)
                    }
                    onApplyDenoise={applyDenoise}
                    onApplyDetailEnhance={applyDetailEnhance}
                    onApplyPoisson={handleApplyPoisson}
                    onApplyPoisson={handleApplyPoisson}
                    onClearMask={clearMask}
                    onCloseContour={closeCurrentContour}
                    onFillContour={fillCurrentContour}
                    onPrepareMask={() => {
                        setError("");
                        setShowBefore(false);
                        setTimeout(() => prepareMaskCanvas(), 0);
                    }}
                    poissonState={poissonState}
                    onStartPoisson={handleStartPoisson}
                    onCancelPoisson={handleCancelPoisson}
                    onPoissonSourceSelected={handlePoissonSourceSelected}
                    onPoissonContinuePlacement={handlePoissonContinuePlacement}
                    onPoissonScaleChange={(scale) =>
                        setPoissonState((prev) => ({
                            ...prev,
                            scale,
                        }))
                    }
                    onPoissonModeChange={(mode) =>
                        setPoissonState((prev) => ({
                            ...prev,
                            mode,
                        }))
                    }
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
                        onDeleteProcessed={handleDeleteProcessed}
                        onExport={handleExport}
                        onSave={handleSave}
                    />

                    <EditorCanvas
                        imgRef={imgRef}
                        maskCanvasRef={maskCanvasRef}
                        overlayCanvasRef={overlayCanvasRef}
                        previewUrl={displayedPreviewUrl}
                        imageStyle={imageStyle}
                        histogramFilter={histogramFilter}
                        showBefore={showBefore}
                        canCompare={canCompare}
                        selectedTool={selectedTool}
                        error={error}
                        onImageLoad={handleImageLoad}
                        onPointerDown={handleMaskPointerDown}
                        onPointerMove={handleMaskPointerMove}
                        onPointerUp={stopMaskDrawing}
                        poissonStage={poissonState.stage}
                        poissonPreviewUrl={poissonState.maskedPreviewUrl}
                        poissonPreviewSize={poissonState.previewSize}
                        poissonCenter={
                            poissonState.centerX != null &&
                            poissonState.centerY != null
                                ? {
                                    x: poissonState.centerX,
                                    y: poissonState.centerY,
                                }
                                : null
                        }
                        poissonScale={poissonState.scale}
                        onPoissonPlacementClick={handlePoissonPlacementClick}
                    />

                    <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Image notes
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Write observations or details about this image.
                                    Notes are saved automatically.
                                </p>
                            </div>

                            <span className="text-xs text-gray-400">
                                {notesStatus}
                            </span>
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Write notes about this image..."
                            maxLength={2000}
                            className="min-h-28 w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                        />

                        <p className="mt-2 text-right text-xs text-gray-400">
                            {notes.length}/2000
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}