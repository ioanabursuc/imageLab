import { useState } from "react";
import { Button } from "@/components/ui/button";
import BrushSizeControl from "../components/BrushSizeControl";

export default function OpenCvInpaintTool({
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
    const [method, setMethod] = useState("telea");

    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
                OpenCV Inpaint
            </p>

            <p className="mb-3 text-xs leading-relaxed text-gray-500">
                Fast object removal using OpenCV inpainting. It works best for
                small or medium masked areas.
            </p>

            <label className="mb-2 block text-xs font-medium text-gray-600">
                Method
            </label>

            <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={processingTool}
                className="mb-4 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400"
            >
                <option value="telea">Telea</option>
                <option value="ns">Navier-Stokes</option>
            </select>

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
                    disabled={processingTool}
                >
                    Clear Mask
                </Button>

                <Button
                    type="button"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => onApply(method)}
                    disabled={processingTool || !hasMask}
                >
                    {processingTool ? "Applying..." : "Apply"}
                </Button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
                Use this when Criminisi would be too slow. For large objects,
                the result may look smoother or less realistic.
            </p>
        </div>
    );
}