//#include "stdafx.h"

#include "seam_carving.h"
#include "poisson_editing.h"
#include "criminisi.h"

#include <opencv2/opencv.hpp>
#include <opencv2/core/utils/logger.hpp>
#include <opencv2/photo.hpp>

#include <iostream>
#include <string>

using namespace cv;
using namespace std;

wchar_t* projectPath;

static void printUsage()
{
    cout << "=== ImageLab OpenCV Processor ===" << endl;
    cout << endl;

    cout << "Usage:" << endl;
    cout << endl;

    cout << "1) Seam carving:" << endl;
    cout << "   ImageProcessor seam <inputPath> <outputPath> <removeCols> <removeRows>" << endl;
    cout << endl;

    cout << "2) Seam carving with protection mask:" << endl;
    cout << "   ImageProcessor seam_protect <inputPath> <outputPath> <removeCols> <removeRows> <maskPath>" << endl;
    cout << endl;

    cout << "3) Criminisi inpainting:" << endl;
    cout << "   ImageProcessor criminisi <inputPath> <outputPath> <maskPath> <patchRadius>" << endl;
    cout << endl;

    cout << "4) Poisson editing:" << endl;
    cout << "   ImageProcessor poisson <sourcePath> <destinationPath> <outputPath> <maskPath> <centerX> <centerY> <mode>" << endl;
    cout << "   mode: normal | mixed | mono" << endl;
    cout << endl;

    cout << "5) OpenCV inpainting:" << endl;
    cout << "   ImageProcessor inpaint <inputPath> <outputPath> <maskPath> <radius> <method>" << endl;
    cout << "   method: telea | ns" << endl;
    cout << endl;

    cout << "6) Denoise:" << endl;
    cout << "   ImageProcessor denoise <inputPath> <outputPath>" << endl;
    cout << endl;

    cout << "7) Detail enhance:" << endl;
    cout << "   ImageProcessor detail_enhance <inputPath> <outputPath>" << endl;
    cout << endl;
}

static Mat_<uchar> readMask(const string& maskPath, Size expectedSize)
{
    Mat mask = imread(maskPath, IMREAD_GRAYSCALE);

    if (mask.empty())
    {
        cerr << "ERROR: Could not read mask: " << maskPath << endl;
        return Mat_<uchar>();
    }

    if (mask.size() != expectedSize)
    {
        cerr << "ERROR: Mask size does not match image size." << endl;
        cerr << "Image size: " << expectedSize.width << "x" << expectedSize.height << endl;
        cerr << "Mask size: " << mask.cols << "x" << mask.rows << endl;
        return Mat_<uchar>();
    }

    threshold(mask, mask, 1, 255, THRESH_BINARY);

    return Mat_<uchar>(mask);
}

static int runSeamCarving(int argc, char** argv)
{
    if (argc != 6)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];
    int removeCols = stoi(argv[4]);
    int removeRows = stoi(argv[5]);

    Mat_<Vec3b> image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    removeCols = max(0, removeCols);
    removeRows = max(0, removeRows);

    Mat_<Vec3b> result = resizeImageVertical(image.clone(), removeCols);
    result = resizeImageHorizontal(result.clone(), removeRows);

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 3;
    }

    cout << "SUCCESS: Seam carving completed." << endl;
    return 0;
}

static int runSeamCarvingProtected(int argc, char** argv)
{
    if (argc != 7)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];
    int removeCols = stoi(argv[4]);
    int removeRows = stoi(argv[5]);
    string maskPath = argv[6];

    Mat_<Vec3b> image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    Mat_<uchar> mask = readMask(maskPath, image.size());

    if (mask.empty())
    {
        return 3;
    }

    removeCols = max(0, removeCols);
    removeRows = max(0, removeRows);

    Mat_<Vec3b> result = resizeImageProtected(
        image.clone(),
        removeCols,
        removeRows,
        mask
    );

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 4;
    }

    cout << "SUCCESS: Protected seam carving completed." << endl;
    return 0;
}

static int runCriminisi(int argc, char** argv)
{
    if (argc != 6)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];
    string maskPath = argv[4];
    int patchRadius = stoi(argv[5]);

    Mat_<Vec3b> image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    Mat_<uchar> mask = readMask(maskPath, image.size());

    if (mask.empty())
    {
        return 3;
    }

    patchRadius = max(1, patchRadius);

    Mat_<Vec3b> result = criminisiInpaint(
        image,
        mask,
        patchRadius
    );

    if (result.empty())
    {
        cerr << "ERROR: Criminisi returned an empty result." << endl;
        return 4;
    }

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 5;
    }

    cout << "SUCCESS: Criminisi inpainting completed." << endl;
    return 0;
}

static int runPoisson(int argc, char** argv)
{
    if (argc != 9)
    {
        printUsage();
        return 1;
    }

    string sourcePath = argv[2];
    string destinationPath = argv[3];
    string outputPath = argv[4];
    string maskPath = argv[5];

    int centerX = stoi(argv[6]);
    int centerY = stoi(argv[7]);

    string mode = argv[8];

    Mat source = imread(sourcePath);
    Mat destination = imread(destinationPath);

    if (source.empty())
    {
        cerr << "ERROR: Could not read source image: " << sourcePath << endl;
        return 2;
    }

    if (destination.empty())
    {
        cerr << "ERROR: Could not read destination image: " << destinationPath << endl;
        return 3;
    }

    Mat_<uchar> mask = readMask(maskPath, source.size());

    if (mask.empty())
    {
        return 4;
    }

    Point center(centerX, centerY);

    if (center.x < 0 || center.y < 0 || center.x >= destination.cols || center.y >= destination.rows)
    {
        cerr << "ERROR: Center point is outside destination image." << endl;
        return 5;
    }

    Mat result;

    if (mode == "normal")
    {
        result = poissonClone(source, destination, mask, center);
    }
    else if (mode == "mixed")
    {
        result = poissonMixedClone(source, destination, mask, center);
    }
    else if (mode == "mono")
    {
        result = poissonMonochromeClone(source, destination, mask, center);
    }
    else
    {
        cerr << "ERROR: Unknown Poisson mode: " << mode << endl;
        cerr << "Allowed modes: normal | mixed | mono" << endl;
        return 6;
    }

    if (result.empty())
    {
        cerr << "ERROR: Poisson editing returned an empty result." << endl;
        return 7;
    }

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 8;
    }

    cout << "SUCCESS: Poisson editing completed." << endl;
    return 0;
}

static int runOpenCvInpaint(int argc, char** argv)
{
    if (argc != 7)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];
    string maskPath = argv[4];
    int radius = stoi(argv[5]);
    string method = argv[6];

    Mat image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    Mat_<uchar> mask = readMask(maskPath, image.size());

    if (mask.empty())
    {
        return 3;
    }

    radius = max(1, radius);

    int inpaintMethod;

    if (method == "telea")
    {
        inpaintMethod = INPAINT_TELEA;
    }
    else if (method == "ns")
    {
        inpaintMethod = INPAINT_NS;
    }
    else
    {
        cerr << "ERROR: Unknown inpaint method: " << method << endl;
        cerr << "Allowed methods: telea | ns" << endl;
        return 4;
    }

    Mat result;
    inpaint(image, mask, result, radius, inpaintMethod);

    if (result.empty())
    {
        cerr << "ERROR: OpenCV inpaint returned an empty result." << endl;
        return 5;
    }

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 6;
    }

    cout << "SUCCESS: OpenCV inpaint completed." << endl;
    return 0;
}

static int runDenoise(int argc, char** argv)
{
    if (argc != 4)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];

    Mat image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    Mat result;

    fastNlMeansDenoisingColored(
        image,
        result,
        7.0f,
        7.0f,
        7,
        21
    );

    if (result.empty())
    {
        cerr << "ERROR: Denoise returned an empty result." << endl;
        return 3;
    }

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 4;
    }

    cout << "SUCCESS: Denoise completed." << endl;
    return 0;
}

static int runDetailEnhance(int argc, char** argv)
{
    if (argc != 4)
    {
        printUsage();
        return 1;
    }

    string inputPath = argv[2];
    string outputPath = argv[3];

    Mat image = imread(inputPath);

    if (image.empty())
    {
        cerr << "ERROR: Could not read input image: " << inputPath << endl;
        return 2;
    }

    Mat result;

    detailEnhance(
        image,
        result,
        10.0f,
        0.15f
    );

    if (result.empty())
    {
        cerr << "ERROR: Detail enhance returned an empty result." << endl;
        return 3;
    }

    if (!imwrite(outputPath, result))
    {
        cerr << "ERROR: Could not save output image: " << outputPath << endl;
        return 4;
    }

    cout << "SUCCESS: Detail enhance completed." << endl;
    return 0;
}

int main(int argc, char** argv)
{
    cv::utils::logging::setLogLevel(cv::utils::logging::LOG_LEVEL_FATAL);

    if (argc < 2)
    {
        printUsage();
        return 1;
    }

    string algorithm = argv[1];

    try
    {
        if (algorithm == "seam")
        {
            return runSeamCarving(argc, argv);
        }

        if (algorithm == "seam_protect")
        {
            return runSeamCarvingProtected(argc, argv);
        }

        if (algorithm == "criminisi")
        {
            return runCriminisi(argc, argv);
        }

        if (algorithm == "poisson")
        {
            return runPoisson(argc, argv);
        }

        if (algorithm == "inpaint")
        {
            return runOpenCvInpaint(argc, argv);
        }

        if (algorithm == "denoise")
        {
            return runDenoise(argc, argv);
        }

        if (algorithm == "detail_enhance")
        {
            return runDetailEnhance(argc, argv);
        }

        cerr << "ERROR: Unknown algorithm: " << algorithm << endl;
        printUsage();
        return 1;
    }
    catch (const exception& e)
    {
        cerr << "ERROR: " << e.what() << endl;
        return 99;
    }
}