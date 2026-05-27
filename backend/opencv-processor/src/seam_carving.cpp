//#include "stdafx.h"
#include "seam_carving.h"

using namespace cv;
using namespace std;

Mat_<float> computeEnergyFloat(const Mat_<uchar>& gray)
{
	Mat gx, gy;
	Sobel(gray, gx, CV_32F, 1, 0, 3);
	Sobel(gray, gy, CV_32F, 0, 1, 3);

	Mat_<float> energy(gray.size());

	for (int i = 0; i < gray.rows; i++)
	{
		for (int j = 0; j < gray.cols; j++)
		{
			float ex = gx.at<float>(i, j);
			float ey = gy.at<float>(i, j);
			energy(i, j) = abs(ex) + abs(ey);
		}
	}

	return energy;
}

vector<int> findVerticalSeam(const Mat_<float>& energy)
{
	int rows = energy.rows;
	int cols = energy.cols;

	Mat_<float> M(rows, cols);
	Mat_<int> backtrack(rows, cols);

	for (int j = 0; j < cols; j++)
		M(0, j) = energy(0, j);

	for (int i = 1; i < rows; i++)
	{
		for (int j = 0; j < cols; j++)
		{
			float minVal = M(i - 1, j);
			int offset = 0;

			if (j > 0 && M(i - 1, j - 1) < minVal)
			{
				minVal = M(i - 1, j - 1);
				offset = -1;
			}
			if (j < cols - 1 && M(i - 1, j + 1) < minVal)
			{
				minVal = M(i - 1, j + 1);
				offset = 1;
			}

			M(i, j) = energy(i, j) + minVal;
			backtrack(i, j) = offset;
		}
	}

	int minCol = 0;
	float minCost = M(rows - 1, 0);

	for (int j = 1; j < cols; j++)
	{
		if (M(rows - 1, j) < minCost)
		{
			minCost = M(rows - 1, j);
			minCol = j;
		}
	}

	vector<int> seam(rows);
	seam[rows - 1] = minCol;

	for (int i = rows - 2; i >= 0; i--)
		seam[i] = seam[i + 1] + backtrack(i + 1, seam[i + 1]);

	return seam;
}

vector<int> findHorizontalSeam(const Mat_<float>& energy)
{
	int rows = energy.rows;
	int cols = energy.cols;

	Mat_<float> M(rows, cols);
	Mat_<int> backtrack(rows, cols);

	for (int i = 0; i < rows; i++)
		M(i, 0) = energy(i, 0);

	for (int j = 1; j < cols; j++)
	{
		for (int i = 0; i < rows; i++)
		{
			float minVal = M(i, j - 1);
			int offset = 0;

			if (i > 0 && M(i - 1, j - 1) < minVal)
			{
				minVal = M(i - 1, j - 1);
				offset = -1;
			}
			if (i < rows - 1 && M(i + 1, j - 1) < minVal)
			{
				minVal = M(i + 1, j - 1);
				offset = 1;
			}

			M(i, j) = energy(i, j) + minVal;
			backtrack(i, j) = offset;
		}
	}

	int minRow = 0;
	float minCost = M(0, cols - 1);

	for (int i = 1; i < rows; i++)
	{
		if (M(i, cols - 1) < minCost)
		{
			minCost = M(i, cols - 1);
			minRow = i;
		}
	}

	vector<int> seam(cols);
	seam[cols - 1] = minRow;

	for (int j = cols - 2; j >= 0; j--)
		seam[j] = seam[j + 1] + backtrack(seam[j + 1], j + 1);

	return seam;
}

Mat_<Vec3b> removeVerticalSeam(const Mat_<Vec3b>& image, const vector<int>& seam)
{
	int rows = image.rows;
	int cols = image.cols;

	Mat_<Vec3b> output(rows, cols - 1);

	for (int i = 0; i < rows; i++)
	{
		int seamCol = seam[i];

		for (int j = 0; j < seamCol; j++)
			output(i, j) = image(i, j);

		for (int j = seamCol + 1; j < cols; j++)
			output(i, j - 1) = image(i, j);
	}

	return output;
}

Mat_<Vec3b> removeHorizontalSeam(const Mat_<Vec3b>& image, const vector<int>& seam)
{
	int rows = image.rows;
	int cols = image.cols;

	Mat_<Vec3b> output(rows - 1, cols);

	for (int j = 0; j < cols; j++)
	{
		int seamRow = seam[j];

		for (int i = 0; i < seamRow; i++)
			output(i, j) = image(i, j);

		for (int i = seamRow + 1; i < rows; i++)
			output(i - 1, j) = image(i, j);
	}

	return output;
}

Mat_<Vec3b> resizeImageVertical(Mat_<Vec3b> image, int numSeams)
{
	numSeams = min(numSeams, image.cols - 1);

	for (int i = 0; i < numSeams; i++)
	{
		Mat_<uchar> gray;
		cvtColor(image, gray, COLOR_BGR2GRAY);
		Mat_<float> energy = computeEnergyFloat(gray);
		vector<int> seam = findVerticalSeam(energy);
		image = removeVerticalSeam(image, seam);
	}

	return image;
}

Mat_<Vec3b> resizeImageHorizontal(Mat_<Vec3b> image, int numSeams)
{
	numSeams = min(numSeams, image.rows - 1);

	for (int i = 0; i < numSeams; i++)
	{
		Mat_<uchar> gray;
		cvtColor(image, gray, COLOR_BGR2GRAY);
		Mat_<float> energy = computeEnergyFloat(gray);
		vector<int> seam = findHorizontalSeam(energy);
		image = removeHorizontalSeam(image, seam);
	}

	return image;
}

Mat drawVerticalSeam(const Mat& image, const vector<int>& seam)
{
	Mat out = image.clone();

	for (int i = 0; i < out.rows; i++)
		out.at<Vec3b>(i, seam[i]) = Vec3b(0, 0, 255);

	return out;
}

Mat drawHorizontalSeam(const Mat& image, const vector<int>& seam)
{
	Mat out = image.clone();

	for (int j = 0; j < out.cols; j++)
		out.at<Vec3b>(seam[j], j) = Vec3b(0, 0, 255);

	return out;
}

Mat_<float> applyProtectionMask(
	const Mat_<float>& energy,
	const Mat_<uchar>& protectMask)
{
	Mat_<float> protectedEnergy = energy.clone();

	if (protectMask.empty())
		return protectedEnergy;

	CV_Assert(protectMask.size() == energy.size());
	CV_Assert(protectMask.type() == CV_8UC1);

	for (int y = 0; y < energy.rows; y++)
	{
		for (int x = 0; x < energy.cols; x++)
		{
			if (protectMask(y, x) > 0)
				protectedEnergy(y, x) += 1000000.0f;
		}
	}

	return protectedEnergy;
}

static Mat_<uchar> removeVerticalSeamMask(
	const Mat_<uchar>& mask,
	const vector<int>& seam)
{
	Mat_<uchar> result(mask.rows, mask.cols - 1);

	for (int y = 0; y < mask.rows; y++)
	{
		int newX = 0;

		for (int x = 0; x < mask.cols; x++)
		{
			if (x == seam[y])
				continue;

			result(y, newX) = mask(y, x);
			newX++;
		}
	}

	return result;
}

static Mat_<uchar> removeHorizontalSeamMask(
	const Mat_<uchar>& mask,
	const vector<int>& seam)
{
	Mat_<uchar> result(mask.rows - 1, mask.cols);

	for (int x = 0; x < mask.cols; x++)
	{
		int newY = 0;

		for (int y = 0; y < mask.rows; y++)
		{
			if (y == seam[x])
				continue;

			result(newY, x) = mask(y, x);
			newY++;
		}
	}

	return result;
}

static Mat_<Vec3b> removeVerticalSeamProtected(
	Mat_<Vec3b> img,
	Mat_<uchar>& protectMask)
{
	Mat_<uchar> gray;
	cvtColor(img, gray, COLOR_BGR2GRAY);

	Mat_<float> energy = computeEnergyFloat(gray);
	energy = applyProtectionMask(energy, protectMask);

	vector<int> seam = findVerticalSeam(energy);

	img = removeVerticalSeam(img, seam);
	protectMask = removeVerticalSeamMask(protectMask, seam);

	return img;
}

static Mat_<Vec3b> removeHorizontalSeamProtected(
	Mat_<Vec3b> img,
	Mat_<uchar>& protectMask)
{
	Mat_<uchar> gray;
	cvtColor(img, gray, COLOR_BGR2GRAY);

	Mat_<float> energy = computeEnergyFloat(gray);
	energy = applyProtectionMask(energy, protectMask);

	vector<int> seam = findHorizontalSeam(energy);

	img = removeHorizontalSeam(img, seam);
	protectMask = removeHorizontalSeamMask(protectMask, seam);

	return img;
}

Mat_<Vec3b> resizeImageProtected(
	Mat_<Vec3b> img,
	int removeCols,
	int removeRows,
	Mat_<uchar> protectMask)
{
	CV_Assert(!img.empty());
	CV_Assert(img.type() == CV_8UC3);

	if (protectMask.empty())
		protectMask = Mat_<uchar>::zeros(img.size());

	CV_Assert(protectMask.size() == img.size());
	CV_Assert(protectMask.type() == CV_8UC1);

	removeCols = max(0, removeCols);
	removeRows = max(0, removeRows);

	for (int i = 0; i < removeCols; i++)
	{
		img = removeVerticalSeamProtected(img, protectMask);

	}

	for (int i = 0; i < removeRows; i++)
	{
		img = removeHorizontalSeamProtected(img, protectMask);

	}

	return img;
}