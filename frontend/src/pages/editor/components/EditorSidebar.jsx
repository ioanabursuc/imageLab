import { Expand, Shield, Trash2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import SliderControl from "./SliderControl";
import ToolButton from "./ToolButton";
import SeamCarvingTool from "../tools/SeamCarvingTool";
import ProtectedSeamCarvingTool from "../tools/ProtectedSeamCarvingTool";
import CriminisiTool from "../tools/CriminisiTool";
import PoissonTool from "../tools/PoissonTool";

export default function EditorSidebar({
                                          activeTab,
                                          setActiveTab,
                                          selectedTool,
                                          setSelectedTool,
                                          brightness,
                                          setBrightness,
                                          contrast,
                                          setContrast,
                                          saturation,
                                          setSaturation,
                                          removeCols,
                                          setRemoveCols,
                                          removeRows,
                                          setRemoveRows,
                                          brushSize,
                                          setBrushSize,
                                          imageDimensions,
                                          processingTool,
                                          activeBaseUrl,
                                          hasMask,
                                          onApplySeam,
                                          onApplyProtected,
                                          onApplyCriminisi,
                                          onClearMask,
                                          onPrepareMask,

                                          poissonState,
                                          onStartPoisson,
                                          onCancelPoisson,
                                          onPoissonSourceSelected,
                                          onPoissonContinuePlacement,
                                          onPoissonScaleChange,
                                          onPoissonModeChange,
                                          onApplyPoisson,

                                          aiMessage,
                                          setAiMessage,
                                          aiResponse,
                                          aiLoading,
                                          aiError,
                                          onAskAi,
                                      }) {
    function handleSelectProtectedTool() {
        const nextTool = selectedTool === "seam_protect" ? null : "seam_protect";
        setSelectedTool(nextTool);

        if (nextTool === "seam_protect") {
            onPrepareMask();
        }
    }

    function handleSelectCriminisiTool() {
        const nextTool = selectedTool === "criminisi" ? null : "criminisi";
        setSelectedTool(nextTool);

        if (nextTool === "criminisi") {
            onPrepareMask();
        }
    }

    function handleSelectPoissonTool() {
        const nextTool = selectedTool === "poisson" ? null : "poisson";
        setSelectedTool(nextTool);

        if (nextTool === "poisson") {
            onStartPoisson();
        } else {
            onCancelPoisson();
        }
    }

    return (
        <aside className="min-h-[calc(100vh-80px)] border-r bg-white p-6">
            <div className="mb-8 flex rounded-2xl bg-gray-100 p-1">
                <button
                    onClick={() => setActiveTab("adjust")}
                    className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                        activeTab === "adjust" ? "bg-white shadow-sm" : "text-gray-600"
                    }`}
                >
                    Adjust
                </button>

                <button
                    onClick={() => setActiveTab("tools")}
                    className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                        activeTab === "tools" ? "bg-white shadow-sm" : "text-gray-600"
                    }`}
                >
                    Tools
                </button>
            </div>

            {activeTab === "adjust" ? (
                <div className="space-y-8">
                    <SliderControl
                        label="Brightness"
                        value={brightness}
                        onChange={setBrightness}
                    />

                    <SliderControl
                        label="Contrast"
                        value={contrast}
                        onChange={setContrast}
                    />

                    <SliderControl
                        label="Saturation"
                        value={saturation}
                        onChange={setSaturation}
                    />
                </div>
            ) : (
                <div>
                    <div className="rounded-xl border bg-gray-50 p-4">
                        <p className="mb-1 text-sm font-semibold text-gray-700">
                            Current image size
                        </p>

                        <p className="text-sm text-gray-600">
                            Columns:{" "}
                            <span className="font-semibold">
                                {imageDimensions.width || "-"}
                            </span>
                        </p>

                        <p className="text-sm text-gray-600">
                            Rows:{" "}
                            <span className="font-semibold">
                                {imageDimensions.height || "-"}
                            </span>
                        </p>
                    </div>

                    <div className="mt-4 space-y-3">
                        <ToolButton
                            icon={<Expand size={18} />}
                            label="Seam Carving"
                            onClick={() =>
                                setSelectedTool(selectedTool === "seam" ? null : "seam")
                            }
                            disabled={processingTool || !activeBaseUrl}
                            active={selectedTool === "seam"}
                        />

                        {selectedTool === "seam" && (
                            <SeamCarvingTool
                                removeCols={removeCols}
                                setRemoveCols={setRemoveCols}
                                removeRows={removeRows}
                                setRemoveRows={setRemoveRows}
                                imageDimensions={imageDimensions}
                                processingTool={processingTool}
                                activeBaseUrl={activeBaseUrl}
                                onApply={onApplySeam}
                            />
                        )}

                        <ToolButton
                            icon={<Expand size={18} />}
                            label="Seam Carving with Protection Mask"
                            onClick={handleSelectProtectedTool}
                            disabled={processingTool || !activeBaseUrl}
                            active={selectedTool === "seam_protect"}
                        />

                        {selectedTool === "seam_protect" && (
                            <ProtectedSeamCarvingTool
                                removeCols={removeCols}
                                setRemoveCols={setRemoveCols}
                                removeRows={removeRows}
                                setRemoveRows={setRemoveRows}
                                brushSize={brushSize}
                                setBrushSize={setBrushSize}
                                imageDimensions={imageDimensions}
                                processingTool={processingTool}
                                hasMask={hasMask}
                                onApply={onApplyProtected}
                                onClear={onClearMask}
                            />
                        )}

                        <ToolButton
                            icon={<Shield size={18} />}
                            label="Poisson Editing"
                            onClick={handleSelectPoissonTool}
                            disabled={processingTool || !activeBaseUrl}
                            active={selectedTool === "poisson"}
                        />

                        {selectedTool === "poisson" && (
                            <PoissonTool
                                stage={poissonState.stage}
                                sourceFile={poissonState.sourceFile}
                                brushSize={brushSize}
                                setBrushSize={setBrushSize}
                                hasMask={hasMask}
                                processingTool={processingTool}
                                centerX={poissonState.centerX}
                                centerY={poissonState.centerY}
                                scale={poissonState.scale}
                                mode={poissonState.mode}
                                onSourceSelected={onPoissonSourceSelected}
                                onContinuePlacement={onPoissonContinuePlacement}
                                onClearMask={onClearMask}
                                onScaleChange={onPoissonScaleChange}
                                onModeChange={onPoissonModeChange}
                                onApply={onApplyPoisson}
                                onCancel={onCancelPoisson}
                            />
                        )}

                        <ToolButton
                            icon={<Trash2 size={18} />}
                            label="Criminisi"
                            onClick={handleSelectCriminisiTool}
                            disabled={processingTool || !activeBaseUrl}
                            active={selectedTool === "criminisi"}
                        />

                        {selectedTool === "criminisi" && (
                            <CriminisiTool
                                brushSize={brushSize}
                                setBrushSize={setBrushSize}
                                processingTool={processingTool}
                                hasMask={hasMask}
                                onApply={onApplyCriminisi}
                                onClear={onClearMask}
                            />
                        )}
                    </div>

                    <div className="mt-8 border-t pt-4">
                        <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
                            <p className="mb-3 font-medium text-gray-700">
                                Tool Instructions:
                            </p>

                            <p className="mb-2">
                                •{" "}
                                <span className="font-semibold">Seam Carving:</span>{" "}
                                removes selected rows and columns while preserving important
                                content.
                            </p>

                            <p className="mb-2">
                                •{" "}
                                <span className="font-semibold">Space key:</span>{" "}
                                hold Space to preview the original image.
                            </p>

                            <p>
                                •{" "}
                                <span className="font-semibold">Masks:</span>{" "}
                                required later for protection, Poisson Editing and Criminisi.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 space-y-3 border-t pt-6">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Bot size={16} /> AI Assistant
                </h3>

                <p className="text-xs text-gray-500">
                    What do you want to do with this image?
                </p>

                <textarea
                    rows={3}
                    className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder='e.g. "Remove the person from the background."'
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                />

                <Button
                    size="sm"
                    className="w-full"
                    onClick={onAskAi}
                    disabled={aiLoading || !aiMessage.trim() || !activeBaseUrl}
                >
                    {aiLoading ? "Analyzing..." : "Ask AI"}
                </Button>

                {aiError && <p className="text-xs text-red-500">{aiError}</p>}

                {aiResponse && (
                    <div className="rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
                        {aiResponse}
                    </div>
                )}
            </div>
        </aside>
    );
}