import { useRef } from 'react';
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

const CARD_SPRING = { stiffness: 240, damping: 23, mass: .8 };

export default function StatCard({ label, value, note, icon: Icon, featured = false, compact = false, variant = 'history' }) {
  const reduced = useReducedMotion();
  const bounds = useRef(null);
  const targetX = useMotionValue(0), targetY = useMotionValue(0), targetLift = useMotionValue(0);
  const lightX = useMotionValue(0), lightY = useMotionValue(0), lightAlpha = useMotionValue(0);
  const rotateX = useSpring(targetX, CARD_SPRING), rotateY = useSpring(targetY, CARD_SPRING), y = useSpring(targetLift, CARD_SPRING);
  const glowX = useSpring(lightX, CARD_SPRING), glowY = useSpring(lightY, CARD_SPRING), opacity = useSpring(lightAlpha, CARD_SPRING);
  function reset() {
    bounds.current = null;
    targetX.set(0); targetY.set(0); targetLift.set(0); lightAlpha.set(0);
  }
  function enter(event) {
    if (reduced || event.pointerType === 'touch' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // Read once, before the lift starts; pointer movement only updates Motion values.
    bounds.current = event.currentTarget.getBoundingClientRect();
    targetLift.set(variant === 'overview' ? -5 : -8); lightAlpha.set(1);
    move(event);
  }
  function move(event) {
    if (!bounds.current || reduced) return;
    const box = bounds.current;
    const x = Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5));
    targetX.set(-y * 10); targetY.set(x * 12);
    lightX.set(x * box.width * .7); lightY.set(y * box.height * .7);
  }
  return <div className="stat-card-shell" onPointerEnter={enter} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
    <m.article className={`stat-card stat-card-${variant} ${featured ? 'stat-card-featured' : ''}`} aria-label={label}
      style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY, y: reduced ? 0 : y }}>
      <m.span className="stat-card-light" aria-hidden="true" style={{ x: glowX, y: glowY, opacity: reduced ? 0 : opacity }} />
      <div className="stat-card-label">{Icon && <span className="stat-card-icon"><Icon size={15} aria-hidden="true" /></span>}<span>{label}</span></div>
      <div className={`stat-card-value ${compact ? 'stat-card-value-compact' : ''}`}>
        <AnimatePresence initial={false} mode="popLayout"><m.strong key={typeof value === 'string' ? value : 'value'}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : .22, ease: [.22, 1, .36, 1] }}>{value}</m.strong></AnimatePresence>
      </div>
      {note && <span className="stat-card-note">{note}</span>}
    </m.article>
  </div>;
}
