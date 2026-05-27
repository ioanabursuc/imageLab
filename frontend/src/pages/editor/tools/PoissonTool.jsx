export default function PoissonTool() {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-700">Poisson Editing</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Coming soon
                </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
                Seamlessly blends a source region into a destination image.
                Requires a source image, destination image, mask and a center point.
            </p>
        </div>
    );
}
