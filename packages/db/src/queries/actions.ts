import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { actions, actionCompletions } from '../schema';
import type { Action, NewAction, ActionCompletion } from '../types';

export async function getActionById(id: string): Promise<Action | undefined> {
  const result = await db
    .select()
    .from(actions)
    .where(eq(actions.id, id))
    .limit(1);
  
  return result[0];
}

export async function getActionsByUserId(userId: string): Promise<Action[]> {
  return await db
    .select()
    .from(actions)
    .where(and(eq(actions.userId, userId), eq(actions.isActive, true)))
    .orderBy(actions.createdAt);
}

export async function createAction(actionData: NewAction): Promise<Action> {
  const result = await db
    .insert(actions)
    .values(actionData)
    .returning();
  
  return result[0];
}

export async function updateAction(id: string, actionData: Partial<NewAction>): Promise<Action | undefined> {
  const result = await db
    .update(actions)
    .set({
      ...actionData,
      updatedAt: new Date(),
    })
    .where(eq(actions.id, id))
    .returning();
  
  return result[0];
}

export async function deleteAction(id: string): Promise<boolean> {
  const result = await db
    .update(actions)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(actions.id, id))
    .returning();
  
  return result.length > 0;
}

export async function getActionsByCategory(userId: string, category: string): Promise<Action[]> {
  return await db
    .select()
    .from(actions)
    .where(and(
      eq(actions.userId, userId),
      eq(actions.category, category),
      eq(actions.isActive, true)
    ))
    .orderBy(actions.title);
}

export async function completeAction(userId: string, actionId: string, date: string, value: number = 1, notes?: string): Promise<ActionCompletion> {
  const result = await db
    .insert(actionCompletions)
    .values({
      userId,
      actionId,
      date,
      value,
      notes,
    })
    .returning();
  
  return result[0];
}

export async function getActionCompletionsForDate(userId: string, date: string): Promise<ActionCompletion[]> {
  return await db
    .select()
    .from(actionCompletions)
    .where(and(
      eq(actionCompletions.userId, userId),
      eq(actionCompletions.date, date)
    ))
    .orderBy(desc(actionCompletions.completedAt));
} 