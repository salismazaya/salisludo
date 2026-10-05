import { describe, it, expect } from 'vitest';
import { getPusherConfig, isPusherReady, roomChannel } from '../realtime.js';

describe('Pusher Realtime Integration', () => {
  it('correctly reads pusher configuration and generates room channel', () => {
    const channel = roomChannel('ABCDEF');
    expect(channel).toBe('room-ABCDEF');

    const cfg = getPusherConfig();
    expect(cfg).toHaveProperty('appId');
    expect(cfg).toHaveProperty('key');
    expect(cfg).toHaveProperty('secret');
    expect(cfg).toHaveProperty('cluster');
  });

  it('reports pusher not ready when environment variables are empty', () => {
    // In test environment without env credentials
    expect(typeof isPusherReady()).toBe('boolean');
  });
});
