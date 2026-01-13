package main

import (
	"archive/tar"
	"io"
	"os"
	"path/filepath"
)

// TODO(xenobas): Timeout and Size limits
func Archive_Extract(r *tar.Reader, dirDest string) ([]string, error) {
	var extractedFiles []string

	for {
		header, err := r.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return extractedFiles, err
		}

		switch header.Typeflag {
		case tar.TypeDir:
			dirName := filepath.Clean(header.Name)
			dirPath := filepath.Join(dirDest, dirName)

			if err := os.MkdirAll(dirPath, 0750); err != nil {
				return extractedFiles, err
			}
		case tar.TypeReg:
			fileName := filepath.Clean(header.Name)
			filePath := filepath.Join(dirDest, fileName)

			file, err := os.Create(filePath)
			if err != nil {
				return extractedFiles, err
			}
			defer file.Close()

			_, err = io.Copy(file, r)
			if err != nil {
				return extractedFiles, err
			}
		}

		extractedFiles = append(extractedFiles, header.Name)
	}
	return extractedFiles, nil
}

/// TODO(xenobas): Replicate this error handling
// 		containerFilePresent := false
// 		for {
// 			header, err := archiveTar.Next()
// 			if err == io.EOF {
// 				break
// 			}
// 			if err != nil {
// 				log.Printf("Failure during extraction form tar archive \"%s\": %v", archiveName, err)
// 				return c.SendStatus(fiber.StatusInternalServerError)
// 			}

// 			switch header.Typeflag {
// 			case tar.TypeDir:
// 				// NOTE(xenobas): I don't know if it's safe to just clean and do further processing on the TypeDir/TypeReg to avoid path traversal
// 				// I assume since links are skipped we're safe, but maybe I'm wrong.
// 				dirName := filepath.Clean(header.Name)
// 				dirPath := filepath.Join(archivePath, dirName)

// 				if err := os.MkdirAll(dirPath, 0750); err != nil {
// 					log.Printf("Could not create image \"%s\" sub directory: %v", dirPath, err)
// 					return c.SendStatus(fiber.StatusInternalServerError)
// 				}
// 			case tar.TypeReg:
// 				fileName := filepath.Clean(header.Name)
// 				if fileName == "Containerfile" || fileName == "Dockerfile" {
// 					fileName = "Containerfile"
// 					containerFilePresent = true
// 				}
// 				filePath := filepath.Join(archivePath, fileName)

// 				file, err := os.Create(filePath)
// 				if err != nil {
// 					log.Printf("Could not create image \"%s\" file: %v", filePath, err)
// 					return c.SendStatus(fiber.StatusInternalServerError)
// 				}
// 				defer file.Close()

// 				_, err = io.Copy(file, archiveTar)
// 				if err != nil {
// 					log.Printf("Could not write unto image \"%s\" file: %v", filePath, err)
// 					return c.SendStatus(fiber.StatusInternalServerError)
// 				}
// 			default:
// 				log.Printf("Skipping extracting file \"%s\" due to unknown file type", header.Name)
// 			}
// 		}
// 		if !containerFilePresent {
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing Containerfile"})
// 		}
