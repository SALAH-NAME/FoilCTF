import type { ComponentProps } from 'react';
import type ApiEndpoint from '~/components/ApiEndpoint';

export type EndpointDef = ComponentProps<typeof ApiEndpoint>;

export interface EndpointGroup {
	id: string;
	title: string;
	description: string;
	endpoints: EndpointDef[];
}

export const API_ENDPOINT_GROUPS: EndpointGroup[] = [
	// ---------------------------------------------------------------
	// Authentication
	// ---------------------------------------------------------------
	{
		id: 'auth-heading',
		title: 'Authentication',
		description:
			'Register, sign in and manage JWT tokens. All auth tokens are short-lived access tokens paired with a long-lived refresh token.',
		endpoints: [
			{
				method: 'POST',
				path: '/api/auth/register',
				summary: 'Register a new account',
				description:
					'Creates a new player account. Username must be 3-15 characters (alphanumeric, _, -).',
				auth: null,
				requestExample: `{
  "username": "alice",
  "email": "alice@example.com",
  "password": "sUp3rS3cr3t!"
}`,
				responseExample: `{
  "ok": true
}`,
				responseSummary: '201 Created',
			},
			{
				method: 'POST',
				path: '/api/auth/login',
				summary: 'Sign in',
				description:
					'Authenticates with username + password and returns a JWT access/refresh token pair.',
				auth: null,
				requestExample: `{
  "username": "alice",
  "password": "sUp3rS3cr3t!"
}`,
				responseExample: `{
  "token_access": "eyJhbGciOiJIUzI1NiIs…",
  "token_refresh": "eyJhbGciOiJIUzI1NiIs…",
  "expiry": "2026-03-02T12:30:00Z"
}`,
			},
			{
				method: 'POST',
				path: '/api/auth/refresh',
				summary: 'Refresh access token',
				description:
					'Exchange a valid refresh token for a new access token. The refresh token can be passed as a Bearer header or as the `token` query parameter.',
				auth: null,
				queryParams: [
					{
						name: 'token',
						type: 'string',
						required: false,
						description: 'The refresh token (alternative to Bearer header).',
					},
				],
				responseExample: `{
  "token_access": "eyJhbGciOiJIUzI1NiIs…"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/auth/logout',
				summary: 'Logout / revoke refresh token',
				description:
					'Revokes the given refresh token so it can no longer be used.',
				auth: null,
				queryParams: [
					{
						name: 'token',
						type: 'string',
						required: true,
						description: 'The refresh token to revoke.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
		],
	},

	// ---------------------------------------------------------------
	// Events (public)
	// ---------------------------------------------------------------
	{
		id: 'events-heading',
		title: 'Events',
		description:
			'Query, browse and track CTF events and their live scoreboards.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/events',
				summary: 'List events',
				description:
					'Returns all publicly visible events. Sorted by active-first, then by start_time.',
				auth: null,
				queryParams: [
					{
						name: 'status',
						type: 'string',
						required: false,
						description:
							'Filter by status. One of: active, draft, published, ended.',
					},
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search events by name (LIKE match).',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number (1-based). Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
					{
						name: 'sort',
						type: 'string',
						required: false,
						description:
							'Set to "asc" for oldest-first. Default: newest-first.',
					},
				],
				responseExample: `{
  "events": [
    {
      "id": 1,
      "name": "Spring CTF 2026",
      "status": "active",
      "start_time": "2026-03-01T10:00:00Z",
      "end_time": "2026-03-03T10:00:00Z",
      "team_members_min": 1,
      "team_members_max": 4,
      "metadata": {},
      "max_teams": null,
      "teams_count": 12
    }
  ],
  "count": 1
}`,
			},
			{
				method: 'GET',
				path: '/api/events/:id',
				summary: 'Get event details',
				description:
					'Returns full event details including organizers, participation count, challenge count, user status, and top 3 teams for active/ended events.',
				auth: null,
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				responseExample: `{
  "event": {
    "name": "Spring CTF 2026",
    "description": "Annual spring competition.",
    "status": "active",
    "start_time": "2026-03-01T10:00:00Z",
    "end_time": "2026-03-03T10:00:00Z",
    "team_members_min": 1,
    "team_members_max": 4,
    "metadata": {},
    "max_teams": null,
    "participation_count": 42,
    "challenge_count": 18
  },
  "organizers": [
    { "username": "alice", "avatar": "/api/profiles/alice/avatar/photo.png" }
  ],
  "user_status": {
    "is_organizer": false,
    "is_guest": true,
    "is_joined": false
  },
  "top_teams": [
    { "rank": 1, "team_name": "ByteBreakers", "score": 4500, "solves": 14, "last_attempt_at": "2026-03-02T18:43:11Z" },
    { "rank": 2, "team_name": "NullPointers", "score": 4200, "solves": 13, "last_attempt_at": "2026-03-02T20:01:05Z" },
    { "rank": 3, "team_name": "RootKit",      "score": 3800, "solves": 12, "last_attempt_at": null }
  ]
}`,
			},
			{
				method: 'GET',
				path: '/api/events/:id/leaderboard',
				summary: 'Paginated leaderboard',
				description:
					'Returns a paginated, searchable leaderboard for active or ended events. Ranks are assigned globally regardless of search filter or page.',
				auth: null,
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				queryParams: [
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number (1-based). Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search teams by name (LIKE match).',
					},
				],
				responseExample: `{
  "leaderboard": [
    { "rank": 1, "team_name": "ByteBreakers", "score": 4500, "solves": 14, "last_attempt_at": "2026-03-02T18:43:11Z" },
    { "rank": 2, "team_name": "NullPointers", "score": 4200, "solves": 13, "last_attempt_at": null }
  ],
  "count": 42
}`,
			},
			{
				method: 'GET',
				path: '/api/events/:id/status',
				summary: 'Player participation status',
				description:
					'Returns the authenticated player\'s team rank, total points, solved challenges and total challenge count for the given event.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				responseExample: `{
  "team_name": "ByteBreakers",
  "rank": 3,
  "total_points": 3800,
  "solved_challenges": 12,
  "total_challenges": 18
}`,
			},
			{
				method: 'POST',
				path: '/api/events/:id/join',
				summary: 'Join an event',
				description:
					'Registers the authenticated user\'s team in the event. Only the team captain can join. Validates team size against event constraints.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				responseExample: `{
  "ok": true
}`,
				responseSummary: '201 Created',
			},
			{
				method: 'DELETE',
				path: '/api/events/:id/leave',
				summary: 'Leave an event',
				description:
					'Removes the authenticated user\'s team from the event. Only the team captain can leave.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
			{
				method: 'GET',
				path: '/api/events/:id/challenges',
				summary: 'List event challenges (player view)',
				description:
					'Returns challenges grouped by category with solved status for the authenticated player\'s team. Locked/hidden challenges are filtered out.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
				],
				responseExample: `{
  "Pwn": [
    { "id": 1, "name": "Buffer Overflow 101", "description": "Exploit a classic stack overflow.", "category": "Pwn", "reward": 450, "solves": 7, "is_solved": true }
  ],
  "Web": [
    { "id": 2, "name": "XSS Hunter", "description": "Find the reflected XSS.", "category": "Web", "reward": 300, "solves": 12, "is_solved": false }
  ]
}`,
			},
			{
				method: 'POST',
				path: '/api/events/:id/challenges/:chall_id/submit',
				summary: 'Submit a flag',
				description:
					'Validates the submitted flag for a challenge, awards points and updates the scoreboard. Returns first-blood information when applicable.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'id',
						type: 'integer',
						required: true,
						description: 'The unique event identifier.',
					},
					{
						name: 'chall_id',
						type: 'integer',
						required: true,
						description: 'The challenge identifier within the event.',
					},
				],
				requestExample: `{
  "flag": "foilctf{s0m3_s3cr3t_fl4g}"
}`,
				responseExample: `{
  "status": "correct",
  "first_blood": false,
  "points_earned": 450
}`,
			},
		],
	},

	// ---------------------------------------------------------------
	// Challenges
	// ---------------------------------------------------------------
	{
		id: 'challenges-heading',
		title: 'Challenges',
		description:
			'CRUD operations on the global challenge catalogue. Challenges are linked to events separately.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/challenges',
				summary: 'List challenges',
				description:
					'Returns the global challenge catalogue with pagination and optional search/status filters.',
				auth: null,
				queryParams: [
					{
						name: 'search',
						type: 'string',
						required: false,
						description: 'Case-insensitive name search (ILIKE).',
					},
					{
						name: 'status',
						type: 'string',
						required: false,
						description: 'Filter: "draft" or "published".',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Max results. Default: 50.',
					},
					{
						name: 'offset',
						type: 'integer',
						required: false,
						description: 'Offset for pagination. Default: 0.',
					},
				],
				responseExample: `{
  "challenges": [
    {
      "id": 1,
      "is_published": true,
      "name": "Buffer Overflow 101",
      "description": "Exploit a classic stack buffer overflow.",
      "category": "pwn",
      "reward": 500,
      "reward_min": 350,
      "reward_first_blood": 50,
      "reward_decrements": true,
      "author_id": 1,
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-02-20T14:30:00Z"
    }
  ],
  "count": 42
}`,
			},
			{
				method: 'POST',
				path: '/api/challenges',
				summary: 'Create a challenge',
				description:
					'Creates a new challenge in the global catalogue. Requires at minimum a category and author_id.',
				auth: null,
				requestExample: `{
  "name": "Buffer Overflow 101",
  "description": "Exploit a classic stack buffer overflow.",
  "category": "pwn",
  "author_id": 1,
  "reward": 500,
  "reward_min": 350,
  "reward_first_blood": 50,
  "reward_decrements": true,
  "is_published": false
}`,
				responseExample: `{
  "challenge": [
    { "id": 1, "name": "Buffer Overflow 101", "category": "pwn", "..." : "..." }
  ]
}`,
				responseSummary: '201 Created',
			},
			{
				method: 'GET',
				path: '/api/challenges/:challenge_id',
				summary: 'Get challenge details',
				description: 'Returns full details for a single challenge.',
				auth: null,
				pathParams: [
					{
						name: 'challenge_id',
						type: 'integer',
						required: true,
						description: 'The unique challenge identifier.',
					},
				],
				responseExample: `{
  "challenge": {
    "id": 1,
    "is_published": true,
    "name": "Buffer Overflow 101",
    "description": "Exploit a classic stack buffer overflow.",
    "category": "pwn",
    "reward": 500,
    "reward_min": 350,
    "reward_first_blood": 50,
    "reward_decrements": true,
    "author_id": 1,
    "created_at": "2026-01-15T08:00:00Z",
    "updated_at": "2026-02-20T14:30:00Z"
  }
}`,
			},
			{
				method: 'PUT',
				path: '/api/challenges/:challenge_id',
				summary: 'Update a challenge',
				description: 'Partially updates a challenge. All fields are optional.',
				auth: null,
				pathParams: [
					{
						name: 'challenge_id',
						type: 'integer',
						required: true,
						description: 'The unique challenge identifier.',
					},
				],
				requestExample: `{
  "name": "Buffer Overflow 201",
  "reward": 600
}`,
				responseExample: `{
  "ok": true
}`,
			},
			{
				method: 'DELETE',
				path: '/api/challenges/:challenge_id',
				summary: 'Delete a challenge',
				description: 'Permanently removes a challenge from the catalogue.',
				auth: null,
				pathParams: [
					{
						name: 'challenge_id',
						type: 'integer',
						required: true,
						description: 'The unique challenge identifier.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
		],
	},


	// ---------------------------------------------------------------
	// Users
	// ---------------------------------------------------------------
	{
		id: 'users-heading',
		title: 'Users',
		description:
			'Search users, view the current authenticated user, and manage account settings.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/users',
				summary: 'Search users',
				description:
					'Paginated user search. When authenticated, results include friend status for each user.',
				auth: null,
				queryParams: [
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search by username (LIKE match).',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number. Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
				],
				responseExample: `{
  "data": [
    {
      "id": 1,
      "username": "alice",
      "role": "user",
      "team_name": "ByteBreakers",
      "avatar": "/api/profiles/alice/avatar/photo.png",
      "total_points": 12750,
      "challenges_solved": 42,
      "friend_status": "friends"
    }
  ],
  "page": 1,
  "limit": 10,
  "count": 1
}`,
			},
			{
				method: 'GET',
				path: '/api/users/me',
				summary: 'Current user info',
				description:
					'Returns the authenticated user\'s full account record (excluding password).',
				auth: 'Bearer',
				responseExample: `{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "user",
  "team_name": "ByteBreakers",
  "oauth42_login": null,
  "profile_id": 1,
  "created_at": "2026-01-10T08:00:00Z",
  "banned_until": "0001-01-01T00:00:00Z"
}`,
			},
			{
				method: 'PUT',
				path: '/api/users/:username',
				summary: 'Update account',
				description:
					'Updates account fields (username, email, password). Requires current password for verification. Returns new tokens on success.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Current username of the account.',
					},
				],
				requestExample: `{
  "username": "alice_new",
  "email": "newalice@example.com",
  "password": "currentPassword123",
  "password_new": "newPassword456!"
}`,
				responseExample: `{
  "token_access": "eyJhbGciOiJIUzI1NiIs…",
  "token_refresh": "eyJhbGciOiJIUzI1NiIs…",
  "expiry": "2026-03-02T12:30:00Z"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/users/:username',
				summary: 'Delete account',
				description:
					'Permanently deletes the authenticated user\'s account. Requires password confirmation.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the account to delete.',
					},
				],
				requestExample: `{
  "password": "currentPassword123"
}`,
				responseExample: `{
  "ok": true
}`,
			},
		],
	},

	// ---------------------------------------------------------------
	// Profiles
	// ---------------------------------------------------------------
	{
		id: 'profiles-heading',
		title: 'Profiles',
		description:
			'Public player profiles with stats, bio, and avatar management.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/profiles/:username',
				summary: 'Get public profile',
				description:
					'Returns the public profile for any user. Private profiles hide bio, location, and social links from non-friends. Includes friend status when authenticated.',
				auth: null,
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'The unique username of the player.',
					},
				],
				responseExample: `{
  "username": "alice",
  "avatar": "/api/profiles/alice/avatar/photo.png",
  "bio": "CTF enthusiast & web security researcher.",
  "location": "Paris, France",
  "social_media_links": "https://github.com/alice",
  "challenges_solved": 42,
  "events_participated": 5,
  "total_points": 12750,
  "friend_status": "none"
}`,
			},
			{
				method: 'PUT',
				path: '/api/profiles/:username',
				summary: 'Update profile',
				description:
					'Updates the authenticated user\'s profile fields. All fields are optional.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username (must match authenticated user).',
					},
				],
				requestExample: `{
  "bio": "Security researcher",
  "location": "Paris",
  "socialmedialinks": "https://github.com/alice",
  "isprivate": false
}`,
				responseExample: `{
  "ok": true
}`,
			},
			{
				method: 'POST',
				path: '/api/profiles/:username/avatar',
				summary: 'Upload avatar',
				description:
					'Uploads a profile avatar image. Accepts image/jpeg or image/png via multipart form data.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username (must match authenticated user).',
					},
				],
				responseExample: `{
  "ok": true
}`,
				responseSummary: '201 Created (multipart/form-data with "avatar" field)',
			},
			{
				method: 'DELETE',
				path: '/api/profiles/:username/avatar',
				summary: 'Delete avatar',
				description: 'Removes the profile avatar and restores the default.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username (must match authenticated user).',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
		],
	},

	// ---------------------------------------------------------------
	// Teams
	// ---------------------------------------------------------------
	{
		id: 'teams-heading',
		title: 'Teams',
		description:
			'Create and manage teams, handle membership, and process join requests.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/teams',
				summary: 'List teams',
				description:
					'Paginated team list with optional search and open/closed filter.',
				auth: null,
				queryParams: [
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search by team name.',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number. Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
					{
						name: 'status',
						type: 'string',
						required: false,
						description: '"open" or "closed" to filter by lock status.',
					},
				],
				responseExample: `{
  "data": [
    {
      "id": 1,
      "name": "ByteBreakers",
      "captain_name": "alice",
      "members_count": 3,
      "description": "We break bytes.",
      "is_locked": false
    }
  ],
  "page": 1,
  "limit": 10,
  "count": 15,
  "counts": { "all": 15, "open": 8, "closed": 7 }
}`,
			},
			{
				method: 'GET',
				path: '/api/teams/me',
				summary: 'Current user\'s team',
				description:
					'Returns the team the authenticated user belongs to.',
				auth: 'Bearer',
				responseExample: `{
  "id": 1,
  "name": "ByteBreakers",
  "captain_name": "alice",
  "members_count": 3,
  "description": "We break bytes.",
  "is_locked": false,
  "profile_id": 1
}`,
			},
			{
				method: 'GET',
				path: '/api/teams/:team_name',
				summary: 'Get team details',
				description: 'Returns public details for a team by name.',
				auth: null,
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "name": "ByteBreakers",
  "captain_name": "alice",
  "members_count": 3,
  "description": "We break bytes.",
  "is_locked": false
}`,
			},
			{
				method: 'POST',
				path: '/api/teams',
				summary: 'Create team',
				description:
					'Creates a new team with the authenticated user as captain. Name must be 4-15 characters.',
				auth: 'Bearer',
				requestExample: `{
  "name": "ByteBreakers"
}`,
				responseExample: `{
  "message": "Created",
  "status": 201
}`,
				responseSummary: '201 Created',
			},
			{
				method: 'PUT',
				path: '/api/teams',
				summary: 'Update team settings',
				description:
					'Updates team description and lock status. Only the captain can update.',
				auth: 'Bearer (captain)',
				requestExample: `{
  "description": "We break bytes and build tools.",
  "is_locked": true
}`,
				responseExample: `{
  "message": "Created",
  "status": 200
}`,
			},
			{
				method: 'DELETE',
				path: '/api/teams/:team_name',
				summary: 'Delete team',
				description:
					'Dissolves the team. All members are removed and notified. Only the captain can delete.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
			{
				method: 'GET',
				path: '/api/teams/:team_name/members',
				summary: 'List team members',
				description: 'Returns all members of a team with their stats.',
				auth: null,
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "members": [
    { "id": 1, "username": "alice", "avatar": "…", "total_points": 8500, "challenges_solved": 30 },
    { "id": 2, "username": "bob", "avatar": "…", "total_points": 4250, "challenges_solved": 12 }
  ]
}`,
			},
			{
				method: 'PUT',
				path: '/api/teams/:team_name/crown',
				summary: 'Transfer captaincy',
				description:
					'Transfers the captain role to another team member.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				requestExample: `{
  "username": "bob"
}`,
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/teams/:team_name/members/me',
				summary: 'Leave team',
				description:
					'Removes the current user from the team. Captains can only leave if they are the sole member.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/teams/:team_name/members/:username',
				summary: 'Kick member',
				description: 'Removes a member from the team. Captain only.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the member to kick.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'GET',
				path: '/api/teams/:team_name/requests',
				summary: 'List join requests',
				description:
					'Returns pending join requests for the team. Captain only.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				queryParams: [
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search requesting usernames.',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number. Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
				],
				responseExample: `{
  "data": ["bob", "charlie"],
  "page": 1,
  "limit": 10
}`,
			},
			{
				method: 'POST',
				path: '/api/teams/:team_name/requests',
				summary: 'Send join request',
				description:
					'Sends a join request to the team. The team captain is notified.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'PUT',
				path: '/api/teams/:team_name/requests/:username',
				summary: 'Accept join request',
				description:
					'Accepts a pending join request. Captain only.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the applicant.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/teams/:team_name/requests',
				summary: 'Cancel own join request',
				description:
					'Cancels the current user\'s pending join request.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
			{
				method: 'DELETE',
				path: '/api/teams/:team_name/requests/:username',
				summary: 'Decline join request',
				description:
					'Rejects a pending join request. Captain only.',
				auth: 'Bearer (captain)',
				pathParams: [
					{
						name: 'team_name',
						type: 'string',
						required: true,
						description: 'The unique team name.',
					},
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the applicant to reject.',
					},
				],
				responseExample: `{
  "ok": true
}`,
			},
		],
	},

	// ---------------------------------------------------------------
	// Friends
	// ---------------------------------------------------------------
	{
		id: 'friends-heading',
		title: 'Friends',
		description:
			'Manage your friend list and friend requests.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/friends',
				summary: 'List friends',
				description:
					'Returns a paginated list of the authenticated user\'s friends (usernames).',
				auth: 'Bearer',
				queryParams: [
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search friends by username.',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number. Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
				],
				responseExample: `{
  "data": ["bob", "charlie"],
  "page": 1,
  "limit": 10,
  "count": 2
}`,
			},
			{
				method: 'GET',
				path: '/api/friends/requests',
				summary: 'List friend requests',
				description:
					'Returns sent, received, or all friend requests for the authenticated user.',
				auth: 'Bearer',
				queryParams: [
					{
						name: 'type',
						type: 'string',
						required: false,
						description: '"sent", "received", or "all" (default).',
					},
					{
						name: 'q',
						type: 'string',
						required: false,
						description: 'Search by username.',
					},
					{
						name: 'page',
						type: 'integer',
						required: false,
						description: 'Page number. Default: 1.',
					},
					{
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Items per page. Default: 10.',
					},
				],
				responseExample: `{
  "data": [
    { "sender_name": "alice", "receiver_name": "bob" }
  ],
  "page": 1,
  "limit": 10,
  "count": 1
}`,
			},
			{
				method: 'POST',
				path: '/api/friends/requests/:username',
				summary: 'Send friend request',
				description:
					'Sends a friend request to the specified user.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username to send the request to.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/friends/requests/:username',
				summary: 'Cancel friend request',
				description:
					'Cancels a sent friend request.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username whose request to cancel.',
					},
				],
				responseExample: `{
  "message": "Request cancelled successfully",
  "status": 200
}`,
			},
			{
				method: 'PATCH',
				path: '/api/friends/requests/pending/:username',
				summary: 'Accept friend request',
				description:
					'Accepts an incoming friend request and creates the friendship.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the sender to accept.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/friends/requests/pending/:username',
				summary: 'Reject friend request',
				description:
					'Rejects an incoming friend request.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the sender to reject.',
					},
				],
				responseExample: `{
  "ok": true,
  "message": "OK"
}`,
			},
			{
				method: 'DELETE',
				path: '/api/friends/:username',
				summary: 'Remove friend',
				description:
					'Removes someone from the friend list.',
				auth: 'Bearer',
				pathParams: [
					{
						name: 'username',
						type: 'string',
						required: true,
						description: 'Username of the friend to remove.',
					},
				],
				responseExample: `{
  "message": "Friend removed",
  "status": 200
}`,
			},
		],
	},
];
