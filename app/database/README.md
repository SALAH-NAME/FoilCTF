# database

## Dependencies
- [PostgreSQL](https://www.postgresql.org)

## Usage
```sh
mkdir files && make volume_create # Must be run only once
cp -R migrations/ files/migrations/ # Updates the migrations visible to the container
make # Builds the image, and runs the container.
```

## Features
- [x] Migrations
- [ ] Users
	- [ ] containers
	- [ ] auth
	- [ ] notification
	- [ ] chat
	- [ ] challenge
	- [ ] scoreboard
	- [ ] user
- [x] Tables
	- [ ] Profiles: Teams, Organizers, and Participants all have profiles which they can customize.
	- [x] Users: Represents an authenticated entity which can interact with the services depending on their privilege status
	- [ ] Sessions: Active authenticated entity session
	- [ ] CTFs: Events past, current, and future
	- [ ] Teams: A collective of users that can participate in CTFs
	- [ ] Hints: self explanatory, are linked to Challenge
	- [x] Participations: Instantiation of the Team in the Challenge
	- [ ] Attachments: Any file, or generic piece of data that can be attached to a Challenge
	- [ ] Challenges: Recipes for Containers
	- [ ] Containers: A mirror the the OCI `container` instance
	- [x] Notifications: self explanatory
	- [x] Messages: self explanatory, are linked to a CTF in order to identify a chatroom
	- [x] Reports: Bugs, Feature Requests, Feedback, and whatever may fit...








