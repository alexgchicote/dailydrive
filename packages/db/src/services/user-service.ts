import { validateUserExists } from '../queries/users';
import { getUserCustomActions } from '../queries/actions';
import type { ActionsList } from '../types';

export class UserService {
  // Note: User CRUD operations are handled by Supabase Auth
  // These methods are for database operations related to users

  static async validateUser(userId: string): Promise<boolean> {
    try {
      return await validateUserExists(userId);
    } catch (error) {
      console.error('Error validating user:', error);
      throw new Error('Failed to validate user');
    }
  }

  static async getUserCustomActions(userId: string): Promise<ActionsList[]> {
    try {
      // Validate user exists first
      const userExists = await validateUserExists(userId);
      if (!userExists) {
        throw new Error('User not found');
      }

      return await getUserCustomActions(userId);
    } catch (error) {
      console.error('Error getting user custom actions:', error);
      throw new Error('Failed to get user custom actions');
    }
  }

  static async getUserActionCount(userId: string): Promise<number> {
    try {
      const actions = await getUserCustomActions(userId);
      return actions.length;
    } catch (error) {
      console.error('Error getting user action count:', error);
      throw new Error('Failed to get user action count');
    }
  }

  // Helper method to check if user can perform action
  static async canUserAccessAction(userId: string, actionId: number): Promise<boolean> {
    try {
      const userActions = await getUserCustomActions(userId);
      return userActions.some(action => action.id === actionId);
    } catch (error) {
      console.error('Error checking user action access:', error);
      return false;
    }
  }
} 