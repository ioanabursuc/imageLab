import { Expand, Shield, Trash2, Bot, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
                                          grayscale,
                                          setGrayscale,
                                          sepia,
                                          setSepia,
                                          hueRotate,
                                          setHueRotate,
                                          blur,
                                          setBlur,
                                          invert,
                                          setInvert,

                                          defaultFilterPresets,
                                          userFilterPresets,
                                          presetName,
                                          setPresetName,
                                          onApplyFilterPreset,
                                          onSaveUserPreset,
                                          onDeleteUserPreset,
                                          onResetFilters,

                                          removeCols,
                                          setRemoveCols,
                                          removeRows,
                                          setRemoveRows,
                                          brushSize,
                                          setBrushSize,
                                          isEraserActive,
                                          setIsEraserActive,
                                          imageDimensions,
                                          processingTool,
                                          activeBaseUrl,
                                          hasMask,
                                          onApplySeam,
                                          onApplyProtected,
                                          onApplyCriminisi,
                                          onClearMask,
                                          onCloseContour,
                                          onFillContour,
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

                    <SliderControl
                        label="Grayscale"
                        value={grayscale}
                        onChange={setGrayscale}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    <SliderControl
                        label="Sepia"
                        value={sepia}
                        onChange={setSepia}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    <SliderControl
                        label="Hue"
                        value={hueRotate}
                        onChange={setHueRotate}
                        min={0}
                        max={360}
                        unit="°"
                    />

                    <SliderControl
                        label="Blur"
                        value={blur}
                        onChange={setBlur}
                        min={0}
                        max={5}
                        step={0.1}
                        unit="px"
                    />

                    <SliderControl
                        label="Invert"
                        value={invert}
                        onChange={setInvert}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    <div className="space-y-4 rounded-2xl border bg-gray-50 p-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">
                                Filter Presets
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Apply a predefined look or save your own filter combination.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(defaultFilterPresets ?? []).map((preset) => (
                                <Button
                                    key={preset.id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onApplyFilterPreset(preset.values)}
                                >
                                    {preset.name}
                                </Button>
                            ))}
                        </div>

                        <div className="border-t pt-4">
                            <p className="mb-2 text-xs font-medium text-gray-500">
                                Your presets
                            </p>

                            {(userFilterPresets ?? []).length === 0 ? (
                                <p className="rounded-lg bg-white p-3 text-xs text-gray-400">
                                    No custom presets yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {userFilterPresets.map((preset) => (
                                        <div
                                            key={preset.id}
                                            className="flex items-center gap-2 rounded-lg bg-white p-2"
                                        >
                                            <button
                                                type="button"
                                                className="flex-1 truncate text-left text-sm text-gray-700 transition hover:text-blue-600"
                                                onClick={() =>
                                                    onApplyFilterPreset(preset.values)
                                                }
                                            >
                                                {preset.name}
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                                onClick={() =>
                                                    onDeleteUserPreset(preset.id)
                                                }
                                                title="Delete preset"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex gap-2">
                                <Input
                                    value={presetName}
                                    onChange={(e) =>
                                        setPresetName(e.target.value)
                                    }
                                    placeholder="Preset name"
                                    className="h-9 text-sm"
                                    maxLength={40}
                                />

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={onSaveUserPreset}
                                    disabled={!presetName.trim()}
                                >
                                    <Plus size={15} />
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={onResetFilters}
                        >
                            <RotateCcw size={16} />
                            Reset Filters
                        </Button>
                    </div>
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
                                setSelectedTool(
                                    selectedTool === "seam" ? null : "seam"
                                )
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
                                isEraserActive={isEraserActive}
                                setIsEraserActive={setIsEraserActive}
                                imageDimensions={imageDimensions}
                                processingTool={processingTool}
                                hasMask={hasMask}
                                onApply={onApplyProtected}
                                onClear={onClearMask}
                                onCloseContour={onCloseContour}
                                onFillContour={onFillContour}
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
                                isEraserActive={isEraserActive}
                                setIsEraserActive={setIsEraserActive}
                                hasMask={hasMask}
                                processingTool={processingTool}
                                centerX={poissonState.centerX}
                                centerY={poissonState.centerY}
                                scale={poissonState.scale}
                                mode={poissonState.mode}
                                onSourceSelected={onPoissonSourceSelected}
                                onContinuePlacement={onPoissonContinuePlacement}
                                onClearMask={onClearMask}
                                onCloseContour={onCloseContour}
                                onFillContour={onFillContour}
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
                                isEraserActive={isEraserActive}
                                setIsEraserActive={setIsEraserActive}
                                processingTool={processingTool}
                                hasMask={hasMask}
                                onApply={onApplyCriminisi}
                                onClear={onClearMask}
                                onCloseContour={onCloseContour}
                                onFillContour={onFillContour}
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
                                <span className="font-semibold">
                                    Seam Carving:
                                </span>{" "}
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