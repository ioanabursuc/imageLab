import icon from "@/assets/icon.svg";

export default function Footer() {
    return (
        <footer className="border-t bg-white px-6 py-6 mt-10">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <img src={icon} alt="logo" className="h-6 w-6" />
                    ImageLab
                </div>

                <p className="text-sm text-gray-500">
                    © 2026 ImageLab
                </p>
            </div>
        </footer>
    );
}