import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Proxy-based localStorage Mock to support Object.keys(localStorage)
const createLocalStorageMock = () => {
    let store: Record<string, string> = {};

    const handler: ProxyHandler<any> = {
        get(target, prop) {
            if (prop === 'getItem') return (key: string) => store[key] || null;
            if (prop === 'setItem') return (key: string, value: string) => { store[key] = value.toString(); };
            if (prop === 'removeItem') return (key: string) => { delete store[key]; };
            if (prop === 'clear') return () => { store = {}; };
            if (prop === 'key') return (index: number) => Object.keys(store)[index] || null;
            if (prop === 'length') return Object.keys(store).length;
            if (typeof prop === 'string') return store[prop] || null;
            return undefined;
        },
        ownKeys(target) {
            return Object.keys(store);
        },
        getOwnPropertyDescriptor(target, prop) {
            if (typeof prop === 'string' && store[prop] !== undefined) {
                return {
                    enumerable: true,
                    configurable: true,
                    value: store[prop]
                };
            }
            return undefined;
        }
    };

    return new Proxy({}, handler);
};

Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
    configurable: true
});

// Mock import.meta.env
vi.stubGlobal('import.meta', {
    env: {
        DEV: false,
        PROD: true,
        MODE: 'test'
    }
});
