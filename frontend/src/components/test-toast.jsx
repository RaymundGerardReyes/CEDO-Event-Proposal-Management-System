"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TestToast() {
    const { toast } = useToast();

    const handleTestToast = () => {
        toast({
            title: "Test Toast",
            description: "Provider fix is working correctly!",
        });
    };

    return (
        <Button onClick={handleTestToast} variant="outline">
            Test Toast System
        </Button>
    );
} 