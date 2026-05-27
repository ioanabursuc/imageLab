#pragma once

//#include "stdafx.h"
//#include "common.h"
#include <opencv2/opencv.hpp>

// mask: 0 = cunoscut, 255 = de completat
cv::Mat_<cv::Vec3b> criminisiInpaint(
    const cv::Mat_<cv::Vec3b>& image,
    const cv::Mat_<uchar>& mask,
    int patchRadius = 4
);