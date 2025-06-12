import { users } from '../src/data';
import { User } from '../src/__generated__/types'


export const userRepo = {
    getAllUsers: () => {
        return users;
    },
    getUserById: (id: string): User => {

        const user = users.find((u) => u.id === id!)
        if (!user) throw new Error(`User with ID ${id} not found`);
        return {
            ...user,
            posts: []  // 還沒 resolve，後面再補            
        }
    },
    batchGetUsersById: (ids: readonly string[]) => {
        const result = ids.map((id) => users.find((u) => u.id === id)!);
        return Promise.resolve(result);
    }
};