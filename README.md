![Docker](https://github.com/mbuechner/ddbapi/workflows/Docker/badge.svg)

# DDBapi - Documentation of the Application Programming Interface (API)
Documentation of the Application Programming Interface (API) of [Deutsche Digitale Bibliothek (DDB)](https://www.deutsche-digitale-bibliothek.de/).

## Technical information
This is basically an adapted [Swagger UI](https://hub.docker.com/r/swaggerapi/swagger-ui) Docker container.

For more information visit: https://github.com/swagger-api/swagger-ui

## Docker

Yes, there's a docker container for DDBapi available at DockerHub: https://hub.docker.com/r/mbuechner/ddbapi

```
docker pull mbuechner/ddbapi:latest
```

### Container build
- Checkout GitHub repository: `git clone https://github.com/mbuechner/ddbapi`
- Go into folder: `cd ddbapi`
- Run `docker build -t ddbapi .`
- Start container with: `docker run -d -p 8080 -P ddbapi`
- Open browser: http://localhost:8080/
