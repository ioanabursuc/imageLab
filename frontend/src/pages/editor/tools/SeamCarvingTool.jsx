import { Button } from "@/components/ui/button";
import NumberControl from "../components/NumberControl";

export default function SeamCarvingTool({
    removeCols,
    setRemoveCols,
    removeRows,
    setRemoveRows,
    imageDimensions,
    processingTool,
    activeBaseUrl,
    onApply,
}) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
                Seam Carving Settings
            </p>

            <div className="space-y-3">
                <NumberControl
                    label="Columns to remove"
                    value={removeCols}
                    onChange={setRemoveCols}
                    max={Math.max(imageDimensions.width - 1, 0)}
                />

                <NumberControl
                    label="Rows to remove"
                    value={removeRows}
                    onChange={setRemoveRows}
                    max={Math.max(imageDimensions.height - 1, 0)}
                />
            </div>

            <Button
                type="button"
                size="sm"
                className="mt-4 w-full rounded-lg"
                onClick={onApply}
                disabled={processingTool || !activeBaseUrl}
            >
                {processingTool ? "Applying..." : "Apply"}
            </Button>
        </div>
    );
}
