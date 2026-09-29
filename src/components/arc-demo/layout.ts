/* How much of the stage's short side the device fills. The still shown
   while the model loads uses the same numbers, so the swap is seamless.
   (Kept apart from scene.ts, which pulls in three.js.) */
export const PHONE_MAX_WIDTH = 640;

export function deviceFill(stageWidth: number) {
  return stageWidth < PHONE_MAX_WIDTH ? 0.7 : 0.82;
}
