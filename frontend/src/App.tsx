import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createUser,
  CurrentUserResponse,
  deleteUser,
  fetchCurrentUser,
  fetchHealth,
  fetchToken,
  fetchUsers,
  HealthResponse,
  registerProfile,
  updateUser,
  User
} from "./api";

const TOKEN_KEY = "hangbeats.access_token";
const AUTH_USERNAME_KEY = "hangbeats.auth_username";

type StatusTone = "info" | "success" | "error";

type StatusMessage = {
  tone: StatusTone;
  text: string;
};

type HealthState = "unknown" | "up" | "down";

type JwtClaims = {
  sub?: string;
  exp?: number;
};

function parseJwtClaims(token: string): JwtClaims | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export default function App() {
  const [authUsername, setAuthUsername] = useState<string>(() => localStorage.getItem(AUTH_USERNAME_KEY) ?? "");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<StatusMessage>({
    tone: "info",
    text: "Ready to connect."
  });
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenType, setTokenType] = useState("Bearer");
  const [expiresInMinutes, setExpiresInMinutes] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthState, setHealthState] = useState<HealthState>("unknown");
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [isSaveUserLoading, setIsSaveUserLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(false);
  const [isCopyingToken, setIsCopyingToken] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());

  const isAuthenticated = token.length > 0;
  const isEditing = editingUserId !== null;
  const tokenClaims = useMemo(() => parseJwtClaims(token), [token]);
  const tokenPreview = useMemo(() => {
    if (!token) {
      return "";
    }
    if (token.length <= 30) {
      return token;
    }
    return `${token.slice(0, 18)}...${token.slice(-12)}`;
  }, [token]);

  const expiresAt = useMemo(() => {
    if (!tokenClaims?.exp) {
      return null;
    }
    return new Date(tokenClaims.exp * 1000);
  }, [tokenClaims]);

  const minutesRemaining = useMemo(() => {
    if (!expiresAt) {
      return null;
    }
    const remaining = Math.ceil((expiresAt.getTime() - clockMs) / 60000);
    return Math.max(remaining, 0);
  }, [clockMs, expiresAt]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(normalizedQuery) ||
        user.displayName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchText, users]);

  const backendLabel = useMemo(() => {
    if (isHealthLoading) {
      return "Checking backend status...";
    }
    if (healthState === "up") {
      return `${health?.service ?? "Backend"} is UP`;
    }
    if (healthState === "down") {
      return "Backend is unreachable";
    }
    return "Backend status not checked";
  }, [health, healthState, isHealthLoading]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setClockMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    void handleCheckHealth();
  }, []);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    void handleLoadCurrentUser(token);
  }, [token]);

  function setStatusInfo(text: string) {
    setStatus({ tone: "info", text });
  }

  function setStatusSuccess(text: string) {
    setStatus({ tone: "success", text });
  }

  function setStatusError(text: string) {
    setStatus({ tone: "error", text });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = registerUsername.trim().toLowerCase();
    const normalizedDisplayName = registerDisplayName.trim();
    if (!normalizedUsername || !normalizedDisplayName) {
      setStatusError("Username and display name are required to create a profile.");
      return;
    }

    try {
      setIsRegisterLoading(true);
      setStatusInfo("Creating profile...");
      const registerResponse = await registerProfile(normalizedUsername, normalizedDisplayName);

      setToken(registerResponse.accessToken);
      setTokenType(registerResponse.tokenType);
      setExpiresInMinutes(registerResponse.expiresInMinutes);
      setClockMs(Date.now());
      setCurrentUser({ username: registerResponse.user.username });
      setUsers([registerResponse.user]);
      setAuthUsername(registerResponse.user.username);
      setNewUsername("");
      setDisplayName("");
      setRegisterUsername("");
      setRegisterDisplayName("");

      localStorage.setItem(TOKEN_KEY, registerResponse.accessToken);
      localStorage.setItem(AUTH_USERNAME_KEY, registerResponse.user.username);

      setStatusSuccess(`Profile created for "${registerResponse.user.username}". You are signed in.`);
    } catch (error) {
      setStatusError((error as Error).message);
    } finally {
      setIsRegisterLoading(false);
    }
  }

  async function handleTokenRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = authUsername.trim().toLowerCase();
    if (!normalizedUsername) {
      setStatusError("Username is required to generate JWT.");
      return;
    }

    try {
      setIsTokenLoading(true);
      setStatusInfo("Generating token...");

      const tokenResponse = await fetchToken(normalizedUsername);

      setToken(tokenResponse.accessToken);
      setTokenType(tokenResponse.tokenType);
      setExpiresInMinutes(tokenResponse.expiresInMinutes);
      setClockMs(Date.now());
      localStorage.setItem(TOKEN_KEY, tokenResponse.accessToken);
      localStorage.setItem(AUTH_USERNAME_KEY, normalizedUsername);
      setAuthUsername(normalizedUsername);
      setNewUsername((current) => current || normalizedUsername);
      setStatusSuccess(`JWT generated. Token valid for ${tokenResponse.expiresInMinutes} minutes.`);
      await handleLoadCurrentUser(tokenResponse.accessToken);
    } catch (error) {
      setStatusError((error as Error).message);
    } finally {
      setIsTokenLoading(false);
    }
  }

  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setStatusError("Generate token first.");
      return;
    }

    const normalizedUsername = newUsername.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    if (!normalizedUsername || !normalizedDisplayName) {
      setStatusError("Username and display name are required.");
      return;
    }

    try {
      setIsSaveUserLoading(true);
      if (isEditing && editingUserId !== null) {
        setStatusInfo("Updating user...");
        await updateUser(token, editingUserId, normalizedUsername, normalizedDisplayName);
        setStatusSuccess("User updated.");
      } else {
        setStatusInfo("Creating user...");
        await createUser(token, normalizedUsername, normalizedDisplayName);
        setStatusSuccess("User created.");
      }

      setDisplayName("");
      setNewUsername("");
      setEditingUserId(null);
      await handleLoadUsers(searchText);
    } catch (error) {
      setStatusError((error as Error).message);
    } finally {
      setIsSaveUserLoading(false);
    }
  }

  async function handleLoadUsers(queryOverride?: string) {
    if (!isAuthenticated) {
      setStatusError("Generate token first.");
      return;
    }

    const query = queryOverride ?? searchText;
    try {
      setIsUsersLoading(true);
      setStatusInfo("Loading users...");
      const loadedUsers = await fetchUsers(token, query);
      setUsers(loadedUsers);
      setStatusSuccess(`Loaded ${loadedUsers.length} users.`);
    } catch (error) {
      setStatusError((error as Error).message);
    } finally {
      setIsUsersLoading(false);
    }
  }

  async function handleDeleteUser(user: User) {
    if (!isAuthenticated) {
      setStatusError("Generate token first.");
      return;
    }

    const isConfirmed = window.confirm(`Delete user "${user.username}"?`);
    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      await deleteUser(token, user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      if (editingUserId === user.id) {
        setEditingUserId(null);
        setNewUsername("");
        setDisplayName("");
      }
      setStatusSuccess(`Deleted user "${user.username}".`);
    } catch (error) {
      setStatusError((error as Error).message);
    } finally {
      setDeletingUserId(null);
    }
  }

  function handleStartEdit(user: User) {
    setEditingUserId(user.id);
    setNewUsername(user.username);
    setDisplayName(user.displayName);
    setStatusInfo(`Editing user "${user.username}".`);
  }

  function handleCancelEdit() {
    setEditingUserId(null);
    setNewUsername("");
    setDisplayName("");
    setStatusInfo("Edit canceled.");
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setTokenType("Bearer");
    setExpiresInMinutes(0);
    setCurrentUser(null);
    setUsers([]);
    setSearchText("");
    setEditingUserId(null);
    setRegisterUsername("");
    setRegisterDisplayName("");
    setNewUsername("");
    setDisplayName("");
    setStatusInfo("Token removed.");
  }

  async function handleCheckHealth() {
    try {
      setIsHealthLoading(true);
      const healthResponse = await fetchHealth();
      setHealth(healthResponse);
      setHealthState(healthResponse.status.toUpperCase() === "UP" ? "up" : "down");
    } catch (error) {
      setHealth(null);
      setHealthState("down");
      setStatusError((error as Error).message);
    } finally {
      setIsHealthLoading(false);
    }
  }

  async function handleLoadCurrentUser(accessToken: string = token) {
    if (!accessToken) {
      return;
    }

    try {
      setIsCurrentUserLoading(true);
      const currentUserResponse = await fetchCurrentUser(accessToken);
      setCurrentUser(currentUserResponse);
    } catch (error) {
      setCurrentUser(null);
      setStatusError((error as Error).message);
    } finally {
      setIsCurrentUserLoading(false);
    }
  }

  function handleUseAuthUsername() {
    if (!authUsername.trim()) {
      setStatusError("Generate token first to reuse auth username.");
      return;
    }
    setNewUsername(authUsername.trim().toLowerCase());
    setStatusInfo("Copied auth username into user form.");
  }

  async function handleCopyToken() {
    if (!token) {
      return;
    }

    if (!navigator.clipboard) {
      setStatusError("Clipboard is not available in this browser.");
      return;
    }

    try {
      setIsCopyingToken(true);
      await navigator.clipboard.writeText(token);
      setStatusSuccess("Token copied to clipboard.");
    } catch {
      setStatusError("Unable to copy token.");
    } finally {
      setIsCopyingToken(false);
    }
  }

  return (
    <main className="page">
      <section className="app-shell">
        <header className="hero">
          <h1>Hangbeats Control Center</h1>
          <p>Complete flow for auth + user CRUD operations.</p>
          <div className="hero-actions">
            <p className={`pill pill-${healthState}`}>{backendLabel}</p>
            <button type="button" className="button-secondary" onClick={handleCheckHealth} disabled={isHealthLoading}>
              {isHealthLoading ? "Checking..." : "Check Backend"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void handleLoadCurrentUser()}
              disabled={!isAuthenticated || isCurrentUserLoading}
            >
              {isCurrentUserLoading ? "Refreshing..." : "Refresh Profile"}
            </button>
          </div>
          <div className="hero-metrics">
            <p className="hint">
              Current user:{" "}
              <strong>{isAuthenticated ? (currentUser?.username ?? "Unknown") : "Not authenticated"}</strong>
            </p>
            <p className="hint">
              Loaded users: <strong>{users.length}</strong> | Visible: <strong>{filteredUsers.length}</strong>
            </p>
          </div>
        </header>

        <section className="panel">
          <h2>0. Create New Profile</h2>
          <form onSubmit={handleRegister} className="form-stack">
            <label htmlFor="register-username">
              Username
              <input
                id="register-username"
                value={registerUsername}
                onChange={(event) => setRegisterUsername(event.target.value)}
                placeholder="new_user_01"
                autoComplete="username"
              />
            </label>
            <label htmlFor="register-display-name">
              Display name
              <input
                id="register-display-name"
                value={registerDisplayName}
                onChange={(event) => setRegisterDisplayName(event.target.value)}
                placeholder="Your public name"
              />
            </label>
            <div className="actions">
              <button type="submit" disabled={isRegisterLoading}>
                {isRegisterLoading ? "Creating Profile..." : "Create Profile & Sign In"}
              </button>
            </div>
          </form>
          <p className="hint">First-time users should create a profile here. Existing users can authenticate below.</p>
        </section>

        <section className="panel">
          <h2>1. Authenticate</h2>
          <form onSubmit={handleTokenRequest} className="form-row">
            <label htmlFor="auth-username">
              Username
              <input
                id="auth-username"
                value={authUsername}
                onChange={(event) => setAuthUsername(event.target.value)}
                placeholder="john_doe"
                autoComplete="username"
              />
            </label>
            <button type="submit" disabled={isTokenLoading}>
              {isTokenLoading ? "Generating..." : "Get JWT Token"}
            </button>
          </form>

          {isAuthenticated ? (
            <div className="token-box">
              <p className="token-label">
                Token type: <strong>{tokenType}</strong>
              </p>
              <p className="token-preview">{tokenPreview}</p>
              <div className="token-meta">
                <span>Subject: {tokenClaims?.sub ?? "Not available"}</span>
                <span>
                  Expires:
                  {expiresAt ? ` ${expiresAt.toLocaleString()}` : ` ${expiresInMinutes} minute(s) after issue`}
                </span>
                <span>Remaining: {minutesRemaining !== null ? `${minutesRemaining} min` : "Not available"}</span>
              </div>
              <div className="actions">
                <button type="button" onClick={handleCopyToken} disabled={isCopyingToken}>
                  {isCopyingToken ? "Copying..." : "Copy Token"}
                </button>
                <button type="button" className="button-danger" onClick={handleLogout}>
                  Clear Token
                </button>
              </div>
            </div>
          ) : (
            <p className="hint">Generate a token to call protected APIs.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>2. User Management</h2>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void handleLoadUsers()}
              disabled={!isAuthenticated || isUsersLoading}
            >
              {isUsersLoading ? "Loading..." : "Load Users"}
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="form-stack">
            <label htmlFor="user-username">
              Username
              <input
                id="user-username"
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
                placeholder="new_user"
              />
            </label>

            <label htmlFor="display-name">
              Display name
              <input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="John Doe"
              />
            </label>

            <div className="actions">
              <button type="submit" disabled={!isAuthenticated || isSaveUserLoading}>
                {isSaveUserLoading ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create User"}
              </button>
              {isEditing ? (
                <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="button-secondary" onClick={handleUseAuthUsername} disabled={!authUsername.trim()}>
                  Use Auth Username
                </button>
              )}
            </div>
          </form>

          <label htmlFor="search-users" className="filter-label">
            Search users
            <input
              id="search-users"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Filter by username or display name"
            />
          </label>

          {filteredUsers.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.displayName}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td className="row-actions">
                        <button type="button" className="button-secondary" onClick={() => handleStartEdit(user)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button-danger"
                          onClick={() => void handleDeleteUser(user)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint">{users.length === 0 ? "No users loaded yet." : "No users match your search."}</p>
          )}
        </section>

        <p className={`status status-${status.tone}`} role="status">
          {status.text}
        </p>
      </section>
    </main>
  );
}
