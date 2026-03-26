FROM maven:3.9.6-eclipse-temurin-17 as build
WORKDIR /app/backend
COPY backend/. /app/backend
RUN mvn -q -DskipTests clean package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/backend/target/placement-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
