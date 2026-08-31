interface QueueEntry {
  run: (token: string) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class RefreshQueue {
  private entries: QueueEntry[] = [];

  get size(): number {
    return this.entries.length;
  }

  wait<T>(run: (token: string) => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.entries.push({
        run,
        resolve: (value) => resolve(value as T),
        reject,
      });
    });
  }

  flush(token: string): void {
    const pending = this.entries.splice(0);
    for (const entry of pending) {
      entry.run(token).then(entry.resolve, entry.reject);
    }
  }

  fail(error: unknown): void {
    const pending = this.entries.splice(0);
    for (const entry of pending) {
      entry.reject(error);
    }
  }
}
