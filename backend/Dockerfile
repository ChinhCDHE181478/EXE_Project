# Stage 1: Build với Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy toàn bộ project (kể cả mvnw, .mvn, pom.xml, src,…)
COPY . .
COPY .env .env

# Build jar
RUN mvn clean package -DskipTests

# Stage 2: Run Spring Boot
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
