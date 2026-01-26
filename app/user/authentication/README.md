#User Authentication

An authentication service built with TypeScript, Express, and JWT.
Provides secure user registration, login, token refreshing and logout.

## Tech Stack

- Language:		TypeScript
- Runtime:		Node.js
- Framework:		Express
- Database:		PostgreSQL
- ORM:			Drizzle
- Authentication:	JWT (Access Tokens)
- Password Hashing:	bcrypt

## Environment Variables

-> .env.example

## Core Interfaces

export interface User {
	id:		string;
	email:		string;
	username:	string;
	password:	string;
}

## API EndPoints

- POST /register
- POST /login
- POST /token
- DELETE /logout

## Authentication Flow

1. User registers or logs in
2. Password is hashed using bcrypt
3. JWT is generated on successful authentication
4. Client stores token
5. Token is sent in Authorization header
6. Protected routes validate token via middleware


