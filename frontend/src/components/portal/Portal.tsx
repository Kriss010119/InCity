import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(id);
      setMounted(false);
    };
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};