import { useRef, useState } from "react";

export function useMaskCanvas({ imgRef, selectedTool }) {
    const maskCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const drawingRef = useRef(false);
    const contourPointsRef = useRef([]);
    const isContourClosedRef = useRef(false);

    const [hasMask, setHasMask] = useState(false);
    const [brushSize, setBrushSize] = useState(24);
    const [isEraserActive, setIsEraserActive] = useState(false);

    function canDrawWithCurrentTool() {
        return (
            selectedTool === "seam_protect" ||
            selectedTool === "criminisi" ||
            selectedTool === "inpaint" ||
            selectedTool === "poisson"
        );
    }

    function prepareMaskCanvas() {
        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!img || !maskCanvas || !overlayCanvas) return;

        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        if (!naturalWidth || !naturalHeight) return;

        const rect = img.getBoundingClientRect();
        const displayWidth = Math.round(rect.width);
        const displayHeight = Math.round(rect.height);

        overlayCanvas.width = displayWidth;
        overlayCanvas.height = displayHeight;
        overlayCanvas.style.width = `${displayWidth}px`;
        overlayCanvas.style.height = `${displayHeight}px`;

        const overlayCtx = overlayCanvas.getContext("2d");
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        maskCanvas.width = naturalWidth;
        maskCanvas.height = naturalHeight;

        const maskCtx = maskCanvas.getContext("2d");
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        contourPointsRef.current = [];
        isContourClosedRef.current = false;
        setIsEraserActive(false);
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

        contourPointsRef.current = [];
        isContourClosedRef.current = false;
        setHasMask(false);
    }

    function getPointerPosition(event) {
        const img = imgRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!img || !overlayCanvas) return null;

        const rect = overlayCanvas.getBoundingClientRect();
        const touch = event.touches?.[0] ?? event.changedTouches?.[0];

        const clientX = event.clientX ?? touch?.clientX;
        const clientY = event.clientY ?? touch?.clientY;

        if (clientX == null || clientY == null) return null;

        const displayX = clientX - rect.left;
        const displayY = clientY - rect.top;

        if (
            displayX < 0 ||
            displayY < 0 ||
            displayX > rect.width ||
            displayY > rect.height
        ) {
            return null;
        }

        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;

        return {
            displayX,
            displayY,
            realX: displayX * scaleX,
            realY: displayY * scaleY,
            realBrush: brushSize * ((scaleX + scaleY) / 2),
        };
    }

    function drawCircle(ctx, x, y, radius, fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function eraseOverlayCircle(ctx, x, y, radius) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawMaskPoint(event) {
        if (!canDrawWithCurrentTool()) return;

        const position = getPointerPosition(event);
        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!position || !img || !maskCanvas || !overlayCanvas) return;

        const { displayX, displayY, realX, realY, realBrush } = position;

        const maskCtx = maskCanvas.getContext("2d");
        const overlayCtx = overlayCanvas.getContext("2d");

        if (isEraserActive) {
            drawCircle(maskCtx, realX, realY, realBrush / 2, "black");
            eraseOverlayCircle(overlayCtx, displayX, displayY, brushSize / 2);
            return;
        }

        contourPointsRef.current.push({
            displayX,
            displayY,
            realX,
            realY,
        });

        isContourClosedRef.current = false;

        drawCircle(maskCtx, realX, realY, realBrush / 2, "white");

        drawCircle(
            overlayCtx,
            displayX,
            displayY,
            brushSize / 2,
            "rgba(59, 130, 246, 0.45)"
        );

        setHasMask(true);
    }

    function drawClosingLine(ctx, points, options = {}) {
        if (!ctx || !points || points.length < 2) return;

        const { xKey, yKey, strokeStyle, lineWidth } = options;

        const first = points[0];
        const last = points[points.length - 1];

        ctx.save();

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(last[xKey], last[yKey]);
        ctx.lineTo(first[xKey], first[yKey]);
        ctx.stroke();

        ctx.restore();
    }

    function fillContour(ctx, points, options = {}) {
        if (!ctx || !points || points.length < 3) return;

        const { xKey, yKey, fillStyle } = options;

        ctx.save();

        ctx.fillStyle = fillStyle;

        ctx.beginPath();
        ctx.moveTo(points[0][xKey], points[0][yKey]);

        for (let i = 1; i < points.length; i += 1) {
            ctx.lineTo(points[i][xKey], points[i][yKey]);
        }

        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function closeCurrentContour() {
        if (isEraserActive) return;

        const points = contourPointsRef.current;

        if (!points || points.length < 2) return;

        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!img || !maskCanvas || !overlayCanvas) return;

        const scaleX = maskCanvas.width / overlayCanvas.width;
        const scaleY = maskCanvas.height / overlayCanvas.height;
        const realBrush = brushSize * ((scaleX + scaleY) / 2);

        const maskCtx = maskCanvas.getContext("2d");
        drawClosingLine(maskCtx, points, {
            xKey: "realX",
            yKey: "realY",
            strokeStyle: "white",
            lineWidth: realBrush,
        });

        const overlayCtx = overlayCanvas.getContext("2d");
        drawClosingLine(overlayCtx, points, {
            xKey: "displayX",
            yKey: "displayY",
            strokeStyle: "rgba(59, 130, 246, 0.65)",
            lineWidth: brushSize,
        });

        isContourClosedRef.current = true;
        setHasMask(true);
    }

    function fillCurrentContour() {
        if (isEraserActive) return;

        const points = contourPointsRef.current;

        if (!points || points.length < 3) return;

        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!maskCanvas || !overlayCanvas) return;

        const maskCtx = maskCanvas.getContext("2d");
        fillContour(maskCtx, points, {
            xKey: "realX",
            yKey: "realY",
            fillStyle: "white",
        });

        const overlayCtx = overlayCanvas.getContext("2d");
        fillContour(overlayCtx, points, {
            xKey: "displayX",
            yKey: "displayY",
            fillStyle: "rgba(59, 130, 246, 0.45)",
        });

        isContourClosedRef.current = true;
        setHasMask(true);
    }

    function handleMaskPointerDown(event) {
        event.preventDefault();

        if (!canDrawWithCurrentTool()) return;

        if (!isEraserActive) {
            contourPointsRef.current = [];
            isContourClosedRef.current = false;
        }

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
        isEraserActive,
        setIsEraserActive,
        prepareMaskCanvas,
        clearMask,
        handleMaskPointerDown,
        handleMaskPointerMove,
        stopMaskDrawing,
        closeCurrentContour,
        fillCurrentContour,
    };
}