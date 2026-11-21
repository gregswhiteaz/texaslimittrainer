import { describe, expect, it } from 'vitest';
import type { BotTurn } from '../../src/table/session';
import { AdviceClient, type WorkerLike } from '../../src/ui/advice/advice-client';
import { requestBotDecision } from '../../src/ui/table/useTableSession';

/** A WorkerLike that counts terminate calls and lets the test fire events. */
function fakeWorker(): {
  worker: WorkerLike;
  terminated: () => number;
  emit: (type: string) => void;
} {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  let terminated = 0;
  const worker = {
    postMessage: () => undefined,
    addEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.get(type)?.delete(listener);
    },
    terminate: () => {
      terminated++;
    },
  } as unknown as WorkerLike;
  const emit = (type: string): void => {
    for (const listener of listeners.get(type) ?? []) listener({ type } as Event);
  };
  return { worker, terminated: () => terminated, emit };
}

describe('advice robustness', () => {
  it('the client terminates its worker once when the worker fails', async () => {
    for (const type of ['error', 'messageerror']) {
      const fake = fakeWorker();
      const client = new AdviceClient(fake.worker);
      const pending = client.recommend({ seat: 1 } as unknown as Parameters<
        AdviceClient['recommend']
      >[0]);
      fake.emit(type);
      await expect(pending).rejects.toThrow(`Advice worker failed: ${type}`);
      expect(fake.terminated()).toBe(1);
      client.dispose();
      expect(fake.terminated()).toBe(1);
    }
  });

  it('a bot decision whose worker cannot be created rejects instead of throwing', async () => {
    const turn = { view: { seat: 2 }, style: 'TAG' } as unknown as BotTurn;
    let request: Promise<unknown> | undefined;
    expect(() => {
      request = requestBotDecision(() => {
        throw new Error('no worker');
      }, turn);
    }).not.toThrow();
    await expect(request).rejects.toThrow('no worker');
  });
});
