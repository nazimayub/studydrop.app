
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";

export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
    const AuthComponent = (props: P) => {
        const [user, loading, error] = useAuthState(auth);
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
            )
        }
        
        if (error) {
            return <div>Error: {error.message}</div>
        }

        return <Component {...props} />;
    };

    AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
    return AuthComponent;
};
