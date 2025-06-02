import { users } from '../data';

export const userRepo = {
    getAllUsers: () => {
        console.log('[userRepo] getAllUsers called');
        return users;
    },
    getUserById: (id: string) => {
        console.log(`[userRepo] getUserById(${id}) called`);
        return users.find((u) => u.id === id);
    },
};
