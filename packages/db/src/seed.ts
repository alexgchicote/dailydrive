import { db } from './index';
import { actionsCategories, actionsList, selectedActions } from './schema';

export async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Check if categories already exist
    const existingCategories = await db
      .select()
      .from(actionsCategories)
      .limit(1);

    if (existingCategories.length > 0) {
      console.log('✅ Database already has data. Skipping seed to preserve existing data.');
      return;
    }

    // Seed categories
    console.log('Creating sample categories...');
    const categories = await db
      .insert(actionsCategories)
      .values([
        {
          name: 'Health & Fitness',
          type: 'predefined',
        }
      ])
      .returning();

    console.log(`✅ Created ${categories.length} categories`);

    // Seed actions
    console.log('Creating sample actions...');
    const actions = await db
      .insert(actionsList)
      .values([
        // Health & Fitness
        {
          categoryId: categories[0].id,
          name: 'Exercise for 30 minutes',
          intent: 'engage',
          type: 'predefined',
        }
      ])
      .returning();

    console.log(`✅ Created ${actions.length} actions`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
} 