"use client";

import { signalRClient } from "../signalrClient";


export interface HeartbeatParams {
  testResponseId: number;
  clientId?: string; // e.g., "nextjs-client"
}

// Server method names (adjust to your hub)
const SERVER_METHOD_HEARTBEAT_ACK = "HeartbeatAck";

// Optional: local wrapper to ack Heartbeat
export async function sendHeartbeatAck({
  testResponseId,
  clientId = "nextjs-client",
}: HeartbeatParams): Promise<void> {
  // Throws if not connected
  await signalRClient.invoke<void>(SERVER_METHOD_HEARTBEAT_ACK, testResponseId, clientId);
}
