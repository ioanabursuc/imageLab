import { Slider } from "@/components/ui/slider";

export default function BrushSizeControl({ value, onChange }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Brush size</span>
                <span className="text-xs text-gray-500">{value}px</span>
            </div>

            <Slider
                value={[value]}
                min={4}
                max={120}
                step={1}
                onValueChange={(newValue) => onChange(newValue[0])}
            />

            <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-gray-50">
                    <div
                        className="rounded-full bg-blue-500/60"
                        style={{
                            width: `${Math.min(value, 32)}px`,
                            height: `${Math.min(value, 32)}px`,
                        }}
                    />
                </div>

                <p className="text-[11px] text-gray-400">
                    Drag the slider to change the mask brush size.
                </p>
            </div>
        </div>
    );
}
