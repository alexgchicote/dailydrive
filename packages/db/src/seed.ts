import { db } from './index';
import { users, actions } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if sample data already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'user@example.com'))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('📦 Sample data already exists. Skipping seed...');
      return;
    }

    // Create sample users only if they don't exist
    console.log('👥 Creating sample users...');
    const sampleUsers = await db.insert(users).values([
      {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      },
    ]).returning();

    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // Create sample actions
    console.log('🎯 Creating sample actions...');
    const sampleActions = await db.insert(actions).values([
      {
        userId: sampleUsers[0].id,
        title: 'Morning Exercise',
        description: 'Start the day with 30 minutes of exercise',
        category: 'Health',
        color: '#10B981',
        icon: '🏃‍♂️',
        targetFrequency: 1,
      },
      {
        userId: sampleUsers[0].id,
        title: 'Read for 30 minutes',
        description: 'Read books or articles for personal development',
        category: 'Learning',
        color: '#3B82F6',
        icon: '📚',
        targetFrequency: 1,
      },
      {
        userId: sampleUsers[1].id,
        title: 'Drink 8 glasses of water',
        description: 'Stay hydrated throughout the day',
        category: 'Health',
        color: '#06B6D4',
        icon: '💧',
        targetFrequency: 8,
      },
    ]).returning();

    console.log(`✅ Created ${sampleActions.length} sample actions`);
    console.log('🎉 Database seeded successfully!');
    
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

export { seed }; 