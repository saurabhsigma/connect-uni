
import CampusMap from '@/components/map/CampusMap';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Campus Heatmap | Campus Connect',
    description: 'Live crowd heatmap and verified places on campus.',
};

export default function MapPage() {
    return (
        <main className="min-h-screen pt-16">
            <CampusMap />
        </main>
    );
}
