import { User } from '../../src/service/user';

export const AUTH = {
  username: 'username',
  password: 'password',
  token: 'TOKEN',
}

const BASE_USER: User = {
  username: AUTH.username,
  id: 1,
  email: 'user@user.com',
  first_name: 'User',
  last_name: 'Test',
  expertise_level: 'Novice',
  is_staff: false,
  is_superuser: false,
}
export type UserType = 'annotator' | 'creator' | 'staff' | 'superuser';
export const USERS: { [key in UserType]: User } = {
  annotator: { ...BASE_USER, username: 'annotator', first_name: 'Annotator' },
  creator: { ...BASE_USER, id: 2, username: 'creator', first_name: 'Creator' },
  staff: { ...BASE_USER, id: 3, is_staff: true, username: 'staff', first_name: 'Staff' },
  superuser: { ...BASE_USER, id: 4, is_superuser: true, username: 'superuser', first_name: 'Superuser' },
}
