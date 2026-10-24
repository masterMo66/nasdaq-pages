import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { arc, m } from 'motion/react';
import { Star } from 'lucide-react';

const FLIGHT_ARC = arc({ strength: .22 });

export default function FavoriteFlight({ flight, onFinish }) {
  useEffect(() => {
    const cancel = () => onFinish(flight.id);
    window.addEventListener('scroll', cancel, { capture: true, passive: true });
    window.addEventListener('resize', cancel, { passive: true });
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('scroll', cancel, true);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [flight.id, onFinish]);
  return createPortal(<m.div className="favorite-flight" aria-hidden="true" data-fund-code={flight.code}
    style={{ left: flight.from.x - 16, top: flight.from.y - 16 }}
    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
    animate={{ x: flight.to.x - flight.from.x, y: flight.to.y - flight.from.y, scale: .4, opacity: 0 }}
    transition={{ duration: .58, path: FLIGHT_ARC, ease: [.22, 1, .36, 1], opacity: { delay: .4, duration: .18 } }}
    onAnimationComplete={() => onFinish(flight.id)}><Star size={18} fill="currentColor" /></m.div>, document.body);
}
