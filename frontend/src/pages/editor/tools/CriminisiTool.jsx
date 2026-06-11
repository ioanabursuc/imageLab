import { Button } from "@/components/ui/button";
import BrushSizeControl from "../components/BrushSizeControl";

export default function CriminisiTool({
                                          brushSize,
                                          setBrushSize,
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
                Draw over the object or area you want to remove. The selected region
                will be reconstructed using surrounding texture.
            </p>

            <BrushSizeControl value={brushSize} onChange={setBrushSize} />

            <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCloseContour}
                    disabled={processingTool || !hasMask}
                    className="rounded-lg"
                >
                    Close contour
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onFillContour}
                    disabled={processingTool || !hasMask}
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
                Blue overlay marks the area that will be removed.
            </p>
        </div>
    );
}