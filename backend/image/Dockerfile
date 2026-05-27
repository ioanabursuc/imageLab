FROM maven:3.9-eclipse-temurin-17 AS build-java

WORKDIR /app

COPY security/ ./security/
COPY config/ ./config/
COPY image/pom.xml ./image/pom.xml
COPY image/src ./image/src/

RUN mvn -f security/pom.xml install -DskipTests -q
RUN mvn -f config/pom.xml install -DskipTests -q
RUN mvn -f image/pom.xml package -DskipTests


FROM ubuntu:22.04 AS build-opencv

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opencv-processor

COPY opencv-processor/ ./

RUN cmake -S . -B build
RUN cmake --build build --config Release


FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build-java /app/image/target/*.jar app.jar
COPY --from=build-opencv /opencv-processor/build/ImageProcessor /app/opencv/ImageProcessor

RUN chmod +x /app/opencv/ImageProcessor

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]