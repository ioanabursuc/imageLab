import { Slider } from "@/components/ui/slider";

export default function SliderControl({
                                          label,
                                          value,
                                          onChange,
                                          min = 0,
                                          max = 200,
                                          step = 1,
                                          unit = "%",
                                      }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <span className="text-sm text-gray-500">
                    {value}{unit}
                </span>
            </div>

            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={(newValue) => onChange(newValue[0])}
            />
        </div>
    );
}