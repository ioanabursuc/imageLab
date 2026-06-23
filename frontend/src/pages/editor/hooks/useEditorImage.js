import { useState, useEffect, useCallback } from "react";
import { imageApi } from "@/lib/api";

export function useEditorImage(imageId) {
    const [imageMeta, setImageMeta] = useState(null);
    const [originalBlobUrl, setOriginalBlobUrl] = useState(null);
    const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
    const [activeBaseUrl, setActiveBaseUrl] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadImage = useCallback(async () => {
        try {
            setError("");

            const meta = await imageApi.getById(imageId);
            setImageMeta(meta);

            const origUrl = await imageApi.getFile(imageId);
            setOriginalBlobUrl(origUrl);

            if (meta.hasProcessed) {
                const procUrl = await imageApi.getProcessedFile(imageId);
                setProcessedBlobUrl(procUrl);
                setActiveBaseUrl(procUrl);
            } else {
                setProcessedBlobUrl(null);
                setActiveBaseUrl(origUrl);
            }
        } catch {
            setError("Image not found.");
        }
    }, [imageId]);

    useEffect(() => {
        loadImage();

        return () => {
            setOriginalBlobUrl((url) => {
                if (url) URL.revokeObjectURL(url);
                return null;
            });

            setProcessedBlobUrl((url) => {
                if (url) URL.revokeObjectURL(url);
                return null;
            });
        };
    }, [loadImage]);

    function handleImageLoad(event) {
        setImageDimensions({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
        });
    }

    async function saveProcessed(canvas, onAfterSave) {
        if (!canvas) {
            setError("Failed to save. The processed image could not be created.");
            return;
        }

        setSaving(true);
        setError("");

        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    setError("Failed to save. The processed image could not be created.");
                    setSaving(false);
                    return;
                }

                const maxUploadSize = 10 * 1024 * 1024;

                if (blob.size > maxUploadSize) {
                    setError(
                        "Failed to save. The processed image may be too large."
                    );
                    setSaving(false);
                    return;
                }

                try {
                    const fd = new FormData();
                    fd.append("file", blob, "processed.jpg");

                    const updated = await imageApi.saveProcessed(imageId, fd);
                    setImageMeta(updated);

                    const newProcUrl = await imageApi.getProcessedFile(imageId);

                    setProcessedBlobUrl((old) => {
                        if (old) URL.revokeObjectURL(old);
                        return newProcUrl;
                    });

                    setActiveBaseUrl(newProcUrl);

                    onAfterSave?.();
                } catch (err) {
                    console.error(err);

                    if (err?.status === 413) {
                        setError(
                            "Failed to save. The processed image may be too large."
                        );
                    } else {
                        setError("Failed to save. Please try again.");
                    }
                } finally {
                    setSaving(false);
                }
            },
            "image/jpeg",
            0.9
        );
    }

    async function deleteProcessed(onAfterDelete) {
        try {
            await imageApi.revertProcessed(imageId);

            if (processedBlobUrl) URL.revokeObjectURL(processedBlobUrl);

            setProcessedBlobUrl(null);
            setActiveBaseUrl(originalBlobUrl);
            setImageMeta((prev) => ({ ...prev, hasProcessed: false }));

            onAfterDelete?.();
        } catch {
            setError("Failed to delete edited version.");
        }
    }

    async function refreshProcessed() {
        const newProcessedUrl = await imageApi.getProcessedFile(imageId);
        setProcessedBlobUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return newProcessedUrl;
        });
        setActiveBaseUrl(newProcessedUrl);
    }

    return {
        imageMeta,
        setImageMeta,
        originalBlobUrl,
        processedBlobUrl,
        activeBaseUrl,
        setActiveBaseUrl,
        imageDimensions,
        saving,
        error,
        setError,
        handleImageLoad,
        saveProcessed,
        deleteProcessed,
        refreshProcessed,
    };
}
