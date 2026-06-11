export function applyFiltersToCanvas(imgElement, brightness, contrast, saturation,grayscale, sepia, hueRotate, blur, invert) {
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.filter = `brightness(${brightness}%) 
    contrast(${contrast}%) 
    saturate(${saturation}%)
    grayscale(${grayscale}%)
    sepia(${sepia}%)
    hue-rotate(${hueRotate}deg)
    blur(${blur}px)
    invert(${invert}%)`;
    ctx.drawImage(imgElement, 0, 0);

    return canvas;
}
