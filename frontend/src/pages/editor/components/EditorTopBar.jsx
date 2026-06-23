import { Download, Save, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditorTopBar({
    imageMeta,
    processedBlobUrl,
    saving,
    error,
    onBack,
    onDeleteProcessed,
    onExport,
    onSave,
}) {
    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-800"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="flex flex-wrap justify-end gap-2">
                    {imageMeta?.hasProcessed && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={onDeleteProcessed}
                        >
                            <Trash2 size={16} /> Delete Edited
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download size={16} /> Export
                    </Button>

                    <Button size="sm" onClick={onSave} disabled={saving}>
                        <Save size={16} /> {saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {error && (
                <p className="mb-4 text-center text-sm text-red-500">{error}</p>
            )}
        </>
    );
}
