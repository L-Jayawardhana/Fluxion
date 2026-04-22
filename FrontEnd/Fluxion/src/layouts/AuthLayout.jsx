import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import RouteTransitionLoader from '../components/RouteTransitionLoader';
import SpeedLoader from '../components/SpeedLoader';

export default function AuthLayout() {
    return (
        <>
            <RouteTransitionLoader />
            <Suspense fallback={<SpeedLoader label="Loading authentication..." />}>
                <Outlet />
            </Suspense>
        </>
    );
}
