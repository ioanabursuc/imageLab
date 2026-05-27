export default function NumberControl({ label, value, onChange, max }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
                {label}
            </span>

            <input
                type="number"
                min={0}
                max={max}
                step={1}
                value={value}
                onChange={(event) => {
                    const nextValue = event.target.value;

                    if (nextValue === "") {
                        onChange("");
                        return;
                    }

                    onChange(Number(nextValue));
                }}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
            />

            {max > 0 && (
                <span className="mt-1 block text-[11px] text-gray-400">
                    Maximum allowed: {max}
                </span>
            )}
        </label>
    );
}
