NAME				:= foilctf_database

IMAGE 			:= foilctf_database
VOLUME			:= foilctf_database
MOUNTPOINT	:= /var/lib/postgresql

all: build run

build:
	podman image build --tag $(IMAGE) .

run:
	podman container run --name $(NAME) --publish '5432:5432' --volume $(VOLUME):$(MOUNTPOINT):Z $(IMAGE)

start:
	podman container start $(NAME)

stop:
	podman container stop $(NAME)

rm:
	podman container rm $(NAME)

inspect:
	podman container inspect $(NAME)

logs:
	podman container logs $(NAME)

volume_make:
	mkdir -p $$PWD/files
	podman volume create -o type=none -o device=$$PWD/files -o o=bind $(VOLUME)

volume_rm:
	podman volume rm $(VOLUME)
	@echo "Volume deleted, Yet you still need to manually remove the volume data folder..."

.PHONY: all build run volume_make
