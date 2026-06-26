import { Button } from "@/components/ui/button";

export default function DetailEnhanceTool({
                                              processingTool,
                                              activeBaseUrl,
                                              onApply,
                                          }) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
                Detail Enhance
            </p>

            <p className="mb-4 text-xs leading-relaxed text-gray-500">
                Enhances local details while keeping the image natural.
            </p>

            <Button
                type="button"
                size="sm"
                className="w-full rounded-lg"
                onClick={onApply}
                disabled={processingTool || !activeBaseUrl}
            >
                {processingTool ? "Applying..." : "Apply Detail Enhance"}
            </Button>
        </div>
    );
}