IMAGE             := foilctf_sandbox

all: build run

build:
	podman build --tag $(IMAGE) .

run:
	podman run \
		--detach \
		--volume /run/user/1000/podman/podman.sock:/run/user/1000/podman/podman.sock \
		--env DATABASE_URI="postgresql://postgres@localhost/?connect_timeout=10&sslmode=disable" \
		--env PODMAN_URI="unix:///run/user/1000/podman/podman.sock" \
		--env PODMAN_DIR_IMAGES="images/" \
		--env PODMAN_DIR_HEALTH="logs/" \
		--env SERVER_ADDR=":3006" \
		--publish 3006:3006 --env=.env $(IMAGE)

.PHONY: all build run
