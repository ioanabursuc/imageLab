export function drawContourLine(ctx, points, options = {}) {
    if (!ctx || !points || points.length < 2) return;

    const {
        xKey = "x",
        yKey = "y",
        strokeStyle = "white",
        lineWidth = 10,
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

export function fillClosedContour(ctx, points, options = {}) {
    if (!ctx || !points || points.length < 3) return;

    const {
        xKey = "x",
        yKey = "y",
        fillStyle = "white",
    } = options;

    ctx.save();

    ctx.fillStyle = fillStyle;

    ctx.beginPath();
    ctx.moveTo(points[0][xKey], points[0][yKey]);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][xKey], points[i][yKey]);
    }

    ctx.closePath();
    ctx.fill();

    ctx.restore();
}