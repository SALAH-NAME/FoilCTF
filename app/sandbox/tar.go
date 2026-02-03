package main

import (
	"fmt"
	"archive/tar"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

func typeFlagString(typeFlag byte) string {
	switch typeFlag {
		case tar.TypeReg:
			return "regular"
		case tar.TypeRegA:
			return "regular a"
		case tar.TypeLink:
			return "hard link"
		case tar.TypeSymlink:
			return "symbolic link"
		case tar.TypeChar:
			return "character device node"
		case tar.TypeBlock:
			return "block device node"
		case tar.TypeDir:
			return "directory"
		case tar.TypeFifo:
			return "FIFO node"
		case tar.TypeCont:
			return "<reserved>"
		case tar.TypeXHeader:
			return "PAX key-value"
		case tar.TypeXGlobalHeader:
			return "PAX key-value global"
		case tar.TypeGNUSparse:
			return "GNU sparse"
		case tar.TypeGNULongName:
			return "GNU meta file path"
		case tar.TypeGNULongLink:
			return "GNU meta file link"
		default:
			return fmt.Sprintf("<unknown %v>", typeFlag)
	}
}
func tarExtractRegularFile(filePath string, r io.Reader) error {
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err := io.Copy(file, r); err != nil {
		return err
	}
	return nil
}

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
		case tar.TypeReg:
			regPath := filepath.Join(destPath, filepath.Clean(header.Name))
			if err := tarExtractRegularFile(regPath, r); err != nil {
				return err
			}
		default:
			return fmt.Errorf("cannot extract unsupported file type %q", typeFlagString(header.Typeflag))
		}
	}
	return nil
}
