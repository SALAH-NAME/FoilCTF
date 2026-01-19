package main

import (
	fiber "github.com/gofiber/fiber/v3"
)

type Constraint_Identifier struct {
	fiber.CustomConstraint
}

func (*Constraint_Identifier) Name() string {
	return "identifier"
}

func (*Constraint_Identifier) Execute(param string, args ...string) bool {
	for i, ch := range param {
		isAlpha := (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
		isDigit := (ch >= '0' && ch <= '9') && i > 0
		isSymbol := (ch == '-' || ch == '_') && i > 0
		if !isAlpha && !isDigit && !isSymbol {
			return false
		}
	}
	return len(param) > 0
}
