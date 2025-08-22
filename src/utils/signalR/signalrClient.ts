// app/lib/signalrClient.ts
"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IHttpConnectionOptions,
  LogLevel,
} from "@microsoft/signalr";

// Public types for safer usage across your app
export type SignalREventHandler<TArgs extends any[] = any[]> = (...args: TArgs) => void;

export interface SignalRClientOptions {
  url: string;
  accessTokenFactory?: () => string | Promise<string>;
  logLevel?: LogLevel;
  reconnectDelays?: number[]; // in ms
  transport?: IHttpConnectionOptions["transport"]; // optional override if you need WebSockets only, etc.
}

class SignalRClient {
  private static instance: SignalRClient | null = null;
  private connection: HubConnection | null = null;
  private url: string | null = null;
  private options: SignalRClientOptions | null = null;
  private handlers: Map<string, Set<SignalREventHandler>> = new Map();

  // Singleton accessor
  public static getInstance(): SignalRClient {
    if (!SignalRClient.instance) {
      SignalRClient.instance = new SignalRClient();
    }
    return SignalRClient.instance;
  }

  // Initialize or reuse existing connection settings
  public async connect(options: SignalRClientOptions): Promise<void> {
    // If already connected to same URL, no-op
    if (
      this.connection &&
      this.connection.state === HubConnectionState.Connected &&
      this.url === options.url
    ) {
      return;
    }

    // If an existing connection exists but different URL or not connected, tear it down cleanly
    if (this.connection) {
      await this.safeStop();
      this.connection = null;
    }

    this.url = options.url;
    this.options = options;

    const builder = new HubConnectionBuilder()
      .withUrl(options.url, {
        accessTokenFactory: options.accessTokenFactory,
        transport: options.transport,
      })
      .withAutomaticReconnect(options.reconnectDelays ?? [0, 2000, 5000, 10000])
      .configureLogging(options.logLevel ?? LogLevel.Information);

    this.connection = builder.build();

    // Re-bind handlers if any were registered before connect
    for (const [event, fns] of this.handlers.entries()) {
      for (const fn of fns) {
        this.connection.on(event, fn as (...args: any[]) => void);
      }
    }

    // Start connection
    await this.connection.start();
  }

  public async disconnect(): Promise<void> {
    await this.safeStop();
    this.connection = null;
    // Keep handlers map so reconnect preserves them
  }

  private async safeStop(): Promise<void> {
    try {
      if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
        await this.connection.stop();
      }
    } catch {
      // swallow; safe stop
    }
  }

  public getState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  // Register an event handler; safe pre/post connect
  public on<TArgs extends any[]>(event: string, handler: SignalREventHandler<TArgs>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    if (!set.has(handler)) {
      set.add(handler);
      if (this.connection) {
        this.connection.on(event, handler as (...args: any[]) => void);
      }
    }
  }

  // Unregister a specific handler
  public off<TArgs extends any[]>(event: string, handler: SignalREventHandler<TArgs>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    if (set.has(handler)) {
      set.delete(handler);
      if (this.connection) {
        this.connection.off(event, handler as (...args: any[]) => void);
      }
    }
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  // Remove all handlers for an event
  public offAll(event: string): void {
    const set = this.handlers.get(event);
    if (!set) return;
    if (this.connection) {
      for (const handler of set) {
        this.connection.off(event, handler as (...args: any[]) => void);
      }
    }
    this.handlers.delete(event);
  }

  // Invoke a server method with args, returns typed result
  public async invoke<TResult = unknown>(methodName: string, ...args: any[]): Promise<TResult> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error("SignalR is not connected. Call connect() first.");
    }
    const result = await this.connection.invoke<TResult>(methodName, ...args);
    return result;
  }

  // Send (fire-and-forget) a server method
  public async send(methodName: string, ...args: any[]): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error("SignalR is not connected. Call connect() first.");
    }
    await this.connection.send(methodName, ...args);
  }
}

export const signalRClient = SignalRClient.getInstance();
