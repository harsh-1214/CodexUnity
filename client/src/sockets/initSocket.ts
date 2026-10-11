import { io } from 'socket.io-client';

const baseURL = import.meta.env.VITE_SOCKET_SERVER || "";

export const initSocket = () => {
    try {
        const options = {
            forceNew: true, 
            reconnectionAttempts: Infinity,
            timeout: 10000,
            transports: ['websocket'],
        };
        return io(baseURL, options);
    } catch (error: any) {
        throw new Error(error.message);
    }
};