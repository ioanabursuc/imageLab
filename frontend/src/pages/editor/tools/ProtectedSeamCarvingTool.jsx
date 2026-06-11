import { Button } from "@/components/ui/button";
import NumberControl from "../components/NumberControl";
import BrushSizeControl from "../components/BrushSizeControl";

export default function ProtectedSeamCarvingTool({
    removeCols,
    setRemoveCols,
    removeRows,
    setRemoveRows,
    brushSize,
    setBrushSize,
    isEraserActive,
    setIsEraserActive,
    imageDimensions,
    processingTool,
    hasMask,
    onApply,
    onClear,
    onCloseContour,
    onFillContour,
}) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
                Protection Mask Settings
            </p>

            <div className="space-y-3">
                <NumberControl
                    label="Columns to remove"
                    value={removeCols}
                    onChange={setRemoveCols}
                    max={Math.max(imageDimensions.width - 1, 0)}
                />

                <NumberControl
                    label="Rows to remove"
                    value={removeRows}
                    onChange={setRemoveRows}
                    max={Math.max(imageDimensions.height - 1, 0)}
                />

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
            </div>

            <div className="mt-4 flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={onClear}
                >
                    Clear Mask
                </Button>

                <Button
                    type="button"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={onApply}
                    disabled={processingTool || !hasMask}
                >
                    {processingTool ? "Applying..." : "Apply"}
                </Button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
                Draw over important areas. Blue overlay marks the protected region.
            </p>
        </div>
    );
}
