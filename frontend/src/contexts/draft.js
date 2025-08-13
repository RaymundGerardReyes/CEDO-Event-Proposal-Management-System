"use client";
import { useContext } from 'react';
import { DraftContext } from '../context/draft-context';

export function useDraftContext() {
    const ctx = useContext(DraftContext);
    if (!ctx) throw new Error('useDraftContext must be used within <DraftContext.Provider>');
    return ctx;
} 