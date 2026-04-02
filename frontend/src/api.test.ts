import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUser,
  deleteUser,
  fetchCurrentUser,
  fetchHealth,
  fetchToken,
  fetchUsers,
  registerProfile,
  updateUser
} from "./api";

function mockResponse(ok: boolean, body: string): Response {
  return {
    ok,
    text: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

describe("api helpers", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchToken returns token response on success", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        true,
        JSON.stringify({
          accessToken: "token-1",
          tokenType: "Bearer",
          expiresInMinutes: 45
        })
      )
    );

    const token = await fetchToken("john");

    expect(token).toEqual({
      accessToken: "token-1",
      tokenType: "Bearer",
      expiresInMinutes: 45
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/token",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("fetchToken throws server message on error", async () => {
    fetchMock.mockResolvedValue(mockResponse(false, JSON.stringify({ message: "Invalid user" })));

    await expect(fetchToken("john")).rejects.toThrow("Invalid user");
  });

  it("registerProfile returns token and created user", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        true,
        JSON.stringify({
          accessToken: "token-register",
          tokenType: "Bearer",
          expiresInMinutes: 45,
          user: {
            id: 5,
            username: "newuser",
            displayName: "New User",
            createdAt: "2026-03-09T00:00:00Z"
          }
        })
      )
    );

    const registration = await registerProfile("newuser", "New User");

    expect(registration).toEqual({
      accessToken: "token-register",
      tokenType: "Bearer",
      expiresInMinutes: 45,
      user: {
        id: 5,
        username: "newuser",
        displayName: "New User",
        createdAt: "2026-03-09T00:00:00Z"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/register",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("createUser sends bearer token and returns created user", async () => {
    const payload = {
      id: 1,
      username: "john",
      displayName: "John Doe",
      createdAt: "2026-03-09T00:00:00Z"
    };
    fetchMock.mockResolvedValue(mockResponse(true, JSON.stringify(payload)));

    const user = await createUser("token-1", "john", "John Doe");

    expect(user).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-1"
        })
      })
    );
  });

  it("fetchUsers throws fallback error when body is empty", async () => {
    fetchMock.mockResolvedValue(mockResponse(false, ""));

    await expect(fetchUsers("token-1")).rejects.toThrow("Failed to load users");
  });

  it("fetchUsers sends optional query param", async () => {
    fetchMock.mockResolvedValue(mockResponse(true, "[]"));

    await fetchUsers("token-1", "john");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users?query=john",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-1"
        })
      })
    );
  });

  it("updateUser sends PUT payload", async () => {
    const payload = {
      id: 1,
      username: "johnny",
      displayName: "Johnny Doe",
      createdAt: "2026-03-09T00:00:00Z"
    };
    fetchMock.mockResolvedValue(mockResponse(true, JSON.stringify(payload)));

    const user = await updateUser("token-1", 1, "johnny", "Johnny Doe");

    expect(user).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users/1",
      expect.objectContaining({
        method: "PUT"
      })
    );
  });

  it("deleteUser calls delete endpoint", async () => {
    fetchMock.mockResolvedValue(mockResponse(true, ""));

    await deleteUser("token-1", 9);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users/9",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer token-1"
        })
      })
    );
  });

  it("fetchHealth returns backend status", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        true,
        JSON.stringify({
          status: "UP",
          service: "hangbeats-backend"
        })
      )
    );

    const health = await fetchHealth();

    expect(health).toEqual({
      status: "UP",
      service: "hangbeats-backend"
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/health");
  });

  it("fetchCurrentUser returns authenticated username", async () => {
    fetchMock.mockResolvedValue(mockResponse(true, JSON.stringify({ username: "john" })));

    const profile = await fetchCurrentUser("token-1");

    expect(profile).toEqual({ username: "john" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-1"
        })
      })
    );
  });
});
