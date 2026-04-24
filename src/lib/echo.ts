import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// pusher-js must be on window before Echo is instantiated (Reverb uses the Pusher protocol)
(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export function initEcho(token: string): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_APP_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance;
}

// Used by customAxios to send X-Socket-ID header, enabling ->toOthers() on broadcasts
export function getSocketId(): string | null {
  return echoInstance?.socketId() ?? null;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
