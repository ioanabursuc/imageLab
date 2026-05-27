#pragma once

//#include "stdafx.h"
//#include "common.h"
#include <opencv2/opencv.hpp>

// clonare Poisson standard
cv::Mat poissonClone(
	const cv::Mat& src,
	const cv::Mat& dst,
	const cv::Mat& mask,
	cv::Point center
);

// mixed cloning - util cand vrei sa pastrezi mai bine detalii din destinatie
cv::Mat poissonMixedClone(
	const cv::Mat& src,
	const cv::Mat& dst,
	const cv::Mat& mask,
	cv::Point center
);

// monochrome transfer - transfera in principal structura, nu si culoarea completa
cv::Mat poissonMonochromeClone(
	const cv::Mat& src,
	const cv::Mat& dst,
	const cv::Mat& mask,
	cv::Point center
);