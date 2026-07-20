import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src";

describe("Covenant Odyssey Backend Worker", () => {
	beforeAll(async () => {
		// Initialize the saves table in the in-memory test D1 database using a clean single line SQL string
		await env.DB.exec("CREATE TABLE IF NOT EXISTS saves (user_id TEXT PRIMARY KEY, scene_id TEXT NOT NULL, history TEXT NOT NULL, righteous_score INTEGER DEFAULT 0, pragmatic_score INTEGER DEFAULT 0, rebel_score INTEGER DEFAULT 0, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP);");
	});

	describe("request for /api/load", () => {
		it("responds with 400 when userId is missing", async () => {
			const request = new Request("http://example.com/api/load");
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			const data = await response.json() as { error: string };
			expect(data.error).toBe("Missing userId parameter");
		});

		it("responds with 404 when user is not found in D1", async () => {
			const request = new Request("http://example.com/api/load?userId=non_existent_user");
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
			const data = await response.json() as { error: string };
			expect(data.error).toBe("No save state found for this user");
		});
	});

	describe("request for /api/save", () => {
		it("responds with 500/error when request body is empty or invalid", async () => {
			const request = new Request("http://example.com/api/save", {
				method: "POST",
				body: JSON.stringify({}),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(500);
		});

		it("successfully saves game state in D1", async () => {
			const request = new Request("http://example.com/api/save", {
				method: "POST",
				body: JSON.stringify({
					userId: "test_user_123",
					sceneId: "3",
					history: ["c1", "c2"],
					righteous: 10,
					pragmatic: 5,
					rebel: 0
				}),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			const data = await response.json() as { success: boolean };
			expect(data.success).toBe(true);

			// Verify it loads correctly
			const loadRequest = new Request("http://example.com/api/load?userId=test_user_123");
			const loadCtx = createExecutionContext();
			const loadResponse = await worker.fetch(loadRequest, env, loadCtx);
			await waitOnExecutionContext(loadCtx);

			expect(loadResponse.status).toBe(200);
			const loadData = await loadResponse.json() as any;
			expect(loadData.userId).toBe("test_user_123");
			expect(loadData.sceneId).toBe("3");
			expect(loadData.righteous).toBe(10);
			expect(loadData.pragmatic).toBe(5);
			expect(loadData.rebel).toBe(0);
		});
	});
});
