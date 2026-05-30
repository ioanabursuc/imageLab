import { useRef, useState } from "react";

export function useMaskCanvas({ imgRef, selectedTool }) {
    const maskCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const drawingRef = useRef(false);

    const [hasMask, setHasMask] = useState(false);
    const [brushSize, setBrushSize] = useState(24);

    function prepareMaskCanvas() {
        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!img || !maskCanvas || !overlayCanvas) return;

        maskCanvas.width = img.naturalWidth;
        maskCanvas.height = img.naturalHeight;

        const maskCtx = maskCanvas.getContext("2d");
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        const rect = img.getBoundingClientRect();
        overlayCanvas.width = rect.width;
        overlayCanvas.height = rect.height;

        const overlayCtx = overlayCanvas.getContext("2d");
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        setHasMask(false);
    }

    function clearMask() {
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (maskCanvas) {
            const maskCtx = maskCanvas.getContext("2d");
            maskCtx.fillStyle = "black";
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        }

        if (overlayCanvas) {
            const overlayCtx = overlayCanvas.getContext("2d");
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }

        setHasMask(false);
    }

    function getPointerPosition(event) {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return null;

        const rect = overlayCanvas.getBoundingClientRect();
        const clientX = event.clientX ?? event.touches?.[0]?.clientX;
        const clientY = event.clientY ?? event.touches?.[0]?.clientY;

        if (clientX == null || clientY == null) return null;

        return {
            displayX: clientX - rect.left,
            displayY: clientY - rect.top,
            displayWidth: rect.width,
            displayHeight: rect.height,
        };
    }

    function drawMaskPoint(event) {
        if (
            selectedTool !== "seam_protect" &&
            selectedTool !== "criminisi" &&
            selectedTool !== "poisson"
        ) return;

        const position = getPointerPosition(event);
        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!position || !img || !maskCanvas || !overlayCanvas) return;

        const { displayX, displayY, displayWidth, displayHeight } = position;

        const realX = (displayX / displayWidth) * img.naturalWidth;
        const realY = (displayY / displayHeight) * img.naturalHeight;
        const realBrush = (brushSize / displayWidth) * img.naturalWidth;

        const maskCtx = maskCanvas.getContext("2d");
        maskCtx.fillStyle = "white";
        maskCtx.beginPath();
        maskCtx.arc(realX, realY, realBrush / 2, 0, Math.PI * 2);
        maskCtx.fill();

        const overlayCtx = overlayCanvas.getContext("2d");
        overlayCtx.fillStyle = "rgba(59, 130, 246, 0.45)";
        overlayCtx.beginPath();
        overlayCtx.arc(displayX, displayY, brushSize / 2, 0, Math.PI * 2);
        overlayCtx.fill();

        setHasMask(true);
    }

    function handleMaskPointerDown(event) {
        event.preventDefault();
        drawingRef.current = true;
        drawMaskPoint(event);
    }

    function handleMaskPointerMove(event) {
        if (!drawingRef.current) return;
        event.preventDefault();
        drawMaskPoint(event);
    }

    function stopMaskDrawing() {
        drawingRef.current = false;
    }

    return {
        maskCanvasRef,
        overlayCanvasRef,
        hasMask,
        brushSize,
        setBrushSize,
        prepareMaskCanvas,
        clearMask,
        handleMaskPointerDown,
        handleMaskPointerMove,
        stopMaskDrawing,
    };
}