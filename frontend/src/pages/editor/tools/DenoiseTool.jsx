import { Button } from "@/components/ui/button";

export default function DenoiseTool({
                                        processingTool,
                                        activeBaseUrl,
                                        onApply,
                                    }) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">
                Denoise
            </p>

            <p className="mb-4 text-xs leading-relaxed text-gray-500">
                Reduces image noise and grain using OpenCV non-local means
                denoising.
            </p>

            <Button
                type="button"
                size="sm"
                className="w-full rounded-lg"
                onClick={onApply}
                disabled={processingTool || !activeBaseUrl}
            >
                {processingTool ? "Applying..." : "Apply Denoise"}
            </Button>
        </div>
    );
}