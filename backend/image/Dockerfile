FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY security/ ./security/
COPY config/ ./config/
COPY image/pom.xml ./image/pom.xml
COPY image/src ./image/src/
RUN mvn -f security/pom.xml install -DskipTests -q
RUN mvn -f config/pom.xml install -DskipTests -q
RUN mvn -f image/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/image/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
