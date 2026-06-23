import { Button } from "@/components/ui/button";
import BrushSizeControl from "../components/BrushSizeControl";

export default function CriminisiTool({
                                          brushSize,
                                          setBrushSize,
                                          isEraserActive,
                                          setIsEraserActive,
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
                Criminisi Inpainting
            </p>

            <p className="mb-3 text-xs text-gray-500 leading-relaxed">
                Draw over a small object or area you want to remove. Criminisi works best
                on limited regions with similar surrounding texture.
            </p>

            <BrushSizeControl value={brushSize} onChange={setBrushSize} />

            <div className="mt-3 grid grid-cols-2 gap-2">
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

            <div className="mt-3 grid grid-cols-2 gap-2">
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
                Blue overlay marks the area that will be removed. For large objects, use
                several smaller selections instead of one big mask.
            </p>
        </div>
    );
}