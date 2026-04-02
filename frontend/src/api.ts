const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type User = {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
};

export type HealthResponse = {
  status: string;
  service: string;
};

export type CurrentUserResponse = {
  username: string;
};

export type RegisterResponse = TokenResponse & {
  user: User;
};

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: string }).message;
    if (message) {
      const details = (body as { details?: string[] }).details;
      if (Array.isArray(details) && details.length > 0) {
        return `${message}: ${details.join(", ")}`;
      }
      return message;
    }
  }
  return fallback;
}

export async function fetchToken(username: string): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to fetch token"));
  }

  const token = (body as { accessToken?: string }).accessToken;
  if (!token) {
    throw new Error("Token not found in response");
  }

  const tokenType = (body as { tokenType?: string }).tokenType ?? "Bearer";
  const rawExpiresInMinutes = (body as { expiresInMinutes?: number }).expiresInMinutes;
  const expiresInMinutes = Number.isFinite(rawExpiresInMinutes) ? Number(rawExpiresInMinutes) : 0;

  return {
    accessToken: token,
    tokenType,
    expiresInMinutes
  };
}

export async function registerProfile(username: string, displayName: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, displayName })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to register profile"));
  }

  const token = (body as { accessToken?: string }).accessToken;
  const user = (body as { user?: User }).user;
  if (!token || !user) {
    throw new Error("Registration response is incomplete");
  }

  const tokenType = (body as { tokenType?: string }).tokenType ?? "Bearer";
  const rawExpiresInMinutes = (body as { expiresInMinutes?: number }).expiresInMinutes;
  const expiresInMinutes = Number.isFinite(rawExpiresInMinutes) ? Number(rawExpiresInMinutes) : 0;

  return {
    accessToken: token,
    tokenType,
    expiresInMinutes,
    user
  };
}

export async function createUser(token: string, username: string, displayName: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username, displayName })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to create user"));
  }

  return body as User;
}

export async function updateUser(token: string, id: number, username: string, displayName: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username, displayName })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to update user"));
  }

  return body as User;
}

export async function deleteUser(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to delete user"));
  }
}

export async function fetchUsers(token: string, query?: string): Promise<User[]> {
  const params = new URLSearchParams();
  if (query && query.trim()) {
    params.set("query", query.trim());
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/api/v1/users${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to load users"));
  }

  return body as User[];
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to check backend health"));
  }

  return body as HealthResponse;
}

export async function fetchCurrentUser(token: string): Promise<CurrentUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Failed to load current user"));
  }

  return body as CurrentUserResponse;
}
