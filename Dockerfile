# syntax=docker/dockerfile:1

FROM oven/bun:latest
# Set destination for COPY
WORKDIR /app

RUN echo "hello"

# Install git
RUN apt-get update && apt-get install -y git

COPY ./node_modules/@cloudflare/sandbox/container_src/* ./
# RUN bun install

EXPOSE 3000
# Run
CMD ["bun", "index.ts"]

