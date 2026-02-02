package main

import (
	"io"
	"sync"
	"errors"
)

type Stream struct {
	mutex		sync.Mutex
	notEmpty	*sync.Cond

	buf			[]byte
	closed		bool
	err			error
	limit		int
}

var ErrClosedStream = errors.New("stream: read/write while already closed")

func NewStream(limit int) *Stream {
	stream := Stream{ limit: limit }
	stream.notEmpty = sync.NewCond(&stream.mutex)
	return &stream
}

func (s *Stream) Write(p []byte) (n int, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.closed {
		return 0, ErrClosedStream
	}
	if s.limit > 0 {
		for len(s.buf) + len(p) > s.limit && !s.closed {
			s.notEmpty.Wait()
		}
		if s.closed {
			return 0, ErrClosedStream
		}
	}

	s.buf = append(s.buf, p...)
	s.notEmpty.Signal()
	return len(p), nil
}

func (s *Stream) Read(p []byte) (n int, err error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if len(s.buf) == 0 && !s.closed {
		s.notEmpty.Wait()
	}
	if len(s.buf) == 0 && s.closed {
		return 0, io.EOF
	}

	n = copy(p, s.buf)
	s.buf = s.buf[n:]
	s.notEmpty.Signal()
	return n, nil
}

func (s *Stream) Close() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	s.closed = true
	s.notEmpty.Broadcast()
	return nil
}
