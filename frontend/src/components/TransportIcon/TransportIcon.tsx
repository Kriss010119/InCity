import { useEffect, useRef } from 'react';
import styles from './TransportIcon.module.css';

type Props = {
    type: 'car' | 'plane' | 'train';
}

export const TransportIcon = ({ type }: Props) => {
    const iconRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const icon = iconRef.current;
        if (!icon) {
            return;
        }

        if (type === 'car') {
            let borderFrame: HTMLElement | null = null;
            borderFrame = document.querySelector('.border-frame') as HTMLElement;
            
            if (!borderFrame) {
                const allDivs = document.querySelectorAll('div');
                allDivs.forEach(div => {
                    if (div.className && div.className.includes('border-frame')) {
                        borderFrame = div;
                    }
                });
            }
            
            if (!borderFrame) {
                console.warn('Border frame not found for car animation');
                return;
            }

            const updateCarPosition = () => {
                const borderRect = borderFrame!.getBoundingClientRect();
                const carSize = window.innerWidth <= 768 ? 36 : 70;
                const transportContainer = document.querySelector('.transport-container') as HTMLElement;
                let containerRect = { left: 0, top: 0 };
                
                if (transportContainer) {
                    containerRect = transportContainer.getBoundingClientRect();
                }
                const frameX = borderRect.left - containerRect.left;
                const frameY = borderRect.top - containerRect.top;
            
                icon!.style.setProperty('--border-width', `${borderRect.width}px`);
                icon!.style.setProperty('--border-height', `${borderRect.height}px`);
                icon!.style.setProperty('--car-size', `${carSize}px`);
                icon!.style.setProperty('--frame-x', `${frameX}px`);
                icon!.style.setProperty('--frame-y', `${frameY}px`);
                icon!.style.left = `${frameX}px`;
                icon!.style.top = `${frameY}px`;
                icon!.style.width = `${carSize}px`;
                icon!.style.height = `${carSize}px`;
            };

            const initTimeout = setTimeout(updateCarPosition, 100);
            window.addEventListener('resize', updateCarPosition);

            return () => {
                clearTimeout(initTimeout);
                window.removeEventListener('resize', updateCarPosition);
            };
        }

        return () => {
            if (icon) {
                icon.style.animationDelay = '0s';
            }
        };
    }, [type]);

    return (
        <div
            ref={iconRef}
            className={`${styles['transport-icon']} ${styles[`transport-icon-${type}`]}`}
            style={{
                backgroundImage: `url(/icons/${type}.svg)`,
            }}
            aria-hidden="true"
        />
    );
};