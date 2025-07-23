import {
    getActionById,
    getActionsByCategory,
    getActionsByIntent,
    getActionsByType,
    getUserCustomActions,
    createAction,
    updateAction,
    deleteAction,
    getCategoryById,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../queries/actions';
import {
    CreateActionsListSchema,
    UpdateActionsListSchema,
    CreateActionsCategorySchema,
    UpdateActionsCategorySchema
} from '../types/validation';
import type {
    ActionsList,
    NewActionsList,
    ActionsCategory,
    NewActionsCategory
} from '../types';

export class ActionService {
    static async findById(id: number): Promise<ActionsList | null> {
        try {
            const action = await getActionById(id);
            return action || null;
        } catch (error) {
            console.error('Error finding action by ID:', error);
            throw new Error('Failed to find action');
        }
    }

    static async findByCategory(categoryId: number): Promise<ActionsList[]> {
        try {
            return await getActionsByCategory(categoryId);
        } catch (error) {
            console.error('Error finding actions by category:', error);
            throw new Error('Failed to find actions');
        }
    }

    static async findByIntent(intent: 'engage' | 'avoid'): Promise<ActionsList[]> {
        try {
            return await getActionsByIntent(intent);
        } catch (error) {
            console.error('Error finding actions by intent:', error);
            throw new Error('Failed to find actions');
        }
    }

    static async findByType(actionType: 'predefined' | 'custom'): Promise<ActionsList[]> {
        try {
            return await getActionsByType(actionType);
        } catch (error) {
            console.error('Error finding actions by type:', error);
            throw new Error('Failed to find actions');
        }
    }

    static async findUserCustomActions(userId: string): Promise<ActionsList[]> {
        try {
            return await getUserCustomActions(userId);
        } catch (error) {
            console.error('Error finding user custom actions:', error);
            throw new Error('Failed to find user custom actions');
        }
    }

    // Example of Zod validation in action
    static async createSafe(actionData: unknown): Promise<ActionsList> {
        try {
            // Validate input data with Zod
            const validatedData = CreateActionsListSchema.parse(actionData);

            // TypeScript now knows validatedData is properly typed
            return await createAction(validatedData);
        } catch (error) {
            if (error instanceof Error && error.name === 'ZodError') {
                // Handle validation errors
                throw new Error(`Validation failed: ${error.message}`);
            }
            console.error('Error creating action:', error);
            throw new Error('Failed to create action');
        }
    }

    static async create(actionData: NewActionsList): Promise<ActionsList> {
        try {
            return await createAction(actionData);
        } catch (error) {
            console.error('Error creating action:', error);
            throw new Error('Failed to create action');
        }
    }

    static async updateSafe(id: number, actionData: unknown): Promise<ActionsList | null> {
        try {
            // Validate input data with Zod
            const validatedData = UpdateActionsListSchema.parse(actionData);

            const action = await updateAction(id, validatedData);
            return action || null;
        } catch (error) {
            if (error instanceof Error && error.name === 'ZodError') {
                throw new Error(`Validation failed: ${error.message}`);
            }
            console.error('Error updating action:', error);
            throw new Error('Failed to update action');
        }
    }

    static async update(id: number, actionData: Partial<NewActionsList>): Promise<ActionsList | null> {
        try {
            const action = await updateAction(id, actionData);
            return action || null;
        } catch (error) {
            console.error('Error updating action:', error);
            throw new Error('Failed to update action');
        }
    }

    static async delete(id: number): Promise<boolean> {
        try {
            await deleteAction(id);
            return true;
        } catch (error) {
            console.error('Error deleting action:', error);
            throw new Error('Failed to delete action');
        }
    }

    // Category methods
    static async findCategoryById(id: number): Promise<ActionsCategory | null> {
        try {
            const category = await getCategoryById(id);
            return category || null;
        } catch (error) {
            console.error('Error finding category by ID:', error);
            throw new Error('Failed to find category');
        }
    }

    static async findAllCategories(): Promise<ActionsCategory[]> {
        try {
            return await getAllCategories();
        } catch (error) {
            console.error('Error finding all categories:', error);
            throw new Error('Failed to find categories');
        }
    }

    static async createCategorySafe(categoryData: unknown): Promise<ActionsCategory> {
        try {
            const validatedData = CreateActionsCategorySchema.parse(categoryData);
            return await createCategory(validatedData);
        } catch (error) {
            if (error instanceof Error && error.name === 'ZodError') {
                throw new Error(`Validation failed: ${error.message}`);
            }
            console.error('Error creating category:', error);
            throw new Error('Failed to create category');
        }
    }

    static async createCategory(categoryData: NewActionsCategory): Promise<ActionsCategory> {
        try {
            return await createCategory(categoryData);
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Failed to create category');
        }
    }

    static async updateCategory(id: number, categoryData: Partial<NewActionsCategory>): Promise<ActionsCategory | null> {
        try {
            const category = await updateCategory(id, categoryData);
            return category || null;
        } catch (error) {
            console.error('Error updating category:', error);
            throw new Error('Failed to update category');
        }
    }

    static async deleteCategory(id: number): Promise<boolean> {
        try {
            await deleteCategory(id);
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw new Error('Failed to delete category');
        }
    }
} 