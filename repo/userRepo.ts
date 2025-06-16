import { users } from '../src/data';
import { UserMapper as UserDB } from '../src/types'

export const userRepo = {
    getAllUsers: () => {
        return users;
    },
    getUserById: (id: string): UserDB => {
        const user = users.find((u) => u.id === id!)
        if (!user) throw new Error(`User with ID ${id} not found`);
        return {
            ...user,
        }
    },
    batchGetUsersById: (ids: readonly string[]): Promise<UserDB[]> => {
        const result = ids.map((id) => users.find((u) => u.id === id)!);
        return Promise.resolve(result);
    },
};