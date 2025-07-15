import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import { users } from '../schema';
import type { User, NewUser } from '../types';

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0];
}

export async function createUser(userData: NewUser): Promise<User> {
  const result = await db
    .insert(users)
    .values(userData)
    .returning();
  
  return result[0];
}

export async function updateUser(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
  const result = await db
    .update(users)
    .set({
      ...userData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  
  return result[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  
  return result.length > 0;
}

export async function getActiveUsers(): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.createdAt);
} 