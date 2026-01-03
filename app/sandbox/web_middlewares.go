package main

import (
	"github.com/gofiber/fiber/v3"
	// "github.com/gofiber/fiber/v3/client"
)

func Middleware_Authorization(c fiber.Ctx) error {
	// TODO(xenobas): Send request to auth service and get user details with the corresponding Authorization token
	// TODO(xenobas): Figure out where to store the user details
	return c.Next()
}
