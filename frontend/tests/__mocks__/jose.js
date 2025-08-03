// Mock for jose library
const mockJose = {
    jwtVerify: jest.fn(),
    SignJWT: jest.fn(),
    compactDecrypt: jest.fn(),
    compactEncrypt: jest.fn(),
    compactSign: jest.fn(),
    compactVerify: jest.fn(),
    decodeJwt: jest.fn(),
    decodeProtectedHeader: jest.fn(),
    exportJWK: jest.fn(),
    exportPKCS8: jest.fn(),
    exportSPKI: jest.fn(),
    generateKeyPair: jest.fn(),
    generateSecret: jest.fn(),
    importJWK: jest.fn(),
    importPKCS8: jest.fn(),
    importSPKI: jest.fn(),
    jwtDecrypt: jest.fn(),
    jwtEncrypt: jest.fn(),
    jwtSign: jest.fn(),
    jwtVerify: jest.fn(),
    keyObjectFromJWK: jest.fn(),
    keyObjectToJWK: jest.fn(),
    keyObjectToPEM: jest.fn(),
    keyObjectToPKCS8: jest.fn(),
    keyObjectToSPKI: jest.fn(),
    pemToKeyObject: jest.fn(),
    pkcs8ToKeyObject: jest.fn(),
    spkiToKeyObject: jest.fn(),
    UnsecuredJWT: jest.fn(),
    createRemoteJWKSet: jest.fn(),
    createLocalJWKSet: jest.fn(),
    jwtDecrypt: jest.fn(),
    jwtEncrypt: jest.fn(),
    jwtSign: jest.fn(),
    jwtVerify: jest.fn(),
    JWT: {
        verify: jest.fn(),
        sign: jest.fn(),
        decode: jest.fn(),
    },
    JWE: {
        decrypt: jest.fn(),
        encrypt: jest.fn(),
    },
    JWS: {
        verify: jest.fn(),
        sign: jest.fn(),
    },
};

// Default implementation for jwtVerify
mockJose.jwtVerify.mockImplementation(async (token, key) => {
    if (token === 'valid-token-student') {
        return {
            payload: {
                user: {
                    id: 'student1',
                    role: 'student',
                    dashboard: '/student-dashboard'
                }
            }
        };
    }
    if (token === 'valid-token-admin') {
        return {
            payload: {
                user: {
                    id: 'admin1',
                    role: 'head_admin',
                    dashboard: '/admin-dashboard'
                }
            }
        };
    }
    if (token === 'valid-token-partner') {
        return {
            payload: {
                user: {
                    id: 'partner1',
                    role: 'partner'
                }
            }
        };
    }
    if (token === 'valid-token-unknown') {
        return {
            payload: {
                user: {
                    id: 'userX',
                    role: 'unknown_role'
                }
            }
        };
    }
    throw new Error('Invalid token mock');
});

// Default implementation for SignJWT
mockJose.SignJWT.mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setJti: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
}));

export default mockJose;
export const { jwtVerify, SignJWT } = mockJose; 