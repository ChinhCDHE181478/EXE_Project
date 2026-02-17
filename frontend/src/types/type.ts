// Central type definitions
export interface User {
    id: string | number;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

export interface UserResponse {
    id: string | number;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
}

export interface UserSession {
    id: string | number | null;
    email: string;
    displayName: string;
}
