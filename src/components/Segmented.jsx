import { useId } from 'react';
import { LayoutGroup, m } from 'motion/react';

export default function Segmented({ label, value, onChange, options, className = '', counts = {} }) {
  const id = useId();
  return <LayoutGroup id={id}><div className={`segmented ${className}`} role="group" aria-label={label}>
    {options.map(([key, name]) => <m.button whileTap={{ scale: .94 }} key={key} data-segment={key} type="button" aria-pressed={key === value} className={key === value ? 'selected' : ''} onClick={() => onChange(key)}>
      {key === value && <m.span className="segment-indicator" layoutId="indicator" transition={{ type: 'spring', stiffness: 380, damping: 30, mass: .8 }} />}
      <span>{name}{key in counts && <span className="segment-count" aria-hidden="true">{counts[key]}</span>}</span>
    </m.button>)}
  </div></LayoutGroup>;
}
