import { Button } from "@/components/ui/button";
import BrushSizeControl from "../components/BrushSizeControl";

export default function PoissonTool({
                                        stage,
                                        sourceFile,
                                        brushSize,
                                        setBrushSize,
                                        isEraserActive,
                                        setIsEraserActive,
                                        hasMask,
                                        processingTool,
                                        centerX,
                                        centerY,
                                        scale,
                                        mode,
                                        onSourceSelected,
                                        onContinuePlacement,
                                        onClearMask,
                                        onCloseContour,
                                        onFillContour,
                                        onScaleChange,
                                        onModeChange,
                                        onApply,
                                        onCancel,
                                    }) {
    const isMaskStage = stage === "mask";
    const isPlacementStage = stage === "placement";

    return (
        <div className="rounded-xl border bg-white p-4 space-y-4">
            <div>
                <p className="text-sm font-semibold text-gray-700">Poisson Editing</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    The current editor image is the destination. Upload a source image,
                    draw the source mask, then choose where to blend it.
                </p>
            </div>

            {!isPlacementStage && (
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                        Source image
                    </label>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="w-full text-xs"
                        disabled={processingTool}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onSourceSelected(file);
                        }}
                    />

                    {sourceFile && (
                        <p className="mt-1 truncate text-[11px] text-gray-400">
                            Selected: {sourceFile.name}
                        </p>
                    )}
                </div>
            )}

            {isMaskStage && (
                <>
                    <div className="rounded-md bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
                        Draw with the brush over the object from the source image.
                        White mask area will be cloned into the destination.
                    </div>

                    <BrushSizeControl value={brushSize} onChange={setBrushSize} />

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={!isEraserActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEraserActive(false)}
                            disabled={processingTool}
                            className="rounded-lg"
                        >
                            Brush
                        </Button>

                        <Button
                            type="button"
                            variant={isEraserActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEraserActive(true)}
                            disabled={processingTool}
                            className="rounded-lg"
                        >
                            Eraser
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCloseContour}
                            disabled={processingTool || !hasMask || isEraserActive}
                            className="rounded-lg"
                        >
                            Close contour
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onFillContour}
                            disabled={processingTool || !hasMask || isEraserActive}
                            className="rounded-lg"
                        >
                            Fill contour
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onClearMask}
                            disabled={processingTool || !hasMask}
                            className="rounded-lg"
                        >
                            Clear mask
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={onContinuePlacement}
                            disabled={processingTool || !hasMask}
                            className="rounded-lg"
                        >
                            Choose placement
                        </Button>
                    </div>
                </>
            )}

            {isPlacementStage && (
                <>
                    <div className="rounded-md bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
                        Click on the destination image to choose the center point.
                        Use the scale slider to preview the object size before applying.
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                            Clone mode
                        </label>
                        <select
                            value={mode}
                            onChange={(event) => onModeChange(event.target.value)}
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            disabled={processingTool}
                        >
                            <option value="normal">Normal clone</option>
                            <option value="mixed">Mixed clone</option>
                            <option value="mono">Monochrome transfer</option>
                        </select>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">
                                Object scale
                            </span>
                            <span className="text-xs text-gray-500">
                                {Math.round(scale * 100)}%
                            </span>
                        </div>

                        <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.05"
                            value={scale}
                            onChange={(event) =>
                                onScaleChange(Number(event.target.value))
                            }
                            className="w-full"
                            disabled={processingTool}
                        />
                    </div>

                    <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                        Center point:{" "}
                        {centerX != null && centerY != null
                            ? `${centerX}, ${centerY}`
                            : "not selected yet"}
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={onApply}
                        disabled={processingTool || centerX == null || centerY == null}
                    >
                        {processingTool ? "Processing..." : "Apply Poisson Editing"}
                    </Button>
                </>
            )}

            <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={processingTool}
            >
                Cancel Poisson
            </Button>
        </div>
    );
}