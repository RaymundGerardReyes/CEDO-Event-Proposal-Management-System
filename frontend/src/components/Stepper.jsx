"use client";
import { usePathname } from 'next/navigation';

const steps = [
    { slug: 'overview', label: 'Overview' },
    { slug: 'organization', label: 'Organization' },
    { slug: 'school-event', label: 'School' },
    { slug: 'community-event', label: 'Community' },
    { slug: 'reporting', label: 'Reporting' }
];

export default function Stepper({ pathname: forced }) {
    const currentPathname = usePathname();
    const path = forced || currentPathname;
    const current = steps.findIndex(s => path?.includes(`/${s.slug}`));

    return (
        <nav aria-label="progress" className="mb-6 flex gap-4 text-sm font-medium">
            {steps.map((s, i) => (
                <div key={s.slug} className="flex items-center gap-1">
                    <span className={i === current ? 'text-blue-600' : 'text-gray-400'}>
                        {i + 1}.
                    </span>
                    <span className={i === current ? 'text-blue-600' : 'text-gray-600'}>{s.label}</span>
                    {i < steps.length - 1 && <span className="mx-2 text-gray-300">/</span>}
                </div>
            ))}
        </nav>
    );
} 