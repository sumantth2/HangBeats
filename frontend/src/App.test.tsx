import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as api from "./api";

vi.mock("./api", () => ({
  registerProfile: vi.fn(),
  fetchToken: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  fetchUsers: vi.fn(),
  fetchHealth: vi.fn(),
  fetchCurrentUser: vi.fn()
}));

describe("App", () => {
  const mockedRegisterProfile = vi.mocked(api.registerProfile);
  const mockedFetchToken = vi.mocked(api.fetchToken);
  const mockedCreateUser = vi.mocked(api.createUser);
  const mockedUpdateUser = vi.mocked(api.updateUser);
  const mockedFetchUsers = vi.mocked(api.fetchUsers);
  const mockedFetchHealth = vi.mocked(api.fetchHealth);
  const mockedFetchCurrentUser = vi.mocked(api.fetchCurrentUser);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockedRegisterProfile.mockResolvedValue({
      accessToken: "token-register",
      tokenType: "Bearer",
      expiresInMinutes: 45,
      user: {
        id: 11,
        username: "newuser",
        displayName: "New User",
        createdAt: "2026-03-09T00:00:00Z"
      }
    });
    mockedFetchHealth.mockResolvedValue({
      status: "UP",
      service: "hangbeats-backend"
    });
    mockedFetchCurrentUser.mockResolvedValue({
      username: "john"
    });
  });

  it("shows validation message when token is requested without username", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Get JWT Token" }));

    expect(screen.getByText("Username is required to generate JWT.")).toBeTruthy();
  });

  it("creates a new profile and signs in", async () => {
    render(<App />);

    await userEvent.type(screen.getByPlaceholderText("new_user_01"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Your public name"), "New User");
    await userEvent.click(screen.getByRole("button", { name: "Create Profile & Sign In" }));

    await waitFor(() => {
      expect(mockedRegisterProfile).toHaveBeenCalledWith("newuser", "New User");
    });

    expect(screen.getByText(/Profile created for "newuser"/)).toBeTruthy();
  });

  it("generates token and loads users from API", async () => {
    mockedFetchToken.mockResolvedValue({
      accessToken: "token-1",
      tokenType: "Bearer",
      expiresInMinutes: 45
    });
    mockedFetchUsers.mockResolvedValue([
      {
        id: 1,
        username: "john",
        displayName: "John Doe",
        createdAt: "2026-03-09T00:00:00Z"
      }
    ]);

    render(<App />);

    await userEvent.type(screen.getByPlaceholderText("john_doe"), "john");
    await userEvent.click(screen.getByRole("button", { name: "Get JWT Token" }));

    await waitFor(() => {
      expect(mockedFetchToken).toHaveBeenCalledWith("john");
    });

    await userEvent.click(screen.getByRole("button", { name: "Load Users" }));

    await waitFor(() => {
      expect(mockedFetchUsers).toHaveBeenCalledWith("token-1", "");
    });

    expect(screen.getByText("Loaded 1 users.")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "john" })).toBeTruthy();
  });

  it("blocks user creation when display name is missing", async () => {
    localStorage.setItem("hangbeats.access_token", "token-1");
    render(<App />);

    await userEvent.type(screen.getByPlaceholderText("john_doe"), "john");
    await userEvent.click(screen.getByRole("button", { name: "Create User" }));

    expect(screen.getByText("Username and display name are required.")).toBeTruthy();
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("supports editing existing users", async () => {
    localStorage.setItem("hangbeats.access_token", "token-1");
    mockedFetchUsers.mockResolvedValue([
      {
        id: 3,
        username: "alice",
        displayName: "Alice",
        createdAt: "2026-03-09T00:00:00Z"
      }
    ]);
    mockedUpdateUser.mockResolvedValue({
      id: 3,
      username: "alice",
      displayName: "Alice Cooper",
      createdAt: "2026-03-09T00:00:00Z"
    });

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Load Users" }));
    await waitFor(() => {
      expect(mockedFetchUsers).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.clear(screen.getByPlaceholderText("John Doe"));
    await userEvent.type(screen.getByPlaceholderText("John Doe"), "Alice Cooper");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith("token-1", 3, "alice", "Alice Cooper");
    });
  });
});
