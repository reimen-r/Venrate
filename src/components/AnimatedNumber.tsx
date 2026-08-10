import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  className = '',
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 0.8,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    stiffness: 50,
    damping: 22,
    mass: 0.5,
  });

  const display = useTransform(spring, (v) => {
    const formatted = v.toLocaleString('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return prefix + formatted + suffix;
  });

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.32, 0.72, 0, 1],
    });
    return () => controls.stop();
  }, [value, mv, duration]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
