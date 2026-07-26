import * as THREE from 'three';

/**
 * Manages a three.js scene for AR terrain layout projection.
 * Renders a semi-transparent board plane with the terrain layout texture.
 */

export class ARSceneRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  private boardAnchor: THREE.Group | null = null;
  private currentTexture: THREE.Texture | null = null;
  private textureLoader = new THREE.TextureLoader();

  // Board dimensions in meters (60" × 44" = 1.524m × 1.1176m)
  static BOARD_WIDTH = 1.524;
  static BOARD_DEPTH = 1.1176;

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      70,
      canvas.width / canvas.height,
      0.01,
      20
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.xr.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Ambient + directional light for the virtual board
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(0, 2, 1);
    this.scene.add(dirLight);
  }

  createBoard(layoutImagePath: string, position: { x: number; y: number; z: number }, onLoaded?: () => void) {
    // Remove existing board
    if (this.boardAnchor) {
      this.scene.remove(this.boardAnchor);
      this.boardAnchor = null;
    }

    if (this.currentTexture) {
      this.currentTexture.dispose();
    }

    const anchor = new THREE.Group();
    anchor.position.set(position.x, position.y, position.z);

    // Load the terrain layout texture
    this.textureLoader.load(
      layoutImagePath,
      (texture) => {
        this.currentTexture = texture;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Board: semi-transparent plane
        const boardGeo = new THREE.PlaneGeometry(
          ARSceneRenderer.BOARD_WIDTH,
          ARSceneRenderer.BOARD_DEPTH
        );
        const boardMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.rotation.x = -Math.PI / 2; // Lay flat
        board.position.y = 0.001; // Slightly above anchor to avoid z-fighting
        anchor.add(board);

        // Board outline
        const outlineGeo = new THREE.EdgesGeometry(boardGeo);
        const outlineMat = new THREE.LineBasicMaterial({ color: 0xffde00 });
        const outline = new THREE.LineSegments(outlineGeo, outlineMat);
        outline.rotation.x = -Math.PI / 2;
        outline.position.y = 0.002;
        anchor.add(outline);

        void board;
        onLoaded?.();
      },
      undefined,
      (err) => {
        console.error('Failed to load terrain texture:', err);
      }
    );

    this.boardAnchor = anchor;
    this.scene.add(anchor);
  }

  removeBoard() {
    if (this.boardAnchor) {
      this.scene.remove(this.boardAnchor);
      this.boardAnchor = null;

    }
    if (this.currentTexture) {
      this.currentTexture.dispose();
      this.currentTexture = null;
    }
  }

  render(frame: XRFrame, referenceSpace: XRReferenceSpace) {
    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      const view = pose.views[0];
      if (view) {
        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        this.camera.matrix.fromArray(view.transform.matrix);
        this.camera.matrixAutoUpdate = false;
        this.camera.matrixWorldNeedsUpdate = true;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
