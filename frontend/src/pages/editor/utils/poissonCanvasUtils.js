export async function createMaskedPreviewUrl(sourceFile, maskCanvas) {
    const sourceBitmap = await createImageBitmap(sourceFile);

    const canvas = document.createElement("canvas");
    canvas.width = sourceBitmap.width;
    canvas.height = sourceBitmap.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(sourceBitmap, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const normalizedMaskCanvas = document.createElement("canvas");
    normalizedMaskCanvas.width = canvas.width;
    normalizedMaskCanvas.height = canvas.height;

    const normalizedMaskCtx = normalizedMaskCanvas.getContext("2d");
    normalizedMaskCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    const maskData = normalizedMaskCtx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
        const maskValue = maskData.data[i];
        imageData.data[i + 3] = maskValue;
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not create Poisson preview."));
                return;
            }

            resolve({
                url: URL.createObjectURL(blob),
                width: canvas.width,
                height: canvas.height,
            });
        }, "image/png");
    });
}

export async function resizeImageFileToBlob(file, scale) {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not resize Poisson source."));
                return;
            }

            resolve(blob);
        }, "image/png");
    });
}

export function resizeMaskCanvasToBlob(maskCanvas, scale) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(maskCanvas.width * scale));
    canvas.height = Math.max(1, Math.round(maskCanvas.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not resize Poisson mask."));
                return;
            }

            resolve(blob);
        }, "image/png");
    });
}