FROM frolvlad/alpine-oraclejdk8:slim
EXPOSE 9999
VOLUME /tmp
ADD pokemon-0.0.1-SNAPSHOT.jar app.jar
RUN sh -c 'touch /app.jar'
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-Dspring.data.mongodb.host=mongo","-jar","/app.jar"]
