//#include "stdafx.h"
#include "criminisi.h"

using namespace cv;
using namespace std;

// verifica daca un pixel se afla in interiorul imaginii
static inline bool inside(const Mat& img, int y, int x)
{
    return x >= 0 && y >= 0 && x < img.cols && y < img.rows;
}

// verifica daca un patch complet incape in imagine
static inline bool patchInside(const Mat& img, Point p, int r)
{
    return p.x - r >= 0 && p.y - r >= 0 &&
        p.x + r < img.cols && p.y + r < img.rows;
}

// mask: 255 = gaura / target Omega, 0 = cunoscut / sursa Phi
// fill front = pixeli din gaura care au cel putin un vecin cunoscut
static Mat_<uchar> computeFillFront(const Mat_<uchar>& mask255)
{
    Mat hole = mask255 > 0;
    Mat eroded;

    // erodarea micsoreaza gaura, iar diferenta pastreaza doar conturul
    erode(hole, eroded, Mat());

    Mat front = hole - eroded;
    front *= 255;

    return (Mat_<uchar>)front;
}

// calculeaza normala la frontiera mastii in punctul p
static Point2f computeNormalAtFrontPixel(const Mat_<float>& maskFloat, Point p)
{
    Mat gx, gy;

    // gradientul mastii arata directia de schimbare la marginea gaurii
    Sobel(maskFloat, gx, CV_32F, 1, 0, 3);
    Sobel(maskFloat, gy, CV_32F, 0, 1, 3);

    float nx = gx.at<float>(p.y, p.x);
    float ny = gy.at<float>(p.y, p.x);
    float norm = sqrt(nx * nx + ny * ny);

    if (norm < 1e-6f)
        return Point2f(0.f, 0.f);

    // normalizare pentru a obtine doar directia
    return Point2f(nx / norm, ny / norm);
}

// calculeaza directia muchiei care trebuie continuata in zona lipsa
static Point2f computeIsophote(
    const Mat_<float>& gradX,
    const Mat_<float>& gradY,
    const Mat_<uchar>& mask255,
    Point p,
    int r)
{
    float bestMag = -1.0f;
    Point best = p;

    // cauta in patch pixelul cunoscut cu gradientul cel mai puternic
    for (int dy = -r; dy <= r; ++dy)
    {
        for (int dx = -r; dx <= r; ++dx)
        {
            Point q(p.x + dx, p.y + dy);

            if (!inside(mask255, q.y, q.x))
                continue;

            // se folosesc doar pixeli cunoscuti, nu pixeli din gaura
            if (mask255(q.y, q.x) != 0)
                continue;

            float gx = gradX(q.y, q.x);
            float gy = gradY(q.y, q.x);
            float mag = gx * gx + gy * gy;

            if (mag > bestMag)
            {
                bestMag = mag;
                best = q;
            }
        }
    }

    float gx = gradX(best.y, best.x);
    float gy = gradY(best.y, best.x);

    // isophote = gradient rotit la 90 de grade: (-Iy, Ix)
    return Point2f(-gy, gx);
}

// calculeaza confidence term pentru patch-ul centrat in p
static float computeConfidence(
    const Mat_<float>& confidence,
    const Mat_<uchar>& mask255,
    Point p,
    int r)
{
    float sumC = 0.0f;
    int patchArea = (2 * r + 1) * (2 * r + 1);

    for (int dy = -r; dy <= r; ++dy)
    {
        for (int dx = -r; dx <= r; ++dx)
        {
            Point q(p.x + dx, p.y + dy);

            if (!inside(mask255, q.y, q.x))
                continue;

            // aduna confidence doar pentru pixelii cunoscuti
            if (mask255(q.y, q.x) == 0)
                sumC += confidence(q.y, q.x);
        }
    }

    // media confidence-ului pe suprafata patch-ului
    return sumC / (float)patchArea;
}

// calculeaza data term, care favorizeaza continuarea muchiilor
static float computeDataTerm(
    const Mat_<float>& maskFloat,
    const Mat_<float>& gradX,
    const Mat_<float>& gradY,
    const Mat_<uchar>& mask255,
    Point p,
    int r)
{
    Point2f n = computeNormalAtFrontPixel(maskFloat, p);
    Point2f iso = computeIsophote(gradX, gradY, mask255, p, r);

    // produs scalar intre isophote si normala frontierei
    return fabs(iso.x * n.x + iso.y * n.y) / 255.0f + 1e-6f;
}

// verifica daca patch-ul sursa este complet in zona cunoscuta
static bool sourcePatchValid(const Mat_<uchar>& mask255, Point center, int r)
{
    if (!patchInside(mask255, center, r))
        return false;

    for (int dy = -r; dy <= r; ++dy)
    {
        for (int dx = -r; dx <= r; ++dx)
        {
            Point q(center.x + dx, center.y + dy);

            // daca patch-ul contine pixeli din gaura, nu este valid ca sursa
            if (mask255(q.y, q.x) != 0)
                return false;
        }
    }

    return true;
}

// compara patch-ul target cu un patch sursa folosind doar pixelii cunoscuti
static float patchDistanceSSD_LabKnownOnly(
    const Mat_<Vec3f>& lab,
    const Mat_<uchar>& mask255,
    Point targetCenter,
    Point sourceCenter,
    int r)
{
    float ssd = 0.0f;
    int knownCount = 0;

    for (int dy = -r; dy <= r; ++dy)
    {
        for (int dx = -r; dx <= r; ++dx)
        {
            Point tp(targetCenter.x + dx, targetCenter.y + dy);
            Point sp(sourceCenter.x + dx, sourceCenter.y + dy);

            if (!inside(lab, tp.y, tp.x) || !inside(lab, sp.y, sp.x))
                continue;

            // pixelii necunoscuti din target nu pot fi comparati
            if (mask255(tp.y, tp.x) != 0)
                continue;

            // SSD in spatiul Lab pentru diferenta de culoare
            Vec3f d = lab(tp.y, tp.x) - lab(sp.y, sp.x);
            ssd += d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
            knownCount++;
        }
    }

    if (knownCount == 0)
        return FLT_MAX;

    return ssd / (float)knownCount;
}

// cauta in imagine patch-ul valid cel mai asemanator cu patch-ul target
static Point findBestExemplar(
    const Mat_<Vec3f>& lab,
    const Mat_<uchar>& mask255,
    Point targetCenter,
    int r,
    int searchRadius = 180)
{
    float bestDist = FLT_MAX;
    Point best(-1, -1);

    int minY = max(r, targetCenter.y - searchRadius);
    int maxY = min(lab.rows - r - 1, targetCenter.y + searchRadius);
    int minX = max(r, targetCenter.x - searchRadius);
    int maxX = min(lab.cols - r - 1, targetCenter.x + searchRadius);

    for (int y = minY; y <= maxY; ++y)
    {
        for (int x = minX; x <= maxX; ++x)
        {
            Point q(x, y);

            if (!sourcePatchValid(mask255, q, r))
                continue;

            float d = patchDistanceSSD_LabKnownOnly(
                lab, mask255, targetCenter, q, r
            );

            if (d < bestDist)
            {
                bestDist = d;
                best = q;
            }
        }
    }

    return best;
}

// functia principala pentru inpainting Criminisi
Mat_<Vec3b> criminisiInpaint(
    const Mat_<Vec3b>& image,
    const Mat_<uchar>& mask,
    int patchRadius)
{
    CV_Assert(!image.empty());
    CV_Assert(image.type() == CV_8UC3);
    CV_Assert(mask.type() == CV_8UC1);

    patchRadius = max(1, patchRadius);

    // result este imaginea care va fi completata
    Mat_<Vec3b> result = image.clone();

    // workMask se modifica pe parcurs, pe masura ce gaura este umpluta
    Mat_<uchar> workMask = mask.clone();

    // orice valoare > 1 devine 255, pentru masca binara
    threshold(workMask, workMask, 1, 255, THRESH_BINARY);

    Mat lab8;
    cvtColor(result, lab8, COLOR_BGR2Lab);

    Mat_<Vec3f> lab;
    lab8.convertTo(lab, CV_32FC3);

    // pixelii cunoscuti au confidence 1, pixelii din gaura au confidence 0
    Mat_<float> confidence(image.size(), 1.0f);
    confidence.setTo(0.0f, workMask > 0);

    int iteration = 0;
    int previousRemaining = countNonZero(workMask);

    // ruleaza pana cand nu mai exista pixeli de completat
    while (countNonZero(workMask) > 0)
    {
        // gaseste marginea curenta a gaurii
        Mat_<uchar> front = computeFillFront(workMask);

        Mat_<uchar> gray8;
        cvtColor(result, gray8, COLOR_BGR2GRAY);

        Mat_<float> gray;
        gray8.convertTo(gray, CV_32F);

        // gradientul imaginii este folosit pentru data term
        Mat_<float> gradX, gradY;
        Sobel(gray, gradX, CV_32F, 1, 0, 3);
        Sobel(gray, gradY, CV_32F, 0, 1, 3);

        Mat_<float> maskFloat;
        workMask.convertTo(maskFloat, CV_32F, 1.0 / 255.0);

        float bestPriority = -1.0f;
        Point bestP(-1, -1);
        float bestCp = 0.0f;

        // parcurge doar punctele de pe fill front
        for (int y = patchRadius; y < result.rows - patchRadius; ++y)
        {
            for (int x = patchRadius; x < result.cols - patchRadius; ++x)
            {
                if (front(y, x) == 0)
                    continue;

                Point p(x, y);

                // prioritatea Criminisi: P = C * D
                float C = computeConfidence(confidence, workMask, p, patchRadius);
                float D = computeDataTerm(maskFloat, gradX, gradY, workMask, p, patchRadius);
                float P = C * D;

                // se alege patch-ul cu prioritatea cea mai mare
                if (P > bestPriority)
                {
                    bestPriority = P;
                    bestP = p;
                    bestCp = C;
                }
            }
        }

        // daca nu s-a gasit niciun patch valid pe frontiera, se opreste
        if (bestP.x < 0)
            break;

        // gaseste cel mai bun patch sursa pentru patch-ul ales
        Point bestQ = findBestExemplar(lab, workMask, bestP, patchRadius,180);

        // daca nu exista patch sursa valid, se opreste
        if (bestQ.x < 0)
            break;

        vector<Point> newlyFilled;

        // copiaza din patch-ul sursa doar pixelii lipsa din patch-ul target
        for (int dy = -patchRadius; dy <= patchRadius; ++dy)
        {
            for (int dx = -patchRadius; dx <= patchRadius; ++dx)
            {
                Point tp(bestP.x + dx, bestP.y + dy);
                Point sp(bestQ.x + dx, bestQ.y + dy);

                if (!inside(result, tp.y, tp.x) || !inside(result, sp.y, sp.x))
                    continue;

                if (workMask(tp.y, tp.x) != 0)
                {
                    result(tp.y, tp.x) = result(sp.y, sp.x);

                    // actualizeaza si imaginea Lab pentru pixelul nou completat
                    lab(tp.y, tp.x) = lab(sp.y, sp.x);

                    newlyFilled.push_back(tp);
                }
            }
        }

        // pixelii completati devin cunoscuti si primesc confidence-ul patch-ului
        for (const Point& p : newlyFilled)
        {
            confidence(p.y, p.x) = bestCp;
            workMask(p.y, p.x) = 0;
        }

        iteration++;

        int remaining = countNonZero(workMask);

        // afiseaza progresul la fiecare 10 iteratii sau la final
        if (iteration % 10 == 0 || remaining == 0)
        {
            printf("Criminisi: iteratia %d, pixeli ramasi: %d\n",
                iteration, remaining);

           // imshow("Criminisi progress", result);
            //waitKey(1);
        }

        // protectie impotriva blocarii daca masca nu se mai reduce
        if (remaining >= previousRemaining)
            break;

        previousRemaining = remaining;
    }

    //destroyWindow("Criminisi progress");

    return result;
}