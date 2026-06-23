import { useState } from "react";
import { imageApi } from "@/lib/api";
import { validateSeamCarvingParams } from "../utils/validation";

const CRIMINISI_MAX_MASK_RATIO = 0.08;
const CRIMINISI_MAX_MASK_PIXELS = 120000;

function getMaskStats(maskCanvas) {
    const ctx = maskCanvas.getContext("2d");
    const { width, height } = maskCanvas;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let maskPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 20 || g > 20 || b > 20) {
            maskPixels += 1;
        }
    }

    const totalPixels = width * height;
    const ratio = totalPixels > 0 ? maskPixels / totalPixels : 0;

    return {
        maskPixels,
        totalPixels,
        ratio,
    };
}

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
            onError(err?.data?.error || "OpenCV processing failed.");
        } finally {
            setProcessingTool(false);
        }
    }

    async function applyProtectedSeamCarving(cols, rows, maskCanvas) {
        setProcessingTool(true);

        const validationError = validateSeamCarvingParams(cols, rows, imageDimensions);
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
                        {
                            algorithm: "seam_protect",
                            removeCols: cols,
                            removeRows: rows,
                        },
                        formData
                    );

                    await onSuccess(updated);
                } catch (err) {
                    console.error(err);
                    onError(err?.data?.error || "Protected seam carving failed.");
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

    async function applyCriminisi(maskCanvas, patchRadius = 5) {
        setProcessingTool(true);

        if (!maskCanvas) {
            onError("Draw a mask over the area you want to remove.");
            setProcessingTool(false);
            return;
        }

        const maskStats = getMaskStats(maskCanvas);

        if (maskStats.maskPixels === 0) {
            onError("Draw a mask over the area you want to remove.");
            setProcessingTool(false);
            return;
        }

        if (
            maskStats.ratio > CRIMINISI_MAX_MASK_RATIO ||
            maskStats.maskPixels > CRIMINISI_MAX_MASK_PIXELS
        ) {
            const selectedPercent = Math.round(maskStats.ratio * 100);

            onError(
                `The selected area is too large for Criminisi inpainting (${selectedPercent}% of the image). Please select a smaller object or split the removal into multiple smaller steps.`
            );

            setProcessingTool(false);
            return;
        }

        try {
            maskCanvas.toBlob(async (blob) => {
                try {
                    const formData = new FormData();
                    formData.append("mask", blob, "criminisi-mask.png");

                    const updated = await imageApi.processOpenCvWithMask(
                        imageId,
                        {
                            algorithm: "criminisi",
                            patchRadius,
                        },
                        formData
                    );

                    await onSuccess(updated);
                } catch (err) {
                    console.error(err);
                    onError(err?.data?.error || "Criminisi inpainting failed.");
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

    async function applyPoisson(sourceBlob, maskBlob, centerX, centerY, mode = "normal") {
        setProcessingTool(true);

        if (!sourceBlob || !maskBlob) {
            onError("Upload a source image and draw a mask before applying Poisson editing.");
            setProcessingTool(false);
            return false;
        }

        if (centerX == null || centerY == null) {
            onError("Choose the destination point where the object should be inserted.");
            setProcessingTool(false);
            return false;
        }

        try {
            const formData = new FormData();
            formData.append("source", sourceBlob, "poisson-source.png");
            formData.append("mask", maskBlob, "poisson-mask.png");

            const updated = await imageApi.processPoisson(
                imageId,
                {
                    centerX,
                    centerY,
                    mode,
                },
                formData
            );

            await onSuccess(updated);
            return true;
        } catch (err) {
            console.error(err);
            onError(err?.data?.error || "Poisson editing failed.");
            return false;
        } finally {
            setProcessingTool(false);
        }
    }

    return {
        processingTool,
        applySeamCarving,
        applyProtectedSeamCarving,
        applyCriminisi,
        applyPoisson,
    };
}