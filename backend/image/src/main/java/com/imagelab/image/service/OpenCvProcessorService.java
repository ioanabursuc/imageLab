package com.imagelab.image.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OpenCvProcessorService {

    @Value("${opencv.processor.path}")
    private String processorPath;

    public void runSeamCarving(
            Path inputPath,
            Path outputPath,
            int removeCols,
            int removeRows
    ) {
        validateInputFile(inputPath);
        validateOutputPath(outputPath);

        if (removeCols < 0 || removeRows < 0) {
            throw new IllegalArgumentException("removeCols and removeRows must be positive numbers");
        }

        List<String> command = List.of(
                processorPath,
                "seam",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString(),
                String.valueOf(removeCols),
                String.valueOf(removeRows)
        );

        runCommand(command, Duration.ofMinutes(3));
    }

    public void runProtectedSeamCarving(
            Path inputPath,
            Path outputPath,
            int removeCols,
            int removeRows,
            Path maskPath
    ) {
        validateInputFile(inputPath);
        validateInputFile(maskPath);
        validateOutputPath(outputPath);

        if (removeCols < 0 || removeRows < 0) {
            throw new IllegalArgumentException("removeCols and removeRows must be positive numbers");
        }

        List<String> command = List.of(
                processorPath,
                "seam_protect",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString(),
                String.valueOf(removeCols),
                String.valueOf(removeRows),
                maskPath.toAbsolutePath().toString()
        );

        runCommand(command, Duration.ofMinutes(5));
    }

    public void runCriminisi(
            Path inputPath,
            Path outputPath,
            Path maskPath,
            int patchRadius
    ) {
        validateInputFile(inputPath);
        validateInputFile(maskPath);
        validateOutputPath(outputPath);

        if (patchRadius < 1) {
            throw new IllegalArgumentException("patchRadius must be at least 1");
        }

        List<String> command = List.of(
                processorPath,
                "criminisi",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString(),
                maskPath.toAbsolutePath().toString(),
                String.valueOf(patchRadius)
        );

        runCommand(command, Duration.ofMinutes(10));
    }

    public void runPoissonEditing(
            Path destinationPath,
            Path outputPath,
            Path sourcePath,
            Path maskPath,
            int centerX,
            int centerY,
            String mode
    ) {
        validateInputFile(destinationPath);
        validateInputFile(sourcePath);
        validateInputFile(maskPath);

        validateOutputPath(outputPath);

        List<String> command = List.of(
                processorPath,
                "poisson",
                sourcePath.toAbsolutePath().toString(),
                destinationPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString(),
                maskPath.toAbsolutePath().toString(),
                String.valueOf(centerX),
                String.valueOf(centerY),
                mode
        );

        runCommand(command, Duration.ofMinutes(5));
    }

    public void runOpenCvInpaint(
            Path inputPath,
            Path outputPath,
            Path maskPath,
            int radius,
            String method
    ) {
        validateInputFile(inputPath);
        validateInputFile(maskPath);
        validateOutputPath(outputPath);

        if (radius < 1) {
            throw new IllegalArgumentException("radius must be at least 1");
        }

        String normalizedMethod =
                method != null && !method.isBlank()
                        ? method.trim().toLowerCase()
                        : "telea";

        if (!normalizedMethod.equals("telea") && !normalizedMethod.equals("ns")) {
            throw new IllegalArgumentException("Unsupported inpaint method: " + method);
        }

        List<String> command = List.of(
                processorPath,
                "inpaint",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString(),
                maskPath.toAbsolutePath().toString(),
                String.valueOf(radius),
                normalizedMethod
        );

        runCommand(command, Duration.ofMinutes(3));
    }

    public void runDenoise(
            Path inputPath,
            Path outputPath
    ) {
        validateInputFile(inputPath);
        validateOutputPath(outputPath);

        List<String> command = List.of(
                processorPath,
                "denoise",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString()
        );

        runCommand(command, Duration.ofMinutes(3));
    }

    public void runDetailEnhance(
            Path inputPath,
            Path outputPath
    ) {
        validateInputFile(inputPath);
        validateOutputPath(outputPath);

        List<String> command = List.of(
                processorPath,
                "detail_enhance",
                inputPath.toAbsolutePath().toString(),
                outputPath.toAbsolutePath().toString()
        );

        runCommand(command, Duration.ofMinutes(3));
    }

    private void runCommand(List<String> command, Duration timeout) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            boolean finished = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);

            String output = new String(process.getInputStream().readAllBytes());

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("OpenCV processing timed out. Output: " + output);
            }

            if (process.exitValue() != 0) {
                throw new RuntimeException("OpenCV processing failed. Output: " + output);
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not run OpenCV processor", e);
        }
    }

    private void validateInputFile(Path inputPath) {
        if (inputPath == null || !Files.exists(inputPath)) {
            throw new IllegalArgumentException("Input image does not exist: " + inputPath);
        }

        if (!Files.isRegularFile(inputPath)) {
            throw new IllegalArgumentException("Input path is not a file: " + inputPath);
        }
    }

    private void validateOutputPath(Path outputPath) {
        if (outputPath == null || outputPath.getParent() == null) {
            throw new IllegalArgumentException("Invalid output path");
        }
    }
}