package main

import (
	"archive/tar"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

func TarExtract(archive multipart.File, destPath string) error {
	r := tar.NewReader(archive)
	for {
		header, err := r.Next()
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}

		switch header.Typeflag {
		case tar.TypeDir:
		case tar.TypeReg:
			regPath := filepath.Join(destPath, filepath.Clean(header.Name))

			regFile, err := os.Create(regPath)
			if err != nil {
				return err
			}
			defer regFile.Close()

			if _, err := io.Copy(regFile, r); err != nil {
				return err
			}
		}
	}
	return nil
}
