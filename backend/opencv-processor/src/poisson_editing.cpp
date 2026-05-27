//#include "stdafx.h"
#include "poisson_editing.h"

using namespace cv;

static Mat ensureMaskIsValid(const Mat& mask)
{
	Mat grayMask;

	if (mask.empty())
		return grayMask;

	if (mask.channels() == 3)
		cvtColor(mask, grayMask, COLOR_BGR2GRAY);
	else
		grayMask = mask.clone();

	threshold(grayMask, grayMask, 1, 255, THRESH_BINARY);
	return grayMask;
}

Mat poissonClone(const Mat& src, const Mat& dst, const Mat& mask, Point center)
{
	if (src.empty() || dst.empty() || mask.empty())
		return Mat();

	Mat validMask = ensureMaskIsValid(mask);

	Mat result;
	seamlessClone(src, dst, validMask, center, result, NORMAL_CLONE);
	return result;
}

Mat poissonMixedClone(const Mat& src, const Mat& dst, const Mat& mask, Point center)
{
	if (src.empty() || dst.empty() || mask.empty())
		return Mat();

	Mat validMask = ensureMaskIsValid(mask);

	Mat result;
	seamlessClone(src, dst, validMask, center, result, MIXED_CLONE);
	return result;
}

Mat poissonMonochromeClone(const Mat& src, const Mat& dst, const Mat& mask, Point center)
{
	if (src.empty() || dst.empty() || mask.empty())
		return Mat();

	Mat validMask = ensureMaskIsValid(mask);

	Mat result;
	seamlessClone(src, dst, validMask, center, result, MONOCHROME_TRANSFER);
	return result;
}