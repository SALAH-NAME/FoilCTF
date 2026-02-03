package main

import (
	"context"
	"errors"
	"fmt"
	"io"
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
	Id    string   `json:"id"`
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

func Podman_Container_List(ctx context.Context) ([]ListContainer, error) {
	var filters map[string][]string

	listOpts := new(containers.ListOptions).WithAll(true).WithFilters(filters)
	containers, err := containers.List(ctx, listOpts)
	if err != nil {
		return []ListContainer{}, err
	}

	var listContainers []ListContainer
	for _, container := range containers {
		listContainers = append(listContainers, ListContainer{
			Id:    container.ID,
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

type InspectedContainer struct {
	Id        string `json:"id"`
	Path      string `json:"path"`
	Namespace string `json:"namespace"`

	Args         []string `json:"args"`
	Dependencies []string `json:"dependencies"`

	IsInfra   bool `json:"is_infra"`
	IsService bool `json:"is_service"`

	SizeRw     *int64 `json:"size_rw,omitempty"`
	SizeRootFs int64  `json:"size_root_fs"`

	RestartCount int32 `json:"restart_count"`

	Image     string `json:"image"`
	ImageName string `json:"image_name"`

	OCIRuntime    string `json:"oci_runtime"`
	OCIConfigPath string `json:"oci_config_path"`

	CreatedAt time.Time `json:"created_at"`

	State  *InspectedContainerState  `json:"state"`
	Config *InspectedContainerConfig `json:"config"`
	Mounts []InspectedContainerMount `json:"mounts"`
	// TODO(xenobas): NetworkSettings
}
type InspectedContainerConfig struct {
	Image       string            `json:"image"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`

	Hostname   string `json:"hostname"`
	DomainName string `json:"domain_name"`
	User       string `json:"user"`

	Umask    string `json:"umask,omitempty"`
	Timezone string `json:"timezone,omitempty"`

	Cmd        []string `json:"cmd"`
	Entrypoint []string `json:"entrypoint"`

	Env          []string `json:"env"`
	Volumes      []string `json:"volumes"`
	Secrets      []string `json:"secrets"` // TODO(xenobas): Does this need the full details of libpod.define.InspectSecret
	ExposedPorts []string `json:"exposed_ports"`

	WorkDir       string   `json:"work_dir"`
	StopSignal    string   `json:"stop_signal"`
	CreateCommand []string `json:"create_command"`

	// TODO(xenobas): Healthcheck stuff

	Tty         bool `json:"tty"`
	OpenStdin   bool `json:"open_stdin"`
	SystemdMode bool `json:"systemd_mode"`

	Timeout     uint `json:"timeout"`
	StopTimeout uint `json:"stop_timeout"`

	Passwd *bool `json:"passwd,omitempty"`
}
type InspectedContainerMount struct {
	Type string `json:"type"`
	Name string `json:"name,omitempty"`

	RW          bool   `json:"read_write"`
	Propagation string `json:"propagation"`

	Driver  string   `json:"driver"`
	Mode    string   `json:"mode"`
	Options []string `json:"options"`

	Source      string `json:"source"`
	Destination string `json:"destination"`

	SubPath string `json:"sub_path,omitempty"`
}
type InspectedContainerState struct {
	Status    string `json:"status"`
	Pid       int    `json:"pid"`
	ConmonPid int    `json:"conmon_pid"`

	Dead       bool `json:"dead"`
	OOMKilled  bool `json:"oom_killed"`
	Paused     bool `json:"paused"`
	Restarting bool `json:"restarting"`
	Running    bool `json:"running"`

	ExitCode int    `json:"exit_code"`
	Error    string `json:"error"`

	StartedAt      time.Time `json:"started_at"`
	FinishedAt     time.Time `json:"finished_at"`
	CheckpointedAt time.Time `json:"checkpointed_at"`
	RestoredAt     time.Time `json:"restored_at"`
}

func (container *InspectedContainer) ParseInspectContainerData(data *define.InspectContainerData) *InspectedContainer {
	container.Id = data.ID
	container.Path = data.Path
	container.Namespace = data.Namespace

	container.Args = data.Args
	container.Dependencies = data.Dependencies

	container.IsInfra = data.IsInfra
	container.IsService = data.IsService

	container.SizeRw = data.SizeRw
	container.SizeRootFs = data.SizeRootFs

	container.RestartCount = data.RestartCount

	container.Image = data.Image
	container.ImageName = data.ImageName

	container.OCIRuntime = data.OCIRuntime
	container.OCIConfigPath = data.OCIConfigPath

	container.CreatedAt = data.Created

	if data.State != nil {
		state := new(InspectedContainerState)

		state.Status = data.State.Status
		state.Pid = data.State.Pid
		state.ConmonPid = data.State.ConmonPid

		state.Dead = data.State.Dead
		state.OOMKilled = data.State.OOMKilled
		state.Paused = data.State.Paused
		state.Restarting = data.State.Restarting
		state.Running = data.State.Running

		state.ExitCode = int(data.State.ExitCode)
		state.Error = data.State.Error

		state.StartedAt = data.State.StartedAt
		state.FinishedAt = data.State.FinishedAt
		state.CheckpointedAt = data.State.CheckpointedAt
		state.RestoredAt = data.State.RestoredAt

		container.State = state
	}

	if data.Config != nil {
		config := new(InspectedContainerConfig)

		config.Image = data.Config.Image
		config.Labels = data.Config.Labels
		config.Annotations = data.Config.Annotations

		config.Hostname = data.Config.Hostname
		config.DomainName = data.Config.DomainName
		config.User = data.Config.User

		config.Umask = data.Config.Umask
		config.Timezone = data.Config.Timezone

		config.Cmd = data.Config.Cmd
		config.Entrypoint = data.Config.Entrypoint

		config.Env = data.Config.Env
		for volume := range data.Config.Volumes {
			config.Volumes = append(config.Volumes, volume)
		}
		for _, secret := range data.Config.Secrets {
			config.Secrets = append(config.Secrets, secret.Name)
		}
		for port := range data.Config.ExposedPorts {
			config.ExposedPorts = append(config.ExposedPorts, port)
		}

		config.WorkDir = data.Config.WorkingDir
		config.StopSignal = data.Config.StopSignal
		config.CreateCommand = data.Config.CreateCommand

		config.Tty = data.Config.Tty
		config.OpenStdin = data.Config.OpenStdin
		config.SystemdMode = data.Config.SystemdMode

		config.Timeout = data.Config.Timeout
		config.StopTimeout = data.Config.StopTimeout

		if data.Config.Passwd != nil {
			config.Passwd = new(bool)
			*config.Passwd = *data.Config.Passwd
		}

		container.Config = config
	}
	for _, mount := range data.Mounts {
		container.Mounts = append(container.Mounts, InspectedContainerMount{
			Type: mount.Type,
			Name: mount.Name,

			RW:          mount.RW,
			Propagation: mount.Propagation,

			Driver:  mount.Driver,
			Mode:    mount.Mode,
			Options: mount.Options,

			Source:      mount.Source,
			Destination: mount.Destination,

			SubPath: mount.SubPath,
		})
	}

	return container
}

func Podman_Container_Inspect(ctx context.Context, nameOrId string) (*InspectedContainer, error) {
	inspectOpts := new(containers.InspectOptions).WithSize(true)
	inspectData, err := containers.Inspect(ctx, nameOrId, inspectOpts)
	if err != nil {
		return nil, err
	}

	container := new(InspectedContainer)
	return container.ParseInspectContainerData(inspectData), nil
}

func Podman_Container_Start(ctx context.Context, nameOrId string) error {
	startOpts := new(containers.StartOptions)
	return containers.Start(ctx, nameOrId, startOpts)
}

func Podman_Container_Stop(ctx context.Context, nameOrId string, timeout uint) error {
	stopOpts := new(containers.StopOptions)
	stopOpts = stopOpts.WithTimeout(timeout)

	return containers.Stop(ctx, nameOrId, stopOpts)
}

type ContainerCreateOptions struct {
	Hostname    string `json:"hostname,omitempty"` // FALLBACK: "{containerID}"
	StopTimeout uint   `json:"stop_timeout"`       // FALLBACK: Always SIGKILL instead of SIGSTOP

	Image            string `json:"image"`
	WorkDir          string `json:"work_dir,omitempty"` // FALLBACK: "/"
	CreateWorkingDir bool   `json:"work_dir_create"`

	User string `json:"user,omitempty"` // FALLBACK: "root"

	PortMappings []PortMapping `json:"ports,omitempty"` // FALLBACK: no ports published
	// TODO(xenobas): Re bind this struct to be our own definition

	LimitMemory *spec.LinuxMemory `json:"limit_memory,omitempty"` // FALLBACK: unlimited
	// TODO(xenobas): Re bind this struct to be our own definition
	LimitCPU *spec.LinuxCPU `json:"limit_cpu,omitempty"` // FALLBACK: unlimited
	// TODO(xenobas): Re bind this struct to be our own definition
	LimitPids *spec.LinuxPids `json:"limit_pids,omitempty"` // FALLBACK: unlimited
	// TODO(xenobas): Re bind this struct to be our own definition

	// TODO(xenobas): Do we need?
	// -	ContainerBasicConfig::Terminal
	// -	ContainerBasicConfig::Remove[Image]
	// -	ContainerContainerConfig::NetNS
	// -	ContainerNetworkConfig::HostAdd
	// -	ContainerResourceConfig::BlockIO
	// -	ContainerResourceConfig::Devices
}

type ContainerRemoveOptions = containers.RemoveOptions

func Podman_Container_Remove(ctx context.Context, nameOrId string, opts *ContainerRemoveOptions) error {
	_, err := containers.Remove(ctx, nameOrId, opts)
	return err
}

type CreatedContainer = entities.ContainerCreateResponse

func Podman_Container_Create(ctx context.Context, name string, healthLogDestination string, opts ContainerCreateOptions) (CreatedContainer, error) {
	s := new(specgen.SpecGenerator)

	// SECTION: ContainerBasicConfig
	s.Name = name
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

	// SECTION: ContainerHealthCheckConfig
	s.HealthLogDestination = healthLogDestination

	return containers.CreateWithSpec(ctx, s, nil)
}

func Podman_Container_Exists(ctx context.Context, nameOrId string) (bool, error) {
	return containers.Exists(ctx, nameOrId, nil)
}

/// SECTION: Images

type BuildOptions struct {
	Name             string
	ContextDirectory string
	SkipTLSVerify    *bool

	ContainerFiles []string
	Tags           []string

	WriterStdout io.Writer
	WriterStderr io.Writer
}

type ListImage struct {
	Id       string            `json:"id"`
	Os       string            `json:"os,omitempty"`
	Names    []string          `json:"names,omitempty"`
	Labels   map[string]string `json:"labels"`
	RepoTags []string          `json:"repo_tags,omitempty"`

	Size        int64 `json:"size"`
	SharedSize  int   `json:"size_shared"`
	VirtualSize int64 `json:"size_virtual,omitempty"`

	Containers int `json:"containers"`

	ReadOnly bool `json:"read_only"`
	Dangling bool `json:"dangling"`

	// TODO(xenobas): Do we add IsManifestList ?

	CreatedAt time.Time `json:"created_at"`
}

type BuiltImage = entities.BuildReport

type InspectedImage struct {
	Id           string `json:"id"`
	Os           string `json:"os"`
	Architecture string `json:"arch"`
	User         string `json:"user,omitempty"`

	Config *InspectedImageConfig `json:"config"`

	NamesHistory []string  `json:"names_history"`
	RepoTags     []string  `json:"repo_tags,omitempty"`
	CreatedAt    time.Time `json:"created_at"`

	Size        int64 `json:"size,omitempty"`
	VirtualSize int64 `json:"size_virtual,omitempty"`

	Version string `json:"version,omitempty"`
	Author  string `json:"author,omitempty"`
}
type InspectedImageConfig struct {
	User   string   `json:"user,omitempty"`
	Labels []string `json:"labels"`

	Env          []string `json:"env,omitempty"`
	WorkDir      string   `json:"work_dir,omitempty"`
	ExposedPorts []string `json:"exposed_ports,omitempty"`
	Volumes      []string `json:"volumes,omitempty"`

	Entrypoint []string `json:"entrypoint,omitempty"`
	Cmd        []string `json:"cmd,omitempty"`
	StopSignal string   `json:"stop_signal,omitempty"`
}

func (image *InspectedImage) ParseImageInspectReport(data *entities.ImageInspectReport) {
	if data.Config != nil {
		config := new(InspectedImageConfig)
		config.User = data.Config.User

		for label := range data.Config.Labels {
			config.Labels = append(config.Labels, label)
		}
		for exposedPort := range data.Config.ExposedPorts {
			config.ExposedPorts = append(config.ExposedPorts, exposedPort)
		}
		for volume := range data.Config.Volumes {
			config.Volumes = append(config.Volumes, volume)
		}
		config.Env = data.Config.Env
		config.WorkDir = data.Config.WorkingDir

		config.Entrypoint = data.Config.Entrypoint
		config.Cmd = data.Config.Cmd
		config.StopSignal = data.Config.StopSignal

		image.Config = config
	}

	image.Id = data.ID
	image.Os = data.Os
	image.Architecture = data.Architecture
	image.User = data.User

	image.NamesHistory = data.NamesHistory
	image.RepoTags = data.RepoTags
	image.CreatedAt = *data.Created

	image.Size = data.Size
	image.VirtualSize = data.VirtualSize

	image.Version = data.Version
	image.Author = data.Author
}

const Podman_Label_Default = "foilctf=instance"

func Podman_Image_List(ctx context.Context) ([]ListImage, error) {
	filters := make(map[string][]string)
	filters["label"] = []string{Podman_Label_Default}

	listOptions := new(images.ListOptions).WithFilters(filters)
	imgs, err := images.List(ctx, listOptions)
	if err != nil {
		return []ListImage{}, err
	}

	var listImages []ListImage
	for _, image := range imgs {
		listImages = append(listImages, ListImage{
			Id:       image.ID,
			Os:       image.Os,
			Names:    image.Names,
			Labels:   image.Labels,
			RepoTags: image.RepoTags,

			Size:        image.Size,
			SharedSize:  image.SharedSize,
			VirtualSize: image.VirtualSize,

			Containers: image.Containers,

			ReadOnly: image.ReadOnly,
			Dangling: image.Dangling,

			CreatedAt: time.UnixMilli(image.Created),
		})
	}

	return listImages, nil
}

func Podman_Image_Build(ctx context.Context, opts BuildOptions) (*BuiltImage, error) {
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

	buildOptions.Labels = []string{Podman_Label_Default}
	buildOptions.Output = opts.Name
	buildOptions.SkipTLSVerify = opts.SkipTLSVerify
	buildOptions.AdditionalTags = opts.Tags
	buildOptions.ContextDirectory = opts.ContextDirectory

	buildOptions.Out = opts.WriterStdout
	buildOptions.Err = opts.WriterStderr
	// TODO(xenobas): Log files { buildOptions.In, buildOptions.Out, buildOptions.Err }

	return images.Build(ctx, opts.ContainerFiles, buildOptions)
}

func Podman_Image_Inspect(ctx context.Context, nameOrId string, calculateSize bool) (*InspectedImage, error) {
	getOptions := new(images.GetOptions).WithSize(calculateSize)
	data, err := images.GetImage(ctx, nameOrId, getOptions)
	if err != nil {
		return nil, err
	}

	image := new(InspectedImage)
	image.ParseImageInspectReport(data)

	if image.Config == nil {
		return nil, errors.New("image doesn't have a config")
	}
	for _, label := range image.Config.Labels {
		if label == "foilctf" {
			return image, nil
		}
	}
	return nil, nil
}

func Podman_Image_Remove(ctx context.Context, nameOrId string) error {
	img, err := Podman_Image_Inspect(ctx, nameOrId, false)
	if err != nil {
		return err
	}
	if img == nil {
		err := fmt.Sprintf("image %q doesn't exist", nameOrId)
		return errors.New(err)
	}

	_, errs := images.Remove(ctx, []string{nameOrId}, nil)
	if len(errs) > 0 {
		return errs[0]
	}
	return nil
}

func Podman_Image_Exists(ctx context.Context, nameOrId string) (bool, error) {
	return images.Exists(ctx, nameOrId, nil)
}
