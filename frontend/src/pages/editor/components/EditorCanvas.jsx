import { Card, CardContent } from "@/components/ui/card";

export default function EditorCanvas({
                                         imgRef,
                                         maskCanvasRef,
                                         overlayCanvasRef,
                                         previewUrl,
                                         imageStyle,
                                         showBefore,
                                         canCompare,
                                         selectedTool,
                                         error,
                                         onImageLoad,
                                         onPointerDown,
                                         onPointerMove,
                                         onPointerUp,
                                     }) {
    return (
        <Card className="mx-auto max-w-3xl">
            <CardContent className="flex items-center justify-center p-6">
                {previewUrl ? (
                    <div className="relative w-full">
                        {canCompare && (
                            <div className="absolute left-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                                {showBefore ? "Before" : "After"}
                            </div>
                        )}

                        <div className="relative">
                            <img
                                ref={imgRef}
                                src={previewUrl}
                                alt="Editing preview"
                                style={showBefore ? undefined : imageStyle}
                                className="max-h-[520px] w-full rounded-md object-contain"
                                crossOrigin="anonymous"
                                onLoad={onImageLoad}
                            />

                            {(selectedTool === "seam_protect" || selectedTool === "criminisi") && !showBefore && (
                                <canvas
                                    ref={overlayCanvasRef}
                                    className="absolute left-0 top-0 z-20 h-full w-full cursor-crosshair rounded-md"
                                    onMouseDown={onPointerDown}
                                    onMouseMove={onPointerMove}
                                    onMouseUp={onPointerUp}
                                    onMouseLeave={onPointerUp}
                                    onTouchStart={onPointerDown}
                                    onTouchMove={onPointerMove}
                                    onTouchEnd={onPointerUp}
                                />
                            )}

                            <canvas ref={maskCanvasRef} className="hidden" />
                        </div>

                        {canCompare && (
                            <p className="mt-3 text-center text-xs text-gray-500">
                                Hold Space to preview the original image.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex h-[520px] w-full items-center justify-center text-gray-400">
                        {error ? error : "Loading image..."}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}