package podman

import (
	"time"
	"context"

	podman_define "github.com/containers/podman/v5/libpod/define"
	podman_containers "github.com/containers/podman/v5/pkg/bindings/containers"
	podman_types "github.com/containers/podman/v5/pkg/domain/entities/types"
	podman_specgen "github.com/containers/podman/v5/pkg/specgen"
	podman_nettypes "go.podman.io/common/libnetwork/types"
)

type ContainerPortMapping struct {
	Host      uint16 `json:"host"`
	Container uint16 `json:"container"`
	Protocol  string `json:"protocol"`
}

type ContainerCreateOptions struct {
	Name  string `json:"name"`
	Image string `json:"image"`

	User  string                 `json:"user"`
	Ports []ContainerPortMapping `json:"ports"`

	HealthLogDestination string `json:"-"`
}

func (options *ContainerCreateOptions) ToSpecGenerator() *podman_specgen.SpecGenerator {
	s := podman_specgen.NewSpecGenerator(options.Image, false)

	s.CreateWorkingDir = new(bool)
	*s.CreateWorkingDir = true

	s.StopTimeout = new(uint)
	*s.StopTimeout = 5

	s.EnvHost = new(bool)
	*s.EnvHost = false

	s.Privileged = new(bool)
	*s.Privileged = false

	s.NetNS.NSMode = podman_specgen.Default
	s.NetNS.Value = ""

	s.Name = options.Name
	s.User = options.User
	s.HealthLogDestination = options.HealthLogDestination
	s.PortMappings = make([]podman_nettypes.PortMapping, len(options.Ports))
	for i, portMapping := range options.Ports {
		var m podman_nettypes.PortMapping

		m.HostPort = portMapping.Host
		m.ContainerPort = portMapping.Container
		m.Protocol = portMapping.Protocol

		s.PortMappings[i] = m
	}

	return s
}

type ContainerElementState struct {
	Pid int `json:"pid"`
	ConmonPid int `json:"conmon_pid"`
	Status string `json:"status"`

	ExitCode int32 `json:"exit_code"`
	Error string `json:"error"` // NOTE(xenobas): Marked as TODO in the source

	Running bool `json:"running"`
	Paused bool `json:"paused"`
	Restarting bool `json:"restarting"` // NOTE(xenobas): Marked as TODO in the source
	OOMKilled bool `json:"oom_killed"`
	Dead bool `json:"dead"`
	Checkpointed bool `json:"checkpointed"`
	Restored bool `json:"restored"`
	StoppedByUser bool `json:"stopped_by_user"`

	StartedAt time.Time `json:"started_at"`
	FinishedAt time.Time `json:"finished_at"`
	CheckpointedAt time.Time `json:"checkpointed_at"`
	RestoredAt time.Time `json:"restored_at"`

	CheckpointPath string `json:"checkpoint_path"`
	CgroupPath string `json:"cgroup_path"`

	RestoreLog string `json:"restore_log"`
	CheckpointLog string `json:"restore_log"`
}

type ContainerElementMount struct {
	Type string `json:"type"`
	Name string `json:"name"`
	Source string `json:"source"`
	Destination string `json:"destination"`
	Driver string `json:"driver"`
	Mode string `json:"mode"`

	Propagation string `json:"propagation"`
	SubPath string `json:"sub_path"`

	RW bool `json:"rw"`

	Options []string `json:"options"`
}

type ContainerElementConfig struct {
	Image string `json:"image"`
	Timezone string `json:"timezone"`
	WorkingDir string `json:"working_dir"`

	User string `json:"user"`
	Env []string `json:"env"`
	Cmd []string `json:"cmd"`
	Volumes []string `json:"volumes"`
	Entrypoint []string `json:"entrypoint"`
	ExposedPorts []string `json:"exposed_ports"`

	Hostname string `json:"hostname"`
	DomainName string `json:"domain_name"`

	Labels map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`

	Timeout uint `json:"timeout"`
	StopSignal string `json:"stop_signal"`
	StopTimeout uint `json:"stop_timeout"`

	Tty bool `json:"tty"`
	SystemdMode bool `json:"systemd_mode"`

	OpenStdin bool `json:"open_stdin"`
	StdinOnce bool `json:"stdin_once"`

	AttachStdin bool `json:"attach_stdin"`
	AttachStdout bool `json:"attach_stdout"`
	AttachStderr bool `json:"attach_stderr"`
}

type ContainerElement struct {
	Id string `json:"id"`
	Name string `json:"name"`
	Config ContainerElementConfig `json:"config"`

	Mounts []ContainerElementMount `json:"mounts"`
	Dependencies []string `json:"dependencies"`
	// TODO(xenobas): NetworkSettings

	SizeRw	int64 `json:"size_rw"`
	SizeRootFs int64 `json:"size_root_fs"`

	Driver string `json:"driver"`
	Namespace string `json:"namespace"`

	MountLabel string `json:"mount_label"`
	ProcessLabel string `json:"process_label"`

	State ContainerElementState `json:"state"`

	RestartCount int `json:"restart_count"`
	LockNumber uint32 `json:"lock_number"`

	Image string `json:"image"`
	ImageDigest string `json:"image_digest"`
	ImageName string `json:"image_name"`

	Pod string `json:"pod"`
	KubeExitCodePropagation string `json:"kube_exit_code_propagation"`

	Rootfs string `json:"rootfs"`
	ExecIDs []string `json:"exec_ids"`

	BoundingCaps []string `json:"bounding_caps"`
	EffectiveCaps []string `json:"effective_caps"`

	StaticDir string `json:"static_dir"`
	OCIRuntime string `json:"oci_runtime"`

	PidFile string `json:"pid_file"`
	ConmonPidFile string `json:"conmon_pid_file"`

	OCIConfigPath string `json:"oci_config_path"`
	ResolvConfPath string `json:"resolv_conf_path"`
	HostnamePath string `json:"hostname_path"`
	HostsPath string `json:"hosts_path"`

	IsInfra bool `json:"is_infra"`
	IsService bool `json:"is_service"`

	UseImageHosts bool `json:"use_image_hosts"`
	UseImageHostname bool `json:"use_image_hostname"`

	CreatedAt time.Time `json:"created_at"`
}

func parseContainerElement(data *podman_define.InspectContainerData) ContainerElement {
	var element ContainerElement

	element.Id = data.ID
	element.Name = data.Name
	element.Config = ContainerElementConfig{
		Image: data.Config.Image,
		Timezone: data.Config.Timezone,
		WorkingDir: data.Config.WorkingDir,

		User: data.Config.User,
		Env: data.Config.Env,
		Cmd: data.Config.Cmd,
		Entrypoint: data.Config.Entrypoint,

		Hostname: data.Config.Hostname,
		DomainName: data.Config.DomainName,

		Labels: data.Config.Labels,
		Annotations: data.Config.Annotations,

		Timeout: data.Config.Timeout,
		StopSignal: data.Config.StopSignal,
		StopTimeout: data.Config.StopTimeout,

		Tty: data.Config.Tty,
		SystemdMode: data.Config.SystemdMode,

		OpenStdin: data.Config.OpenStdin,
		StdinOnce: data.Config.StdinOnce,

		AttachStdin: data.Config.AttachStdin,
		AttachStdout: data.Config.AttachStdout,
		AttachStderr: data.Config.AttachStderr,
	}

	for volume := range data.Config.Volumes {
		element.Config.Volumes = append(element.Config.Volumes, volume)
	}

	element.Config.ExposedPorts = make([]string, len(data.Config.ExposedPorts))
	portIndex := 0
	for exposedPort := range data.Config.ExposedPorts {
		element.Config.ExposedPorts[portIndex] = exposedPort
		portIndex++
	}

	for _, mount := range data.Mounts {
		element.Mounts = append(element.Mounts, ContainerElementMount{
			Type: mount.Type,
			Name: mount.Name,
			Source: mount.Source,
			Destination: mount.Destination,
			Driver: mount.Driver,
			Mode: mount.Mode,

			Propagation: mount.Propagation,
			SubPath: mount.SubPath,

			RW: mount.RW,

			Options: mount.Options,
		})
	}
	element.Dependencies = data.Dependencies

	if data.SizeRw != nil {
		element.SizeRw = *data.SizeRw
	}
	element.SizeRootFs = data.SizeRootFs

	element.Driver = data.Driver
	element.Namespace = data.Namespace

	element.MountLabel = data.MountLabel
	element.ProcessLabel = data.ProcessLabel

	element.State = ContainerElementState{
		Pid: data.State.Pid,
		ConmonPid: data.State.ConmonPid,
		Status: data.State.Status,

		ExitCode: data.State.ExitCode,
		Error: data.State.Error,

		Running: data.State.Running,
		Paused: data.State.Paused,
		Restarting: data.State.Restarting,
		OOMKilled: data.State.OOMKilled,
		Dead: data.State.Dead,
		Checkpointed: data.State.Checkpointed,
		Restored: data.State.Restored,
		StoppedByUser: data.State.StoppedByUser,

		StartedAt: data.State.StartedAt,
		FinishedAt: data.State.FinishedAt,
		CheckpointedAt: data.State.CheckpointedAt,
		RestoredAt: data.State.RestoredAt,

		CheckpointPath: data.State.CheckpointPath,
		CgroupPath: data.State.CgroupPath,

		RestoreLog: data.State.RestoreLog,
		CheckpointLog: data.State.CheckpointLog,
	}

	element.RestartCount = int(data.RestartCount)
	element.LockNumber = data.LockNumber

	element.Image = data.Image
	element.ImageDigest = data.ImageDigest
	element.ImageName = data.ImageName

	element.Pod = data.Pod
	element.KubeExitCodePropagation = data.KubeExitCodePropagation

	element.Rootfs = data.Rootfs
	element.ExecIDs = data.ExecIDs

	element.BoundingCaps = data.BoundingCaps
	element.EffectiveCaps = data.EffectiveCaps

	element.StaticDir = data.StaticDir
	element.OCIRuntime = data.OCIRuntime

	element.PidFile = data.PidFile
	element.ConmonPidFile = data.ConmonPidFile

	element.OCIConfigPath = data.OCIConfigPath
	element.ResolvConfPath = data.ResolvConfPath
	element.HostnamePath = data.HostnamePath
	element.HostsPath = data.HostsPath

	element.IsInfra = data.IsInfra
	element.IsService = data.IsService

	element.UseImageHosts = data.UseImageHosts
	element.UseImageHostname = data.UseImageHostname

	element.CreatedAt = data.Created
	return element
}

type ContainerListElement struct {
	Id string `json:"id"`
	Pid int `json:"pid"`

	State string `json:"string"`
	Status string `json:"status"`
	Command []string `json:"command"`

	Restarts uint `json:"restarts"`
	AutoRemove bool `json:"auto_remove"`

	Pod string `json:"pod"`
	PodName string `json:"pod_name"`

	CIDFile string `json:"cid_file"`

	RwSize int64 `json:"rw_size"`
	RootFsSize int64 `json:"root_fs_size"`

	Labels map[string]string `json:"labels"`
	Mounts []string `json:"mounts"`
	Names []string `json:"names"`

	Ports []ContainerPortMapping `json:"ports"`
	ExposedPorts map[uint16][]string `json:"exposed_ports"`

	Exited bool `json:"exited"`
	ExitCode int32 `json:"exit_code"`

	CreatedAt time.Time `json:"created_at"`
	StartedAt time.Time `json:"started_at"`
	ExitedAt time.Time `json:"exited_at"`
}

func parseContainerListElement(container podman_types.ListContainer) ContainerListElement {
	var element ContainerListElement

	element.Id = container.ID
	element.Pid = container.Pid

	element.State = container.State
	element.Status = container.Status
	element.Command = container.Command
	if element.Command == nil {
		element.Command = []string{ }
	}

	element.Restarts = container.Restarts
	element.AutoRemove = container.AutoRemove

	element.Pod = container.Pod
	element.PodName = container.PodName

	element.CIDFile = container.CIDFile

	if container.Size != nil {
		element.RwSize = container.Size.RwSize
		element.RootFsSize = container.Size.RootFsSize
	}

	element.Labels = container.Labels
	element.Mounts = container.Mounts
	element.Names = container.Names

	element.Ports = make([]ContainerPortMapping, len(container.Ports))
	for i, m := range container.Ports {
		var p ContainerPortMapping

		p.Host = m.HostPort
		p.Container = m.ContainerPort
		p.Protocol = m.Protocol

		element.Ports[i] = p
	}

	element.ExposedPorts = container.ExposedPorts
	if element.ExposedPorts == nil {
		element.ExposedPorts = map[uint16][]string{ }
	}

	element.Exited = container.Exited
	element.ExitCode = container.ExitCode

	element.CreatedAt = container.Created
	element.StartedAt = time.Unix(container.StartedAt, 0)
	element.ExitedAt = time.Unix(container.ExitedAt, 0)

	return element
}

// ---

func ContainerList(conn context.Context) (elements []ContainerListElement, err error) {
	filters := map[string][]string{ "label": []string{ ImageLabelDefault } }

	options := new(podman_containers.ListOptions).WithFilters(filters).WithAll(true)
	containers, err := podman_containers.List(conn, options)
	if err != nil {
		return []ContainerListElement{ }, err
	}

	elements = make([]ContainerListElement, len(containers))
	for i, container := range containers {
		elements[i] = parseContainerListElement(container)
	}
	return elements, nil
}

func ContainerInspect(conn context.Context, containerName string) (element ContainerElement, err error) {
	options := new(podman_containers.InspectOptions).WithSize(true)
	if container, err := podman_containers.Inspect(conn, containerName, options); err == nil {
		return parseContainerElement(container), nil
	} else {
		return element, err
	}
}

func ContainerCreate(conn context.Context, options ContainerCreateOptions) error {
	s := options.ToSpecGenerator()
	s.Labels = map[string]string { "foilctf": "instance" }

	_, err := podman_containers.CreateWithSpec(conn, s, nil)
	return err
}

func ContainerStart(conn context.Context, containerName string) error {
	options := new(podman_containers.StartOptions)
	return podman_containers.Start(conn, containerName, options)
}

func ContainerStop(conn context.Context, containerName string, timeout uint) error {
	options := new(podman_containers.StopOptions).WithTimeout(timeout)
	return podman_containers.Stop(conn, containerName, options)
}

func ContainerExists(conn context.Context, containerName string) (exists bool, err error) {
	return podman_containers.Exists(conn, containerName, new(podman_containers.ExistsOptions))
}

func ContainerDelete(conn context.Context, containerName string) error {
	// TODO(xenobas): Volumes, Depend, Ignore, Force, Timeout
	options := new(podman_containers.RemoveOptions)
	_, err := podman_containers.Remove(conn, containerName, options)
	return err
}
