/* Motion law (§4). Two eases, everywhere. Nothing else.
   Vault doors move with a heavy in-out; arrivals settle expo-out.
   Zero springs, zero bounce, overshoot never > 0. */
window.CENT = window.CENT || {};

gsap.registerPlugin(MotionPathPlugin, CustomEase);

CENT.ease = {
  // vault door — cubic-bezier(0.7, 0, 0.2, 1)
  vault:  CustomEase.create('vault',  'M0,0 C0.7,0 0.2,1 1,1'),
  // arrival — expo-out cubic-bezier(0.16, 1, 0.3, 1)
  arrive: CustomEase.create('arrive', 'M0,0 C0.16,1 0.3,1 1,1'),
  // a hand's stroke: eases in, carries, settles at the join
  letter: CustomEase.create('letter', 'M0,0 C0.28,0 0.18,1 1,1'),
  // the y's exit: hesitates through the loop, then rushes off-frame (~3x)
  yexit:  CustomEase.create('yexit',  'M0,0 C0.42,0.06 0.6,1 1,1')
};
