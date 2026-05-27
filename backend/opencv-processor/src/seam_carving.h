#pragma once

//#include "stdafx.h"
//#include "common.h"
#include <vector>
#include <opencv2/opencv.hpp>

cv::Mat_<float> computeEnergyFloat(const cv::Mat_<uchar>& gray);

std::vector<int> findVerticalSeam(const cv::Mat_<float>& energy);
std::vector<int> findHorizontalSeam(const cv::Mat_<float>& energy);

cv::Mat_<cv::Vec3b> removeVerticalSeam(const cv::Mat_<cv::Vec3b>& image, const std::vector<int>& seam);
cv::Mat_<cv::Vec3b> removeHorizontalSeam(const cv::Mat_<cv::Vec3b>& image, const std::vector<int>& seam);

cv::Mat_<cv::Vec3b> resizeImageVertical(cv::Mat_<cv::Vec3b> image, int numSeams);
cv::Mat_<cv::Vec3b> resizeImageHorizontal(cv::Mat_<cv::Vec3b> image, int numSeams);

cv::Mat drawVerticalSeam(const cv::Mat& image, const std::vector<int>& seam);
cv::Mat drawHorizontalSeam(const cv::Mat& image, const std::vector<int>& seam);

cv::Mat_<float> applyProtectionMask(
	const cv::Mat_<float>& energy,
	const cv::Mat_<uchar>& protectMask
);

cv::Mat_<cv::Vec3b> resizeImageProtected(
	cv::Mat_<cv::Vec3b> img,
	int removeCols,
	int removeRows,
	cv::Mat_<uchar> protectMask
);