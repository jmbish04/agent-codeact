/// <reference types="node" />

import alchemy from "alchemy";
import { Container, Worker, Ai, Vite } from "alchemy/cloudflare";
import { DurableObjectNamespace } from "alchemy/cloudflare";
import type { Sandbox } from "./src/sandbox";

const app = await alchemy("agent-codeact", {
  password: "i dont understand why it's needed",
});
const ai = new Ai();

const sandboxContainer = await Container<Sandbox>("sandbox", {
  className: "Sandbox",
  // This doesn't work for some reason
  // I had to copy the Dockerfile to the root of the project and change the container_src
  // build: {
  //   context: import.meta.dir,
  //   dockerfile: "./node_modules/@cloudflare/sandbox/Dockerfile",
  // },
  dev: {
    remote: true,
  },
  adopt: true,
  instanceType: "basic",
  observability: {
    logs: {
      enabled: true,
    },
  },
  maxInstances: 10,
});

const codeActDurableObject = new DurableObjectNamespace("codeact-agent-do", {
  className: "CodeActAgent",
  sqlite: true,
});
export const agent = await Worker("agent-worker", {
  entrypoint: "./src/agent.ts",
  compatibilityFlags: ["nodejs_compat"],
  adopt: true,
  bindings: {
    CODEACT_AGENT: codeActDurableObject,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    SANDBOX: sandboxContainer,
    AI: ai,
  },
  observability: {
    enabled: true,
  },
});

export const frontend = await Vite("frontend", {
  name: `${app.name}-${app.stage}-website`,
  main: "./src/index.ts",
  command: "bun run build",
  env: {
    API_URL: agent.url!,
  },
});

console.log(`Agent deployed at: ${agent.url}`);
await app.finalize();
