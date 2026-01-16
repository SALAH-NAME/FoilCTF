
declare global {
        namespace       Express {
                interface       User {
                        id:             string;
                        username:       string;
                        kind:           string;
                        displayname:    string;
                }
        }
}

export	interface       User {
        id:             string;
        username:       string;
        kind:           string;
        displayname:    string;
}

export	interface FortyTwoProfile {
        id:             string;
        username:       string;
        displayName:    string;
        _json: {
            kind: string;
            [key: string]: any;
        };
}

export	type    DonePassport = (err: Error | null, user?: User | false) => void;
