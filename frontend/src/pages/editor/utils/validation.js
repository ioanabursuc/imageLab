export function validateSeamCarvingParams(cols, rows, dimensions = {}) {
    if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
        return "Number of columns and rows must be valid integers.";
    }

    if (cols < 0 || rows < 0) {
        return "Number of columns and rows cannot be negative.";
    }

    if (dimensions.width > 0 && cols >= dimensions.width) {
        return "You cannot remove more columns than the image width.";
    }

    if (dimensions.height > 0 && rows >= dimensions.height) {
        return "You cannot remove more rows than the image height.";
    }

    if (cols === 0 && rows === 0) {
        return "Set at least one value greater than 0 for columns or rows.";
    }

    return null;
}
