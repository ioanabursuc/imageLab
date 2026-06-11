import { useRef, useState } from "react";

export function useMaskCanvas({ imgRef, selectedTool }) {
    const maskCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const drawingRef = useRef(false);
    const contourPointsRef = useRef([]);
    const isContourClosedRef = useRef(false);

    const [hasMask, setHasMask] = useState(false);
    const [brushSize, setBrushSize] = useState(24);

    function canDrawWithCurrentTool() {
        return (
            selectedTool === "seam_protect" ||
            selectedTool === "criminisi" ||
            selectedTool === "poisson"
        );
    }

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

        contourPointsRef.current = [];
        isContourClosedRef.current = false;
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

    function drawCircle(ctx, x, y, radius, fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawMaskPoint(event) {
        if (!canDrawWithCurrentTool()) return;

        const position = getPointerPosition(event);
        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!position || !img || !maskCanvas || !overlayCanvas) return;

        const { displayX, displayY, displayWidth } = position;

        const realX = (displayX / displayWidth) * img.naturalWidth;
        const realY = (displayY / position.displayHeight) * img.naturalHeight;
        const realBrush = (brushSize / displayWidth) * img.naturalWidth;

        contourPointsRef.current.push({
            displayX,
            displayY,
            realX,
            realY,
        });

        isContourClosedRef.current = false;

        const maskCtx = maskCanvas.getContext("2d");
        drawCircle(maskCtx, realX, realY, realBrush / 2, "white");

        const overlayCtx = overlayCanvas.getContext("2d");
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

        const {
            xKey,
            yKey,
            strokeStyle,
            lineWidth,
        } = options;

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

        const {
            xKey,
            yKey,
            fillStyle,
        } = options;

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
        const points = contourPointsRef.current;

        if (!points || points.length < 2) return;

        const img = imgRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!img || !maskCanvas || !overlayCanvas) return;

        const overlayRect = overlayCanvas.getBoundingClientRect();
        const displayWidth = overlayCanvas.width || overlayRect.width;
        const realBrush = (brushSize / displayWidth) * img.naturalWidth;

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

        contourPointsRef.current = [];
        isContourClosedRef.current = false;
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
        closeCurrentContour,
        fillCurrentContour,
    };
}