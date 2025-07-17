import { Container } from "@cloudflare/containers";
import type { agent } from "../alchemy.run.ts";

export class Sandbox extends Container {
  declare env: typeof agent.env;

  override defaultPort = 3000; // The default port for the container to listen on

  override onStart() {
    console.log("Container successfully started");
  }

  override onStop() {
    console.log("Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Container error:", error);
  }
}
