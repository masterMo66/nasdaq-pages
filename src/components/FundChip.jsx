import { forwardRef } from 'react';
import { arc, m, useIsPresent, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

const CHIP_ARC = arc({ strength: .45 });

export default forwardRef(function FundChip({ fund, color, onRemove }, ref) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  return <m.button ref={ref} layout="position" className="chip" data-fund-code={fund.code}
    disabled={!present} aria-hidden={!present || undefined} tabIndex={present ? 0 : -1}
    aria-label={`移除${fund.name}对比`} onClick={() => onRemove(fund.code)}
    initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : .9, x: reduced ? 0 : -44, y: reduced ? 0 : -30 }}
    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    exit={{ opacity: 0, scale: reduced ? 1 : .82, x: reduced ? 0 : 64, y: reduced ? 0 : -42 }}
    transition={{ duration: reduced ? 0 : .6, path: CHIP_ARC, ease: [.22, 1, .36, 1], layout: { type: 'spring', stiffness: 430, damping: 30 }, opacity: { duration: reduced ? 0 : .22 } }}
    whileTap={reduced ? undefined : { scale: .94 }}>
    <span className="legend" style={{ background: color }} />{fund.manager}<span className="mono">{fund.code}</span><X size={12} aria-hidden="true" />
  </m.button>;
});
