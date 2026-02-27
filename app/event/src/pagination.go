package main

import (
	"net/http"
	"strconv"
)

type Pagination struct {
	Limit int
	Offset int
	Search string
	Sort   bool
}

func ParsePaginationNumber(r *http.Request, name string, minimum int, fallback int) int {
	query := r.URL.Query()
	value := query.Get(name)
	if n, err := strconv.ParseUint(value, 10, 32); err == nil && value != "" && int(n) >= minimum {
		return int(n)
	}
	return fallback
}
func ParsePaginationSearch(r *http.Request) string {
	query := r.URL.Query()
	value := query.Get("q")
	if value == "" {
		return "%"
	}
	return "%" + value + "%"
}
func ParsePaginationString(r *http.Request, name string) string {
	query := r.URL.Query()
	return query.Get(name)
}

func ParsePagination(r *http.Request) Pagination {
	limit := ParsePaginationNumber(r, "limit", 1, 10)
	offset := (ParsePaginationNumber(r, "page", 1, 1) - 1) * limit
	search := ParsePaginationSearch(r)
	sort := ParsePaginationString(r, "sort") == "asc"

	return Pagination{ limit, offset, search, sort }
}
