package main

import (
	"io"
	"net"
	"bufio"
	"net/http"
)

type responseWriterStatusful struct {
	http.ResponseWriter

	Status int
	wroteHeader bool
}
func (w *responseWriterStatusful) WriteHeader(statusCode int) {
	if w.wroteHeader {
		return
	}

	w.ResponseWriter.WriteHeader(statusCode)
	w.Status = statusCode
	w.wroteHeader = true
}
func (w *responseWriterStatusful) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(w.Status)
		w.wroteHeader = true
	}
	return w.ResponseWriter.Write(b)
}
func (w *responseWriterStatusful) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}
func (w *responseWriterStatusful) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hijacker, ok := w.ResponseWriter.(http.Hijacker); ok {
		return hijacker.Hijack()
	}
	return nil, nil, http.ErrNotSupported
}
func (w *responseWriterStatusful) Push(target string, opts *http.PushOptions) error {
	if pusher, ok := w.ResponseWriter.(http.Pusher); ok {
		return pusher.Push(target, opts)
	}
	return http.ErrNotSupported
}
func (w *responseWriterStatusful) ReadFrom(src io.Reader) (int64, error) {
	if readerFrom, ok := w.ResponseWriter.(io.ReaderFrom); ok {
		if !w.wroteHeader {
			w.WriteHeader(http.StatusOK)
		}
		return readerFrom.ReadFrom(src)
	}
	return io.Copy(w.ResponseWriter, src)
}
