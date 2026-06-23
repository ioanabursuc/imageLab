import { useState, useEffect } from "react";

export function useBeforeAfterPreview({
                                          originalBlobUrl,
                                          processedBlobUrl,
                                          activeBaseUrl,
                                          hasActiveFilters = false,
                                      }) {
    const [showBefore, setShowBefore] = useState(false);

    const canCompare = Boolean(
        originalBlobUrl && (processedBlobUrl || hasActiveFilters)
    );

    const previewUrl =
        showBefore && processedBlobUrl ? originalBlobUrl : activeBaseUrl;

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.code !== "Space") return;
            if (!canCompare) return;

            const target = event.target;
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            if (isTyping) return;

            event.preventDefault();
            setShowBefore(true);
        }

        function handleKeyUp(event) {
            if (event.code !== "Space") return;

            if (canCompare) {
                event.preventDefault();
            }

            setShowBefore(false);
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [canCompare]);

    return { showBefore, setShowBefore, canCompare, previewUrl };
}