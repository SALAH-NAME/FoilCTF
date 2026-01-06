IMAGE 			:= foilctf_sandbox

all: build run

build:
	podman build --tag $(IMAGE) .

run:
	podman run --detach --publish 8080:8080 $(IMAGE)

.PHONY: all build run
