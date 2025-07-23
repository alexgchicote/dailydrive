import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { 
  actionsList, 
  actionsCategories, 
  selectedActions, 
  dailyActionsLog
} from '../schema';
import type { 
  ActionsList,
  NewActionsList,
  ActionsCategory,
  NewActionsCategory,
  SelectedAction,
  NewSelectedAction
} from '../schema';

export async function getActionById(id: number): Promise<ActionsList | undefined> {
  const result = await db
    .select()
    .from(actionsList)
    .where(eq(actionsList.id, id))
    .limit(1);
  
  return result[0];
}

export async function getActionsByCategory(categoryId: number): Promise<ActionsList[]> {
  return await db
    .select()
    .from(actionsList)
    .where(eq(actionsList.categoryId, categoryId))
    .orderBy(actionsList.name);
}

export async function getActionsByIntent(intent: 'engage' | 'avoid'): Promise<ActionsList[]> {
  return await db
    .select()
    .from(actionsList)
    .where(eq(actionsList.intent, intent))
    .orderBy(actionsList.name);
}

export async function getActionsByType(type: 'predefined' | 'custom'): Promise<ActionsList[]> {
  return await db
    .select()
    .from(actionsList)
    .where(eq(actionsList.type, type))
    .orderBy(actionsList.name);
}

export async function getUserCustomActions(userId: string): Promise<ActionsList[]> {
  return await db
    .select()
    .from(actionsList)
    .where(and(
      eq(actionsList.type, 'custom'),
      eq(actionsList.createdById, userId)
    ))
    .orderBy(actionsList.name);
}

export async function createAction(action: NewActionsList): Promise<ActionsList> {
  const result = await db
    .insert(actionsList)
    .values(action)
    .returning();
  
  return result[0];
}

export async function updateAction(id: number, updates: Partial<NewActionsList>): Promise<ActionsList | undefined> {
  const result = await db
    .update(actionsList)
    .set(updates)
    .where(eq(actionsList.id, id))
    .returning();
  
  return result[0];
}

export async function deleteAction(id: number): Promise<void> {
  await db
    .delete(actionsList)
    .where(eq(actionsList.id, id));
}

// Categories queries
export async function getCategoryById(id: number): Promise<ActionsCategory | undefined> {
  const result = await db
    .select()
    .from(actionsCategories)
    .where(eq(actionsCategories.id, id))
    .limit(1);
  
  return result[0];
}

export async function getAllCategories(): Promise<ActionsCategory[]> {
  return await db
    .select()
    .from(actionsCategories)
    .orderBy(actionsCategories.name);
}

export async function createCategory(category: NewActionsCategory): Promise<ActionsCategory> {
  const result = await db
    .insert(actionsCategories)
    .values(category)
    .returning();
  
  return result[0];
}

export async function updateCategory(id: number, updates: Partial<NewActionsCategory>): Promise<ActionsCategory | undefined> {
  const result = await db
    .update(actionsCategories)
    .set(updates)
    .where(eq(actionsCategories.id, id))
    .returning();
  
  return result[0];
}

export async function deleteCategory(id: number): Promise<void> {
  await db
    .delete(actionsCategories)
    .where(eq(actionsCategories.id, id));
} 