FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY security/ ./security/
COPY config/ ./config/
COPY ai/pom.xml ./ai/pom.xml
COPY ai/src ./ai/src/
RUN mvn -f security/pom.xml install -DskipTests -q
RUN mvn -f config/pom.xml install -DskipTests -q
RUN mvn -f ai/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/ai/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
