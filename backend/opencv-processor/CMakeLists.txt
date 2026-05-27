cmake_minimum_required(VERSION 3.10)

project(ImageProcessor)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenCV REQUIRED)

add_executable(ImageProcessor
    src/main.cpp
    src/seam_carving.cpp
    src/criminisi.cpp
    src/poisson_editing.cpp
)

target_include_directories(ImageProcessor PRIVATE
    src
    ${OpenCV_INCLUDE_DIRS}
)

target_link_libraries(ImageProcessor
    ${OpenCV_LIBS}
)