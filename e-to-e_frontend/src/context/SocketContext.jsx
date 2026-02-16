import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
    const [socket, setSocket] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const newSocket = io(API_URL);
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
