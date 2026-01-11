# User Service

## Prerequisites
- Podman installed
- podman-compose installed
- (or similar things like `Docker`)

## How to Use

```bash
# Navigate to project root
cd ../../
```
```bash
# Build user service with podman-compose
podman-compose build user
# Run user service with podman-compose
podman-compose run -p 3001:3001 user
```
```bash
# Test the service
curl http://localhost:3001/user/config
```


## Dependencies

### Runtime (`package.json`)
bcrypt
dotenv
express
jsonwebtoken
pg
@prisma/client
@prisma/adapter-pg

### Development (`devDependencies`)
@types/bcrypt
@types/express
@types/jsonwebtoken
@types/node
@types/pg
tsx
typescript
prisma