import { Card, CardContent } from "@/components/ui/card";
import HistogramPanel from "./HistogramPanel";

export function EditorCanvas({
                                 imgRef,
                                 maskCanvasRef,
                                 overlayCanvasRef,
                                 previewUrl,
                                 imageStyle,
                                 histogramFilter,
                                 showBefore,
                                 canCompare,
                                 selectedTool,
                                 error,
                                 onImageLoad,
                                 onPointerDown,
                                 onPointerMove,
                                 onPointerUp,
                                 poissonStage,
                                 poissonPreviewUrl,
                                 poissonPreviewSize,
                                 poissonCenter,
                                 poissonScale,
                                 onPoissonPlacementClick,
                             }) {
    const canDrawMask =
        selectedTool === "seam_protect" ||
        selectedTool === "criminisi" ||
        selectedTool === "inpaint" ||
        (selectedTool === "poisson" && poissonStage === "mask");

    const isPoissonPlacement =
        selectedTool === "poisson" && poissonStage === "placement";

    function handleCanvasClick(event) {
        if (!isPoissonPlacement || !onPoissonPlacementClick) return;

        const img = imgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();

        const displayX = event.clientX - rect.left;
        const displayY = event.clientY - rect.top;

        if (
            displayX < 0 ||
            displayY < 0 ||
            displayX > rect.width ||
            displayY > rect.height
        ) {
            return;
        }

        const realX = Math.round((displayX / rect.width) * img.naturalWidth);
        const realY = Math.round((displayY / rect.height) * img.naturalHeight);

        onPoissonPlacementClick({x: realX, y: realY});
    }

    const poissonPreviewStyle = (() => {
        if (!poissonPreviewSize || !poissonCenter || !imgRef.current) {
            return null;
        }

        return {
            left: `${(poissonCenter.x / imgRef.current.naturalWidth) * 100}%`,
            top: `${(poissonCenter.y / imgRef.current.naturalHeight) * 100}%`,
            width: `${
                ((poissonPreviewSize.width * poissonScale) /
                    imgRef.current.naturalWidth) *
                100
            }%`,
            transform: "translate(-50%, -50%)",
        };
    })();

    return (
        <Card className="mx-auto max-w-3xl">
            <CardContent className="flex flex-col items-center justify-center p-6">
                {previewUrl ? (
                    <div className="relative w-full">
                        {canCompare && selectedTool !== "poisson" && (
                            <div
                                className="absolute left-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                                {showBefore ? "Before" : "After"}
                            </div>
                        )}

                        {isPoissonPlacement && (
                            <div
                                className="absolute left-4 top-4 z-30 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                                Click on the destination image to choose the insertion point
                            </div>
                        )}

                        <div className="flex w-full justify-center">
                            <div
                                className={
                                    isPoissonPlacement
                                        ? "relative inline-block max-w-full cursor-crosshair"
                                        : "relative inline-block max-w-full"
                                }
                                onClick={handleCanvasClick}
                            >
                                <img
                                    ref={imgRef}
                                    src={previewUrl}
                                    alt="Editing preview"
                                    style={showBefore ? undefined : imageStyle}
                                    className="block max-h-[520px] max-w-full rounded-md"
                                    crossOrigin="anonymous"
                                    onLoad={onImageLoad}
                                />

                                {canDrawMask && !showBefore && (
                                    <canvas
                                        ref={overlayCanvasRef}
                                        className="absolute left-0 top-0 z-20 cursor-crosshair rounded-md"
                                        onMouseDown={onPointerDown}
                                        onMouseMove={onPointerMove}
                                        onMouseUp={onPointerUp}
                                        onMouseLeave={onPointerUp}
                                        onTouchStart={onPointerDown}
                                        onTouchMove={onPointerMove}
                                        onTouchEnd={onPointerUp}
                                    />
                                )}

                                {isPoissonPlacement &&
                                    poissonPreviewUrl &&
                                    poissonPreviewStyle && (
                                        <img
                                            src={poissonPreviewUrl}
                                            alt="Poisson object preview"
                                            className="pointer-events-none absolute z-20 max-w-none opacity-80 drop-shadow-xl"
                                            style={poissonPreviewStyle}
                                        />
                                    )}

                                <canvas ref={maskCanvasRef} className="hidden"/>
                            </div>
                        </div>

                        {canCompare && selectedTool !== "poisson" && (
                            <p className="mt-3 text-center text-xs text-gray-500">
                                Hold Space to preview the original image.
                            </p>
                        )}


                        <HistogramPanel
                            imageUrl={previewUrl}
                            canvasFilter={showBefore ? "none" : histogramFilter}
                        />
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