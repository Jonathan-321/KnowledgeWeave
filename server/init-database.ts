import { db } from './db';
import { 
  users, 
  concepts,
  conceptConnections,
  documents,
  documentConcepts,
  learningProgress,
  insights
} from '@shared/schema';

/**
 * Initialize the database with sample data
 */
async function initializeDatabase() {
  console.log('Initializing database with sample data...');
  
  try {
    // Check if we already have data
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already contains data, skipping initialization');
      return;
    }

    // Create demo user
    const [user] = await db.insert(users).values({
      username: 'demo',
      password: 'password'
    }).returning();
    console.log('Created demo user');

    // Create some sample concepts
    const [neuralNetworksConcept] = await db.insert(concepts).values({
      name: 'Neural Networks',
      description: 'A computational model inspired by the structure and function of biological neural networks in the brain.',
      tags: ['Machine Learning', 'Deep Learning'],
      userId: user.id
    }).returning();

    const [backpropConcept] = await db.insert(concepts).values({
      name: 'Backpropagation',
      description: 'A method to calculate the gradient of the loss function with respect to the weights in a neural network.',
      tags: ['Machine Learning'],
      userId: user.id
    }).returning();

    const [graphTheoryConcept] = await db.insert(concepts).values({
      name: 'Graph Theory',
      description: 'A branch of mathematics concerned with networks of points connected by lines.',
      tags: ['Mathematics', 'Computer Science'],
      userId: user.id
    }).returning();
    console.log('Created sample concepts');

    // Create some connections between concepts
    await db.insert(conceptConnections).values([
      {
        sourceId: neuralNetworksConcept.id,
        targetId: backpropConcept.id,
        strength: 'strong',
        aiGenerated: false,
        userId: user.id
      },
      {
        sourceId: neuralNetworksConcept.id,
        targetId: graphTheoryConcept.id,
        strength: 'moderate',
        aiGenerated: true,
        userId: user.id
      }
    ]);
    console.log('Created concept connections');

    // Create some sample documents
    const [document1] = await db.insert(documents).values({
      title: 'Introduction to Neural Networks',
      type: 'pdf',
      content: 'Sample content about neural networks...',
      fileSize: 2457600, // 2.4 MB
      pageCount: 24,
      processed: true,
      uploadDate: new Date(),
      userId: user.id
    }).returning();

    const [document2] = await db.insert(documents).values({
      title: 'Fundamentals of Graph Algorithms',
      type: 'article',
      content: 'Sample content about graph algorithms...',
      fileSize: 1228800, // 1.2 MB
      pageCount: 8,
      processed: true,
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      userId: user.id
    }).returning();

    const [document3] = await db.insert(documents).values({
      title: 'CS601 Course Notes',
      type: 'note',
      content: 'Sample content from course notes...',
      fileSize: 3686400, // 3.6 MB
      pageCount: 32,
      processed: true,
      uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      userId: user.id
    }).returning();
    console.log('Created sample documents');

    // Create document-concept associations
    await db.insert(documentConcepts).values([
      {
        documentId: document1.id,
        conceptId: neuralNetworksConcept.id,
        pageReferences: '12-18, 24-26',
        userId: user.id
      },
      {
        documentId: document1.id,
        conceptId: backpropConcept.id,
        pageReferences: '15-18',
        userId: user.id
      },
      {
        documentId: document2.id,
        conceptId: graphTheoryConcept.id,
        pageReferences: '1-8',
        userId: user.id
      },
      {
        documentId: document3.id,
        conceptId: neuralNetworksConcept.id,
        pageReferences: '8-15',
        userId: user.id
      }
    ]);
    console.log('Created document-concept associations');

    // Create learning progress entries
    await db.insert(learningProgress).values([
      {
        conceptId: neuralNetworksConcept.id,
        comprehension: 75,
        practice: 50,
        lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        userId: user.id
      },
      {
        conceptId: graphTheoryConcept.id,
        comprehension: 42,
        practice: 30,
        lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (due for review)
        userId: user.id
      }
    ]);
    console.log('Created learning progress records');

    // Create insights
    await db.insert(insights).values([
      {
        content: 'Neural networks share fundamental principles with graph theory through the concept of node connectivity.',
        isHelpful: true,
        addedToGraph: false,
        relatedConceptIds: [neuralNetworksConcept.id, graphTheoryConcept.id],
        userId: user.id
      },
      {
        content: 'Consider exploring backpropagation algorithms to deepen your understanding of neural network training.',
        isHelpful: false,
        addedToGraph: false,
        relatedConceptIds: [neuralNetworksConcept.id, backpropConcept.id],
        userId: user.id
      }
    ]);
    console.log('Created insights');

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Export the function so it can be called from other files
export { initializeDatabase };

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}