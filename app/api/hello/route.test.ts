// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

const ENDPOINT = "http://localhost:3000/api/hello";

function getRequest(query = "") {
  return new NextRequest(`${ENDPOINT}${query}`);
}

function postRequest(body: string) {
  return new NextRequest(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("GET /api/hello", () => {
  it("greets the name supplied in the query string", async () => {
    const response = await GET(getRequest("?name=Ali"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ message: "Hello, Ali!", method: "GET" });
  });

  it("falls back to World when no name is given", async () => {
    const body = await (await GET(getRequest())).json();

    expect(body.message).toBe("Hello, World!");
  });

  it("returns a valid ISO timestamp", async () => {
    const body = await (await GET(getRequest())).json();

    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});

describe("POST /api/hello", () => {
  it("greets the name from a JSON body and echoes it back", async () => {
    const response = await POST(postRequest(JSON.stringify({ name: "Sara" })));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Hello, Sara! (via POST)");
    expect(body.receivedData).toEqual({ name: "Sara" });
  });

  it("falls back to World when the body has no name", async () => {
    const body = await (await POST(postRequest(JSON.stringify({})))).json();

    expect(body.message).toBe("Hello, World! (via POST)");
  });

  it("rejects a malformed JSON body with 400", async () => {
    const response = await POST(postRequest("{ not json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid JSON in request body");
  });
});
