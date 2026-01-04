package main

import (
	"context"
	"errors"
	"time"

	buildah "github.com/containers/buildah/define"
	define "github.com/containers/podman/v5/libpod/define"
	podman "github.com/containers/podman/v5/pkg/bindings"
	containers "github.com/containers/podman/v5/pkg/bindings/containers"
	images "github.com/containers/podman/v5/pkg/bindings/images"
	entities "github.com/containers/podman/v5/pkg/domain/entities/types"
	specgen "github.com/containers/podman/v5/pkg/specgen"
	spec "github.com/opencontainers/runtime-spec/specs-go"
	podmanNetworkTypes "go.podman.io/common/libnetwork/types"
	archive "go.podman.io/storage/pkg/archive"
)

func Podman_Connect(uri string) (context.Context, error) {
	return podman.NewConnection(context.Background(), uri)
}

type PortMapping = podmanNetworkTypes.PortMapping

type ListContainer struct {
	ID    string   `json:"id"`
	State string   `json:"state"`
	Names []string `json:"names,omitempty"`

	Pid      int   `json:"pid"`
	Exited   bool  `json:"exited"`
	ExitCode int32 `json:"exit_code"`

	Image    string        `json:"image"`
	ImageID  string        `json:"image_id"`
	Networks []string      `json:"networks,omitempty"`
	Ports    []PortMapping `json:"ports,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	StartedAt time.Time `json:"started_at"`
	ExitedAt  time.Time `json:"exited_at"`
}

func Podman_List(ctx context.Context) ([]ListContainer, error) {
	var filters map[string][]string

	listOpts := new(containers.ListOptions).WithAll(true).WithFilters(filters)
	containers, err := containers.List(ctx, listOpts)
	if err != nil {
		return []ListContainer{}, err
	}

	var listContainers []ListContainer
	for _, container := range containers {
		listContainers = append(listContainers, ListContainer{
			ID:    container.ID,
			Pid:   container.Pid,
			State: container.State,
			Names: container.Names,

			CreatedAt: container.Created,
			StartedAt: time.UnixMilli(container.StartedAt),
			ExitedAt:  time.UnixMilli(container.ExitedAt),

			Image:    container.Image,
			ImageID:  container.ImageID,
			Networks: container.Networks,
			Ports:    container.Ports,

			Exited:   container.Exited,
			ExitCode: container.ExitCode,
		})
	}
	return listContainers, nil
}

func Podman_Inspect(ctx context.Context, nameOrID string) (*define.InspectContainerData, error) {
	inspectOpts := new(containers.InspectOptions).WithSize(true)
	return containers.Inspect(ctx, nameOrID, inspectOpts)
}

func Podman_Start(ctx context.Context, nameOrID string) error {
	startOpts := new(containers.StartOptions)
	return containers.Start(ctx, nameOrID, startOpts)
}

func Podman_Stop(ctx context.Context, nameOrID string) error {
	stopOpts := new(containers.StopOptions)
	return containers.Stop(ctx, nameOrID, stopOpts)
}

type CreateOptions struct {
	Name        string `json:"Name"`
	Hostname    string `json:"Hostname,omitempty"` // FALLBACK: "{containerID}"
	StopTimeout uint   `json:"StopTimeout"`        // FALLBACK: Always SIGKILL instead of SIGSTOP

	Image            string `json:"Image"`
	WorkDir          string `json:"WorkDir,omitempty"` // FALLBACK: "/"
	CreateWorkingDir bool   `json:"WorkDirCreate"`

	User string `json:"User,omitempty"` // FALLBACK: "root"

	PortMappings []PortMapping `json:"Ports,omitempty"` // FALLBACK: no ports published

	LimitMemory *spec.LinuxMemory `json:"LimitMemory,omitempty"` // FALLBACK: unlimited
	LimitCPU    *spec.LinuxCPU    `json:"LimitCPU,omitempty"`    // FALLBACK: unlimited
	LimitPids   *spec.LinuxPids   `json:"LimitPids,omitempty"`   // FALLBACK: unlimited

	// TODO(xenobas): Since we are using external packages for types like Linux*, and PortMapping, we cannot control the casing of the response... we fix it later.
	// TODO(xenobas): Do we need?
	// -	ContainerBasicConfig::Terminal
	// -	ContainerBasicConfig::Remove[Image]
	// -	ContainerContainerConfig::NetNS
	// -	ContainerNetworkConfig::HostAdd
	// -	ContainerResourceConfig::BlockIO
	// -	ContainerResourceConfig::Devices
	// -	ContainerResourceConfig::
}

type CreatedContainer = entities.ContainerCreateResponse

func Podman_Create(ctx context.Context, opts CreateOptions) (CreatedContainer, error) {
	s := new(specgen.SpecGenerator)

	// SECTION: ContainerBasicConfig
	s.Name = opts.Name
	s.Hostname = opts.Hostname
	if opts.StopTimeout > 0 {
		s.StopTimeout = new(uint)
		*s.StopTimeout = opts.StopTimeout
	}

	s.EnvHost = new(bool) // DANGER(xenobas): Prevent Host's Environment from leaking to container
	*s.EnvHost = false

	// SECTION: ContainerStorageConfig
	s.Image = opts.Image
	s.WorkDir = opts.WorkDir
	if opts.CreateWorkingDir {
		s.CreateWorkingDir = new(bool)
		*s.CreateWorkingDir = opts.CreateWorkingDir
	}

	// SECTION: ContainerSecurityConfig
	s.User = opts.User
	s.Privileged = new(bool) // DANGER(xenobas): Keep this stuff off always
	*s.Privileged = false

	// SECTION: ContainerNetworkConfig
	s.PortMappings = opts.PortMappings

	// SECTION: ContainerResourceConfig
	if opts.LimitMemory != nil || opts.LimitCPU != nil || opts.LimitPids != nil {
		s.ResourceLimits = new(spec.LinuxResources)
		s.ResourceLimits.Memory = opts.LimitMemory
		s.ResourceLimits.CPU = opts.LimitCPU
		s.ResourceLimits.Pids = opts.LimitPids
	}

	// TODO(xenobas): ContainerHealthCheckConfig

	createOpts := new(containers.CreateOptions)
	return containers.CreateWithSpec(ctx, s, createOpts)
}

type BuildOptions struct {
	ContainerFiles   []string `json:"ContainerFiles,omitempty"`
	ContextDirectory string   `json:"ContainerDirectory"`
	Name             string   `json:"Name"`
	Tags             []string `json:"Tags"`
	SkipTLSVerify    *bool    `json:"SkipTLSVerify,omitempty"` // FALLBACK: <unknown>
}

type BuiltImage = entities.BuildReport

func Podman_Build(ctx context.Context, opts BuildOptions) (*BuiltImage, error) {
	for _, file := range opts.ContainerFiles {
		// NOTE(xenobas): Disallow stdin
		if file == "/dev/stdin" {
			return nil, errors.New("disallowed container file \"/dev/stdin\"")
		}
	}

	var buildOptions entities.BuildOptions

	// TODO(xenobas): Review if these are actually sane defaults
	buildOptions.PullPolicy = buildah.PullIfMissing
	buildOptions.Compression = archive.Gzip
	buildOptions.Layers = false
	buildOptions.Squash = true
	buildOptions.MaxPullPushRetries = 3

	buildOptions.CommonBuildOpts = new(buildah.CommonBuildOptions)
	// TODO(xenobas): Figure out the defaults for CommonBuildOpts, and whethere it too is configurable

	buildOptions.Output = opts.Name
	buildOptions.AdditionalTags = opts.Tags
	buildOptions.ContextDirectory = opts.ContextDirectory
	buildOptions.SkipTLSVerify = opts.SkipTLSVerify
	// TODO(xenobas): Log files { buildOptions.In, buildOptions.Out, buildOptions.Err }

	return images.Build(ctx, opts.ContainerFiles, buildOptions)
}

// TODO(xenobas): container logs streaming...
