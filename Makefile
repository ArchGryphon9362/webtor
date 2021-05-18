all: docker node

docker:
	docker build -t ghcr.io/archgryphon9362/webtor:latest .
	docker push ghcr.io/archgryphon9362/webtor:latest

node:
	cd public; npm run build

run:
	node .
