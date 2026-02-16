import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
    const [socket, setSocket] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Strip /api from the URL to get the base server URL for Socket.IO
        const socketUrl = API_URL.replace(/\/api$/, '');
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });
        setSocket(newSocket);

        if (userId) {
            newSocket.emit('join', `user_${userId}`);
        }

        return () => newSocket.close();
    }, [userId, API_URL]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
