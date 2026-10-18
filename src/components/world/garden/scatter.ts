import { Color, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";

/** Deterministic PRNG so the garden is identical on every load. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export interface Instance {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  color?: string;
}

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3();
const c = new Color();

/** Writes instance transforms (and optional colours) once. */
export function applyInstances(mesh: InstancedMesh | null, items: readonly Instance[]) {
  if (!mesh) return;
  items.forEach((it, i) => {
    p.set(...it.position);
    q.setFromEuler(e.set(...(it.rotation ?? [0, 0, 0])));
    if (typeof it.scale === "number" || it.scale === undefined) s.setScalar(it.scale ?? 1);
    else s.set(...it.scale);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    if (it.color) mesh.setColorAt(i, c.set(it.color));
  });
  mesh.count = items.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** Point on a quadratic Bézier in the XZ plane. */
export function bezierXZ(a: [number, number], b: [number, number], cc: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * cc[0], u * u * a[1] + 2 * u * t * b[1] + t * t * cc[1]];
}
