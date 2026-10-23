import { useEffect } from 'react';
import { m, useMotionValue, useSpring } from 'motion/react';

const FOLLOW = { stiffness: 720, damping: 44, mass: .45 };
const MORPH = { stiffness: 440, damping: 32, mass: .65 };
const DOT = 18;
const NATIVE = 'input, textarea, select, [contenteditable="true"], [data-pointer-native], #vix-gauge, .plotwrap, [disabled], [aria-disabled="true"]';
const TARGET = 'button, a[href], summary';

/** Independent Motion implementation inspired by iPadOS pointer interactions.
 * Does not use or reproduce the members-only Motion+ Cursor source.
 */
export default function IOSPointer() {
  const targetX = useMotionValue(-40), targetY = useMotionValue(-40);
  const targetWidth = useMotionValue(DOT), targetHeight = useMotionValue(DOT), targetRadius = useMotionValue(DOT / 2);
  const targetScale = useMotionValue(1), visible = useMotionValue(0);
  const x = useSpring(targetX, FOLLOW), y = useSpring(targetY, FOLLOW);
  const width = useSpring(targetWidth, MORPH), height = useSpring(targetHeight, MORPH), borderRadius = useSpring(targetRadius, MORPH);
  const scale = useSpring(targetScale, MORPH);

  useEffect(() => {
    const root = document.documentElement;
    const mouse = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const contrast = matchMedia('(forced-colors: active)');
    let active = null, box = null, shown = false, pressed = false, frame = 0, mode = 'dot';
    let lastX = 0, lastY = 0;
    const allowed = () => mouse.matches && !reduced.matches && !contrast.matches;

    function release() {
      if (active) {
        delete active.dataset.iosMagnetic;
        delete active.dataset.iosPressed;
        active.style.removeProperty('--ios-pointer-dx');
        active.style.removeProperty('--ios-pointer-dy');
      }
      active = null; box = null;
    }
    function hide() {
      release(); shown = false; pressed = false;
      delete root.dataset.iosPointer;
      visible.set(0); targetScale.set(1);
    }
    function setMode(next) {
      if (mode !== next) { mode = next; root.dataset.iosPointerMode = next; }
    }
    function paint(event) {
      if (event.pointerType !== 'mouse' || !allowed() || document.hidden) return hide();
      lastX = event.clientX; lastY = event.clientY;
      const element = event.target instanceof Element ? event.target : null;
      if (!element || element.closest(NATIVE)) return hide();

      let next = element.closest(TARGET);
      let nextBox = null;
      if (next) {
        // Cache the untransformed hit box for each target. No layout reads on
        // pointer movement inside an already-snapped button.
        nextBox = next === active ? box : next.getBoundingClientRect();
        if (nextBox.width > 270 || nextBox.height > 72 || nextBox.width < 12 || nextBox.height < 12) next = null;
      }
      // Keep the magnetic target across its tiny visual scale / padded edge.
      if (!next && active?.isConnected && box && lastX >= box.left - 5 && lastX <= box.right + 5 && lastY >= box.top - 5 && lastY <= box.bottom + 5) {
        next = active; nextBox = box;
      }
      if (next !== active) {
        release();
        if (next) {
          active = next; box = nextBox;
          const radius = parseFloat(getComputedStyle(active).borderTopLeftRadius) || 0;
          targetWidth.set(box.width + 8); targetHeight.set(box.height + 6);
          targetRadius.set(Math.max(8, Math.min(18, radius + 3)));
          active.dataset.iosMagnetic = '';
        }
      }
      if (active && box) {
        setMode('magnetic');
        const dx = Math.max(-5, Math.min(5, (lastX - box.left - box.width / 2) * .12));
        const dy = Math.max(-3, Math.min(3, (lastY - box.top - box.height / 2) * .12));
        targetX.set(box.left - 4 + dx); targetY.set(box.top - 3 + dy);
        active.style.setProperty('--ios-pointer-dx', `${dx * .5}px`);
        active.style.setProperty('--ios-pointer-dy', `${dy * .5}px`);
      } else {
        setMode('dot');
        targetWidth.set(DOT); targetHeight.set(DOT); targetRadius.set(DOT / 2);
        targetX.set(lastX - DOT / 2); targetY.set(lastY - DOT / 2);
      }
      if (!shown) {
        // A fresh entry starts at the actual pointer, never flying in from
        // outside the window or the last native input.
        x.jump(lastX - DOT / 2); y.jump(lastY - DOT / 2);
        width.jump(DOT); height.jump(DOT); borderRadius.jump(DOT / 2);
        shown = true; root.dataset.iosPointer = 'on'; root.dataset.iosPointerMode = mode; visible.set(1);
        // jump() settles a spring at its argument; re-apply its desired target.
        x.set(targetX.get()); y.set(targetY.get());
        width.set(targetWidth.get()); height.set(targetHeight.get()); borderRadius.set(targetRadius.get());
      }
    }
    function down(event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return hide();
      paint(event);
      if (!shown) return;
      pressed = true; targetScale.set(.92);
      if (active) active.dataset.iosPressed = '';
    }
    function up(event) {
      if (!pressed) return;
      pressed = false; targetScale.set(1);
      if (active) delete active.dataset.iosPressed;
      paint(event);
    }
    function leave(event) { if (!event.relatedTarget) hide(); }
    function keyboard(event) { if (['Tab', 'Escape'].includes(event.key)) hide(); }
    function afterClick() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // React may have removed a chip, changed a page, or disabled a button.
        if (!shown) return;
        const target = document.elementFromPoint(lastX, lastY);
        paint({ pointerType: 'mouse', clientX: lastX, clientY: lastY, target });
      });
    }
    const options = { passive: true };
    document.addEventListener('pointermove', paint, options);
    document.addEventListener('pointerdown', down, options);
    document.addEventListener('pointerup', up, options);
    document.addEventListener('pointerout', leave, options);
    document.addEventListener('pointercancel', hide, options);
    document.addEventListener('click', afterClick, options);
    document.addEventListener('keydown', keyboard);
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('scroll', hide, { capture: true, passive: true });
    document.addEventListener('contextmenu', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide, options);
    for (const media of [mouse, reduced, contrast]) media.addEventListener('change', hide);
    return () => {
      hide(); cancelAnimationFrame(frame); delete root.dataset.iosPointerMode;
      document.removeEventListener('pointermove', paint);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('pointercancel', hide);
      document.removeEventListener('click', afterClick);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('contextmenu', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
      for (const media of [mouse, reduced, contrast]) media.removeEventListener('change', hide);
    };
  }, [targetX, targetY, targetWidth, targetHeight, targetRadius, targetScale, visible, x, y, width, height, borderRadius]);

  return <div className="ios-pointer-layer" aria-hidden="true"><m.div className="ios-pointer"
    style={{ x, y, width, height, borderRadius, scale, opacity: visible }} /></div>;
}
