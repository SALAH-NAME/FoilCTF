package podman

import (
	"context"

	podman_core "github.com/containers/podman/v5/pkg/bindings"
)

func Connect(uri string) (conn context.Context, err error) {
	return podman_core.NewConnection(context.Background(), uri)
}
