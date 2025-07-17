import { Agent, routeAgentRequest, type Connection } from "agents";
import type { agent } from "../alchemy.run";
import { getSandbox } from "@cloudflare/sandbox";
export { Sandbox } from "@cloudflare/sandbox";

interface State {}

export class CodeActAgent extends Agent<typeof agent.env, State> {
  override async onStart() {
    console.log("Agent started with state:", JSON.stringify(this.state));
  }

  override async onRequest(request: Request): Promise<Response> {
    const sandbox = getSandbox(this.env.SANDBOX!, "my-sandbox");
    console.log("sandbox", sandbox);
    try {
      const cmdResult = await sandbox.exec("ls", ["-la"]);

      const response = await this.env?.AI?.run(
        "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
        {
          prompt: "Build me a Cloudflare Worker that returns JSON.",
          stream: true, // Stream a response and don't block the client!
        }
      );

      // Return the stream
      return new Response(response, {
        headers: { "content-type": "text/event-stream" },
      });
    } catch (error) {
      console.error("error", error);
      return new Response("error: " + error, { status: 500 });
    }
  }
}

export default {
  async fetch(request: Request, env: typeof agent.env) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey,
      });
    }

    if (url.pathname === "/env") {
      return Response.json({
        message: "hitting env",
        success: true,
        env: env,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }

    // Called using <baseURL>/agents/codeact-agent/:name
    // codeact-agent is kebabcase inferred from binding name
    // ✅ Works
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
};
