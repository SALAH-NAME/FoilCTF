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
					'Returns all publicly visible events (status: active, published, or ended), sorted by start time descending.',
				auth: null,
				queryParams: [
					{
						name: 'status',
						type: 'string',
						required: false,
						description: 'Filter by status. One of: active, published, ended.',
					},
				],
				responseExample: `[
  {
    "id": 1,
    "name": "Spring CTF 2026",
    "status": "active",
    "start_time": "2026-03-01T10:00:00Z",
    "end_time": "2026-03-03T10:00:00Z",
    "team_members_min": 1,
    "team_members_max": 4,
    "meta_data": {
      "description": "Annual spring competition.",
      "banner": "https://cdn.foilctf.io/banners/spring26.webp"
    }
  }
]`,
			},
			{
				method: 'GET',
				path: '/api/events/:id',
				summary: 'Get event details',
				description:
					'Returns full details for a single event including organizers, participation count, challenge count and top teams for active/ended events.',
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
  "event_data": {
    "name": "Spring CTF 2026",
    "status": "active",
    "start_time": "2026-03-01T10:00:00Z",
    "end_time": "2026-03-03T10:00:00Z",
    "team_members_min": 1,
    "team_members_max": 4,
    "participation_count": 42,
    "challenge_count": 18,
    "meta_data": {}
  },
  "organizers": [
    { "username": "alice", "avatar": "https://cdn.foilctf.io/avatars/alice.png" }
  ],
  "user_status": "not_joined",
  "top_teams": [
    { "team_name": "ByteBreakers", "score": 4500, "rank": 1 },
    { "team_name": "NullPointers", "score": 4200, "rank": 2 },
    { "team_name": "RootKit",      "score": 3800, "rank": 3 }
  ]
}`,
			},
			{
				method: 'GET',
				path: '/api/events/:id/scoreboard',
				summary: 'Event scoreboard',
				description:
					"Returns the full ranked scoreboard for an event, including each team's score, solved challenge count and last-solve timestamp.",
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
						name: 'limit',
						type: 'integer',
						required: false,
						description: 'Max number of teams to return. Defaults to all.',
					},
				],
				responseExample: `[
  {
    "rank": 1,
    "team_name": "ByteBreakers",
    "score": 4500,
    "solved": 14,
    "last_solve": "2026-03-02T18:43:11Z"
  },
  {
    "rank": 2,
    "team_name": "NullPointers",
    "score": 4200,
    "solved": 13,
    "last_solve": "2026-03-02T20:01:05Z"
  }
]`,
			},
		],
	},
	{
		id: 'challenges-heading',
		title: 'Challenges',
		description: 'Access the challenge catalogue available across all events.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/challenges',
				summary: 'List challenges',
				description:
					'Returns the catalogue of all challenges. Each entry includes metadata such as category, difficulty and current reward.',
				auth: null,
				responseExample: `[
  {
    "id": "c3a7b812-...",
    "name": "Buffer Overflow 101",
    "description": "Exploit a classic stack buffer overflow.",
    "category": "pwn",
    "difficulty": "medium",
    "reward": 300,
    "reward_min": 100,
    "reward_decrements": true,
    "solves": 7
  }
]`,
			},
		],
	},
	{
		id: 'users-heading',
		title: 'Users & Auth',
		description:
			'Fetch public player profiles and manage account registration.',
		endpoints: [
			{
				method: 'GET',
				path: '/api/profiles/:username',
				summary: 'Get public profile',
				description:
					'Returns the public profile of any registered user. Private profiles return a 403.',
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
  "bio": "CTF enthusiast & web security researcher.",
  "avatar": "https://cdn.foilctf.io/avatars/alice.png",
  "links": {
    "github": "https://github.com/alice"
  },
  "stats": {
    "events_joined": 5,
    "challenges_solved": 42,
    "total_score": 12750
  }
}`,
			},
			{
				method: 'POST',
				path: '/api/auth/register',
				summary: 'Register a new account',
				description:
					'Creates a new player account. Returns a signed JWT access/refresh token pair on success.',
				auth: null,
				requestExample: `{
  "username": "alice",
  "email": "alice@example.com",
  "password": "sUp3rS3cr3t!"
}`,
				responseExample: `{
  "token_access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "token_refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "id": "3f9e1a23-…",
    "username": "alice",
    "role": "player"
  }
}`,
			},
		],
	},
];
