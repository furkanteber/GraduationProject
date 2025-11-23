"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const isLoggedIn = window.localStorage.getItem("isLoggedIn");
        if (isLoggedIn !== "true") {
            router.replace("/giris-yap");
        } else {
            setAllowed(true);
        }
    }, [router]);

    if (!allowed) {
        return null;
    }

    return <>{children}</>;
}
