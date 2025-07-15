import { getUserById, getUserByEmail, createUser, updateUser, deleteUser } from '../queries/users';
import { getActionsByUserId } from '../queries/actions';
import type { User, NewUser, Action } from '../types';

export class UserService {
  static async findById(id: string): Promise<User | null> {
    try {
      const user = await getUserById(id);
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await getUserByEmail(email);
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  static async create(userData: NewUser): Promise<User> {
    try {
      // Validate that email doesn't already exist
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      return await createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async update(id: string, userData: Partial<NewUser>): Promise<User> {
    try {
      const user = await updateUser(id, userData);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      return await deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  static async getUserWithActions(userId: string): Promise<{ user: User; actions: Action[] } | null> {
    try {
      const user = await getUserById(userId);
      if (!user) {
        return null;
      }

      const actions = await getActionsByUserId(userId);
      return { user, actions };
    } catch (error) {
      console.error('Error getting user with actions:', error);
      throw new Error('Failed to get user with actions');
    }
  }
} 