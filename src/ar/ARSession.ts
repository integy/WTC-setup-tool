/**
 * Creates and manages an immersive-ar WebXR session using three.js.
 */

export interface ARSessionHandle {
  session: XRSession;
  end: () => Promise<void>;
}

interface ARSessionOptions {
  onSessionStarted?: (session: XRSession, gl: WebGL2RenderingContext) => void;
  onSessionEnded?: () => void;
  onError?: (error: Error) => void;
  onHitTest?: (position: { x: number; y: number; z: number }) => void;
}

export async function startARSession(
  canvas: HTMLCanvasElement,
  options: ARSessionOptions = {}
): Promise<ARSessionHandle> {
  if (!navigator.xr) {
    throw new Error('WebXR not supported on this device');
  }

  const supported = await navigator.xr.isSessionSupported('immersive-ar');
  if (!supported) {
    throw new Error('immersive-ar not supported');
  }

  const gl = canvas.getContext('webgl2', {
    xrCompatible: true,
    alpha: true,
  }) as WebGL2RenderingContext | null;

  if (!gl) {
    throw new Error('WebGL2 not available');
  }

  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test', 'local-floor'],
    optionalFeatures: ['plane-detection', 'dom-overlay'],
  });

  await gl.makeXRCompatible();

  session.addEventListener('end', () => {
    options.onSessionEnded?.();
  });

  session.addEventListener('select', (event) => {
    const frame = event.frame;
    const referenceSpace = (session as any)._referenceSpace as XRReferenceSpace;
    if (!referenceSpace) return;

    const viewerPose = frame.getViewerPose(referenceSpace);
    if (!viewerPose) return;

    // Cast through unknown to work around TS strictness with IntersectionObserver
    const hitResults = (frame as unknown as Record<string, unknown[]>).hitTestResults?.[0];
    if (hitResults) {
      // Use native hit test result
      const pose = (hitResults as any).getPose?.(referenceSpace);
      if (pose) {
        const pos = pose.transform.position;
        options.onHitTest?.({ x: pos.x, y: pos.y, z: pos.z });
      }
    }
  });

  (session as any)._referenceSpace = await session.requestReferenceSpace('local-floor');

  // Set up hit testing
  const viewerSpace = await session.requestReferenceSpace('viewer');
  const hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });

  const onFrame = (_time: number, frame: XRFrame) => {
    const refSpace = (session as any)._referenceSpace as XRReferenceSpace;
    const pose = frame.getViewerPose(refSpace);

    if (pose && options.onHitTest) {
      const hitResults = frame.getHitTestResults(hitTestSource!);
      if (hitResults.length > 0) {
        const hitPose = hitResults[0].getPose(refSpace);
        if (hitPose) {
          const pos = hitPose.transform.position;
          // Only call once on first detection
          if (!(session as any)._hitCalled) {
            (session as any)._hitCalled = true;
            options.onHitTest?.({ x: pos.x, y: pos.y, z: pos.z });
          }
        }
      }
    }

    session.requestAnimationFrame(onFrame);
  };

  session.requestAnimationFrame(onFrame);
  options.onSessionStarted?.(session, gl);

  return {
    session,
    end: () => session.end(),
  };
}

export function isARSupported(): boolean {
  return !!(window as any).navigator?.xr;
}
