// Type definitions for the Window Management API
interface ScreenDetailed extends Screen {
    availLeft: number;
    availTop: number;
    label: string;
}

interface ScreenDetails {
    currentScreen: ScreenDetailed;
    screens: ScreenDetailed[];
}

// Extend standard FullscreenOptions to include the new Window Management screen target
interface MultiScreenFullscreenOptions extends FullscreenOptions {
    screen?: ScreenDetailed;
}

declare global {
    interface Window {
        getScreenDetails?: () => Promise<ScreenDetails>;
    }
    interface Element {
        requestFullscreen(options?: MultiScreenFullscreenOptions): Promise<void>;
    }
}

const logEl = document.getElementById('log');

const log = (msg: string): void => {
    if (logEl) {
        // Create an element and use textContent to bypass TrustedHTML requirements
        const div = document.createElement('div');
        div.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
        logEl.appendChild(div);
    }
};

// 1. Enter Fullscreen
const btnFullscreen = document.getElementById('btn-fullscreen');

btnFullscreen?.addEventListener('click', async () => {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (err) {
      log(`Exit fullscreen error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  if (!window.getScreenDetails) {
    log('Window Management API not supported in this browser.');
    return;
  }
  
  let screenDetails = await window.getScreenDetails();

  // Make the current window fullscreen on its current screen.
  document.documentElement.requestFullscreen({screen : screenDetails.currentScreen});
});

document.addEventListener('fullscreenchange', () => {
  if (btnFullscreen) {
    if (document.fullscreenElement) {
      btnFullscreen.textContent = 'Exit fullscreen mode';
    } else {
      btnFullscreen.textContent = '1. Enter Fullscreen';
    }
  }
});

// 2. Move to another monitor (Preserving Fullscreen)
const btnMove = document.getElementById('btn-move');
btnMove?.addEventListener('click', async () => {
    try {
        if (!window.getScreenDetails) {
            log('Window Management API not supported in this browser.');
            return;
        }

        // Prompts the user for multi-monitor permission on first run
        const screenDetails = await window.getScreenDetails();
        const currentScreen = screenDetails.currentScreen;
        const screens = screenDetails.screens;

        if (screens.length < 2) {
            log('Error: At least 2 monitors are required to test this feature.');
            return;
        }

        // Find a screen that isn't the one we are currently on
        // Using a property like availLeft or label is safer than object reference equality
        const targetScreen = screens.find((s: ScreenDetailed) => s.availLeft !== currentScreen.availLeft);

        if (targetScreen) {
            log(`Moving window to: ${targetScreen.label} (${targetScreen.availLeft}, ${targetScreen.availTop})`);

            if (document.fullscreenElement) {
                // THE FIX: Request fullscreen specifically on the target monitor to move it seamlessly
                await document.documentElement.requestFullscreen({ screen: targetScreen });
                log('Successfully transitioned fullscreen state to the secondary monitor.');
            } else {
                // Fallback for non-fullscreen state
                window.moveTo(targetScreen.availLeft, targetScreen.availTop);
                log('Moved standard window.');
            }
        }
    } catch (err) {
        log(`Move error: ${err instanceof Error ? err.message : String(err)}`);
    }
});