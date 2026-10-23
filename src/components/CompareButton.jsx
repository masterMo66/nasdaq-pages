import { AnimatePresence, arc, m, useReducedMotion } from 'motion/react';
import { Check, Plus } from 'lucide-react';

const ICON_ARC = arc({ strength: .6 });

export default function CompareButton({ fund, selected, onToggle }) {
  const reduced = useReducedMotion();
  const Icon = selected ? Check : Plus;
  return <m.button type="button" className={`compare ${selected ? 'on' : ''}`} whileTap={reduced ? undefined : { scale: .93 }}
    aria-pressed={selected} aria-label={`${selected ? '移除' : '对比'}${fund.name}`} onClick={() => onToggle(fund.code)}>
    <span className="compare-icon-slot" aria-hidden="true"><AnimatePresence initial={false} mode="popLayout">
      <m.span key={selected ? 'selected' : 'available'} className="compare-icon"
        initial={{ x: reduced ? 0 : -16, y: reduced ? 0 : 10, rotate: reduced ? 0 : -40, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        exit={{ x: reduced ? 0 : 20, y: reduced ? 0 : -14, rotate: reduced ? 0 : 45, opacity: 0 }}
        transition={{ duration: reduced ? 0 : .45, path: ICON_ARC, ease: [.22, 1, .36, 1], opacity: { duration: reduced ? 0 : .18 } }}>
        <Icon size={13} />
      </m.span>
    </AnimatePresence></span>
    <span>{selected ? '已加入' : '对比'}</span>
  </m.button>;
}
