export default function ToolButton({ icon, label, onClick, disabled = false, active = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                disabled
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : active
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "bg-white hover:bg-gray-50"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
