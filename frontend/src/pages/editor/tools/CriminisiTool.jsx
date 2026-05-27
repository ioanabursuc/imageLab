export default function CriminisiTool() {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-700">Criminisi Inpainting</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Coming soon
                </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
                Removes objects from the image by reconstructing the missing region using surrounding texture.
                Requires a mask selection over the area to remove.
            </p>
        </div>
    );
}
