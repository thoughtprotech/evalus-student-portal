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
  private startingPromise: Promise<void> | null = null;
  private explicitDisconnect = false;
  private pendingStop = false;

  // Singleton accessor
  public static getInstance(): SignalRClient {
    if (!SignalRClient.instance) {
      SignalRClient.instance = new SignalRClient();
    }
    return SignalRClient.instance;
  }

  // Initialize or reuse existing connection settings
  public async connect(options: SignalRClientOptions): Promise<void> {
    if (!options?.url || typeof options.url !== 'string') {
      throw new Error("SignalR connect: 'url' is required");
    }

    // Serialize concurrent start attempts
    if (this.startingPromise) {
      // Wait for existing start to finish (avoid parallel negotiation)
      return this.startingPromise;
    }

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

    const forceWs = typeof window !== 'undefined' && (window as any)?.__FORCE_SIGNALR_WS__;
    const builder = new HubConnectionBuilder()
      .withUrl(options.url, {
        accessTokenFactory: options.accessTokenFactory,
        transport: forceWs ? 1 : options.transport, // 1 = WebSockets enum value
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

    const startWithRetry = async () => {
      const maxAttempts = 4;
      let attempt = 0;
      let lastErr: any = null;
      while (attempt < maxAttempts) {
        try {
          await this.connection!.start();
          lastErr = null;
          break;
        } catch (err: any) {
          lastErr = err;
          const msg = (err?.message || "").toLowerCase();
            // eslint-disable-next-line no-console
          console.warn(`[SignalR] start attempt ${attempt + 1} failed: ${msg}`);
          if (msg.includes("negotia") || msg.includes("stopped during negotiation") || msg.includes("transport")) {
            const backoff = Math.min(1000 * Math.pow(2, attempt), 4000);
            await new Promise(r => setTimeout(r, backoff));
            attempt++;
            continue;
          }
          break; // non-retryable
        }
      }
      if (lastErr) throw lastErr;
    };

    this.explicitDisconnect = false;
    this.startingPromise = startWithRetry()
      .then(() => {
        // eslint-disable-next-line no-console
        console.info('[SignalR] connected');
        if (this.pendingStop) {
          // A disconnect was requested while starting – perform it now
            // eslint-disable-next-line no-console
          console.warn('[SignalR] pending stop executing right after connect');
          return this.disconnect();
        }
        if (this.connection) {
          this.connection.onclose((err) => {
            if (this.explicitDisconnect) return; // user initiated
            // eslint-disable-next-line no-console
            console.warn('[SignalR] connection closed, scheduling reconnect', err?.message);
            // Fire and forget reconnect
            setTimeout(() => {
              if (this.connection && this.connection.state === HubConnectionState.Disconnected) {
                this.connect(this.options! ).catch(e => console.error('[SignalR] reconnect failed', e));
              }
            }, 1000);
          });
        }
      })
      .finally(() => {
        this.startingPromise = null;
      });

    return this.startingPromise;
  }

  public async disconnect(): Promise<void> {
    this.explicitDisconnect = true;
    // If a start is inflight, mark pending stop and return; it will stop after connect.
    if (this.startingPromise) {
      this.pendingStop = true;
      return;
    }
    await this.safeStop();
    this.connection = null;
    this.pendingStop = false;
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
