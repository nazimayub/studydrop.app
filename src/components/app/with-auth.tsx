"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/firebase";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
    const AuthComponent = (props: P) => {
        // useAuthState must have a valid auth object
        const [user, loading, error] = auth ? useAuthState(auth) : [null, true, null];
        const router = useRouter();
        const pathname = usePathname();

        useEffect(() => {
            if (!loading && !user) {
                router.push(`/login?redirect=${pathname}`);
            }
        }, [user, loading, router, pathname]);

        if (loading || !user) {
            return (
                 <div className="flex flex-col space-y-3 p-4">
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            );
        }
        
        if (error) {
            // This can happen if Firebase fails to initialize, e.g. network error
            return <div>Error: {error.message}</div>
        }

        return <Component {...props} />;
    };

    AuthComponent.displayName = `withAuth(${(Component as any).displayName || Component.name || 'Component'})`;
    
    // This wrapper is necessary to use useSearchParams on pages wrapped with withAuth
    const WithSearchParams = (props: P) => (
      <Suspense fallback={
        <div className="flex flex-col space-y-3 p-4">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      }>
        <AuthComponent {...props} />
      </Suspense>
    );
    WithSearchParams.displayName = "WithSearchParams";
    return WithSearchParams;
};
