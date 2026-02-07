# ========================
# Stage 1: Build the App
# ========================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /app

# 1. Copy pom.xml and install dependencies (Caching layer)
COPY pom.xml .
# This step downloads dependencies so they are cached if you don't change pom.xml
RUN mvn dependency:go-offline

# 2. Copy source code and build
COPY src ./src
# Build the jar, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# ========================
# Stage 2: Run the App
# ========================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 3. Copy only the built JAR from the previous stage
COPY --from=build /app/target/*.jar app.jar

# 4. Expose the port
EXPOSE 8080

# 5. Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]