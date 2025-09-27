/**
 * BackButton Component
 * A reusable back button component for navigation
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BackButton = ({
    onClick,
    children = 'Back',
    variant = 'ghost',
    size = 'default',
    className = '',
    ...props
}) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.back();
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={`flex items-center gap-2 ${className}`}
            {...props}
        >
            <ArrowLeft className="h-4 w-4" />
            {children}
        </Button>
    );
};

export default BackButton;

