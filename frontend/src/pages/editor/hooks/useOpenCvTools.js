import { useState } from "react";
import { imageApi } from "@/lib/api";
import { validateSeamCarvingParams } from "../utils/validation";

export function useOpenCvTools({ imageId, imageDimensions, onSuccess, onError }) {
    const [processingTool, setProcessingTool] = useState(false);

    async function applySeamCarving(algorithm, cols, rows) {
        setProcessingTool(true);

        const validationError = validateSeamCarvingParams(cols, rows, imageDimensions);
        if (validationError) {
            onError(validationError);
            setProcessingTool(false);
            return;
        }

        try {
            const updated = await imageApi.processOpenCv(imageId, {
                algorithm,
                removeCols: cols,
                removeRows: rows,
            });
            await onSuccess(updated);
        } catch (err) {
            console.error(err);
            onError("OpenCV processing failed.");
        } finally {
            setProcessingTool(false);
        }
    }

    async function applyProtectedSeamCarving(cols, rows, maskCanvas) {
        setProcessingTool(true);

        const validationError = validateSeamCarvingParams(cols, rows,imageDimensions);
        if (validationError) {
            onError(validationError);
            setProcessingTool(false);
            return;
        }

        if (!maskCanvas) {
            onError("Draw a protection mask before applying protected seam carving.");
            setProcessingTool(false);
            return;
        }

        try {
            maskCanvas.toBlob(async (blob) => {
                try {
                    const formData = new FormData();
                    formData.append("mask", blob, "protection-mask.png");

                    const updated = await imageApi.processOpenCvWithMask(
                        imageId,
                        { algorithm: "seam_protect", removeCols: cols, removeRows: rows },
                        formData
                    );
                    await onSuccess(updated);
                } catch (err) {
                    console.error(err);
                    onError("Protected seam carving failed.");
                } finally {
                    setProcessingTool(false);
                }
            }, "image/png");
        } catch (err) {
            console.error(err);
            onError("Could not export mask.");
            setProcessingTool(false);
        }
    }

    return { processingTool, applySeamCarving, applyProtectedSeamCarving };
}
