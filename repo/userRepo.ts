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
    batchGetUsersById: (ids: readonly string[]) => {
        console.log('[Batch] getUsersById', ids);
        const result = ids.map((id) => users.find((u) => u.id === id)!);
        return Promise.resolve(result);
    }
};
