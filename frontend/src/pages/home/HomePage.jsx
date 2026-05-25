import { Button } from "@/components/ui/button";
import icon from "@/assets/icon.svg";
import {
    Upload,
    Image,
    Shield,
    Trash2,
    Palette,
    Save,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div>
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <img
                    src={icon}
                    alt="logo"
                    className="mb-6 h-16 w-16 rounded-lg bg-blue-600 p-3"
                />

                <h1 className="text-5xl font-bold mb-4">
                    Simple Image Editing
                </h1>

                <p className="max-w-xl text-gray-500 mb-6">
                    Professional image editing tools for retargeting,
                    object removal, and color adjustments.
                </p>

                <div className="flex gap-4">
                    <div className="flex gap-4">
                        <Link to="/login">
                            <Button>Start Editing</Button>
                        </Link>

                        <Link to="/login">
                            <Button variant="outline">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <div className="grid grid-cols-3 gap-10 max-w-5xl mx-auto">
                <Feature
                    icon={<Upload />}
                    title="Upload Images"
                    description="Easily upload and manage your image files"
                />
                <Feature
                    icon={<Image />}
                    title="Image Retargeting"
                    description="Resize images while preserving important content"
                />
                <Feature
                    icon={<Shield />}
                    title="Protect Regions"
                    description="Mark faces and bodies as protected areas"
                />
                <Feature
                    icon={<Trash2 />}
                    title="Remove Objects"
                    description="Seamlessly remove unwanted elements"
                />
                <Feature
                    icon={<Palette />}
                    title="Color Adjustment"
                    description="Fine-tune brightness, contrast, and saturation"
                />
                <Feature
                    icon={<Save />}
                    title="Private Storage"
                    description="Save and manage your edited images securely"
                />
            </div>
        </div>
    );
}

function Feature({ icon, title, description }) {
    return (
        <div>
            <div className="mb-3 mx-auto flex h-10 w-10 items-center justify-center text-blue-600">
                {icon}
            </div>

            <h3 className="font-medium">{title}</h3>

            <p className="mt-1 text-sm text-gray-500">
                {description}
            </p>
        </div>
    );
}