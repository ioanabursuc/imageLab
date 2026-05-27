import { Slider } from "@/components/ui/slider";

export default function SliderControl({ label, value, onChange }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <span className="text-sm text-gray-500">{value}%</span>
            </div>

            <Slider
                value={[value]}
                min={0}
                max={200}
                step={1}
                onValueChange={(newValue) => onChange(newValue[0])}
            />
        </div>
    );
}
