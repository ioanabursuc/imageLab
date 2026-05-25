FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY security/ ./security/
COPY config/ ./config/
COPY auth/pom.xml ./auth/pom.xml
COPY auth/src ./auth/src/
RUN mvn -f security/pom.xml install -DskipTests -q
RUN mvn -f config/pom.xml install -DskipTests -q
RUN mvn -f auth/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/auth/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
