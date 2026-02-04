package podman

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	buildah_define "github.com/containers/buildah/define"
	podman_images "github.com/containers/podman/v5/pkg/bindings/images"
	podman_entities "github.com/containers/podman/v5/pkg/domain/entities"
	podman_types "github.com/containers/podman/v5/pkg/domain/entities/types"
	podman_archive "go.podman.io/storage/pkg/archive"
)

const ImageLabelDefault = "foilctf=instance"

type ImageListElement struct {
	Id     string            `json:"id"`
	Names  []string          `json:"names"`
	Labels map[string]string `json:"labels"`

	ReadOnly bool `json:"read_only"`
	Dangling bool `json:"dangling"`

	Size        int64 `json:"size"`
	SharedSize  int64 `json:"shared_size"`
	VirtualSize int64 `json:"virtual_size"`

	CreatedAt time.Time `json:"created_at"`
}

func parseImageListElement(summary *podman_types.ImageSummary) ImageListElement {
	var element ImageListElement

	element.Id = summary.ID
	element.Names = summary.Names
	element.Labels = summary.Labels

	element.ReadOnly = summary.ReadOnly
	element.Dangling = summary.Dangling

	element.Size = int64(summary.Size)
	element.SharedSize = int64(summary.SharedSize)
	element.VirtualSize = int64(summary.VirtualSize)

	element.CreatedAt = time.Unix(summary.Created, 0)
	return element
}

type ImageElement struct {
	Id      string `json:"id"`
	Author  string `json:"author"`
	Comment string `json:"comment"`
	Version string `json:"version"`

	Labels       map[string]string `json:"labels"`
	Annotations  map[string]string `json:"annotations"`
	NamesHistory []string          `json:"names_history"`

	Arch string `json:"arch"`
	Os   string `json:"os"`
	User string `json:"user"`

	Size        int64 `json:"size"`
	VirtualSize int64 `json:"virtual_size"`

	CreatedAt time.Time `json:"created_at"`

	Config struct {
		User   string            `json:"user"`
		Labels map[string]string `json:"labels"`

		ExposedPorts []string `json:"exposed_ports"`
		Volumes      []string `json:"volumes"`

		Env        []string `json:"env"`
		Cmd        []string `json:"cmd"`
		WorkingDir string   `json:"working_dir"`

		StopSignal string `json:"stop_signal"`
	} `json:"config"`
}

func parseImageElement(report *podman_types.ImageInspectReport) ImageElement {
	var element ImageElement

	element.Config.User = report.Config.User
	element.Config.Labels = report.Config.Labels

	for exposedPort := range report.Config.ExposedPorts {
		element.Config.ExposedPorts = append(element.Config.ExposedPorts, exposedPort)
	}
	for volume := range report.Config.Volumes {
		element.Config.Volumes = append(element.Config.Volumes, volume)
	}

	element.Config.Env = report.Config.Env
	element.Config.Cmd = report.Config.Cmd
	element.Config.WorkingDir = report.Config.WorkingDir

	element.Config.StopSignal = report.Config.StopSignal

	element.Id = report.ID
	element.Author = report.Author
	element.Comment = report.Comment
	element.Version = report.Version

	element.Labels = report.Labels
	element.Annotations = report.Annotations
	element.NamesHistory = report.NamesHistory

	element.Arch = report.Architecture
	element.Os = report.Os
	element.User = report.User

	element.Size = report.Size
	element.VirtualSize = report.VirtualSize

	element.CreatedAt = *report.Created
	return element
}

func ImageList(conn context.Context) (elements []ImageListElement, err error) {
	filters := make(map[string][]string)
	filters["label"] = append(filters["label"], ImageLabelDefault)

	opts := new(podman_images.ListOptions).WithFilters(filters)
	imgs, err := podman_images.List(conn, opts)
	if err != nil {
		return []ImageListElement{}, err
	}

	for _, img := range imgs {
		if img == nil {
			continue
		}

		element := parseImageListElement(img)
		elements = append(elements, element)
	}
	return elements, nil
}

func ImageExists(conn context.Context, imageName string) (exists bool, err error) {
	if exists, err = podman_images.Exists(conn, imageName, nil); err != nil {
		return false, err
	}
	return exists, err
}

func ImageInspect(conn context.Context, imageName string) (element ImageElement, err error) {
	var image *podman_types.ImageInspectReport

	opts := new(podman_images.GetOptions).WithSize(true)
	if image, err = podman_images.GetImage(conn, imageName, opts); err != nil {
		return element, err
	}
	if image == nil {
		return element, fmt.Errorf("could not inspect image %q", imageName)
	}

	return parseImageElement(image), nil
}

func ImageRemove(conn context.Context, imageName string) error {
	opts := new(podman_images.RemoveOptions)
	_, deleteErrs := podman_images.Remove(conn, []string{imageName}, opts)
	if len(deleteErrs) > 0 {
		return deleteErrs[0]
	}
	return nil
}

func ImageCreate(conn context.Context, imageName string, imageDirectory string, imageStdout io.Writer, imageStderr io.Writer) error {
	var options podman_entities.BuildOptions

	options.Out = imageStdout
	options.Err = imageStderr

	options.PullPolicy = buildah_define.PullIfMissing
	options.CommonBuildOpts = new(buildah_define.CommonBuildOptions)

	options.Compression = podman_archive.Gzip
	options.Layers = false
	options.Squash = true
	options.MaxPullPushRetries = 3

	options.SkipTLSVerify = new(bool)
	*options.SkipTLSVerify = true

	options.ContextDirectory = imageDirectory

	options.Output = imageName
	options.Labels = []string{ImageLabelDefault}

	containerFile := filepath.Join(imageDirectory, "Containerfile")

	_, err := podman_images.Build(conn, []string{containerFile}, options)
	return err
}
