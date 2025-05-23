/**
 * Resource Seeding Script
 * This script populates the database with initial learning resources for common concepts
 */

import { storage } from '../storage';
import { db } from '../db';
import { resources, conceptResources, ResourceType } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SeedResource {
  title: string;
  url: string;
  description: string;
  type: ResourceType;
  sourceAuthority: number;
  visualRichness: number;
  interactivity: number;
  qualityScore: number;
  imageUrl?: string;
  tags: string[];
}

// Map of concept names to their related resources
const resourcesByConceptName: Record<string, SeedResource[]> = {
  'Neural Networks': [
    {
      title: 'Neural Networks Explained',
      url: 'https://www.youtube.com/watch?v=aircAruvnKk',
      description: '3Blue1Brown explains neural networks in a visual, intuitive way, starting from the basics and building up to how deep neural networks learn through backpropagation.',
      type: 'video',
      sourceAuthority: 95,
      visualRichness: 95,
      interactivity: 10,
      qualityScore: 96,
      imageUrl: 'https://i.ytimg.com/vi/aircAruvnKk/maxresdefault.jpg',
      tags: ['neural networks', 'deep learning', 'backpropagation', 'visualization']
    },
    {
      title: 'TensorFlow Playground',
      url: 'https://playground.tensorflow.org/',
      description: 'Interactive visualization that lets you play with neural networks directly in your browser, helping to build intuition about how they work.',
      type: 'interactive',
      sourceAuthority: 98,
      visualRichness: 90,
      interactivity: 100,
      qualityScore: 95,
      imageUrl: 'https://1.bp.blogspot.com/-oNpZf6Ak2t8/VrdQUc0InJI/AAAAAAAARmA/hXkTwsmXhPk/s1600/playground-animation.gif',
      tags: ['neural networks', 'tensorflow', 'interactive', 'visualization']
    },
    {
      title: 'Neural Networks and Deep Learning',
      url: 'http://neuralnetworksanddeeplearning.com/',
      description: 'A free online book that helps you master the core concepts of neural networks, including modern techniques for deep learning.',
      type: 'article',
      sourceAuthority: 90,
      visualRichness: 70,
      interactivity: 30,
      qualityScore: 92,
      tags: ['neural networks', 'deep learning', 'tutorial', 'ebook']
    }
  ],
  'Backpropagation': [
    {
      title: 'Backpropagation calculus',
      url: 'https://www.youtube.com/watch?v=tIeHLnjs5U8',
      description: 'Step-by-step explanation of the mathematics behind backpropagation in neural networks.',
      type: 'video',
      sourceAuthority: 95,
      visualRichness: 90,
      interactivity: 10,
      qualityScore: 95,
      imageUrl: 'https://i.ytimg.com/vi/tIeHLnjs5U8/maxresdefault.jpg',
      tags: ['backpropagation', 'neural networks', 'calculus', 'mathematics']
    },
    {
      title: 'Visualizing Backpropagation',
      url: 'https://developers.google.com/machine-learning/crash-course/backprop-scroll',
      description: 'Interactive visualization of the backpropagation algorithm from Google\'s Machine Learning Crash Course.',
      type: 'interactive',
      sourceAuthority: 98,
      visualRichness: 85,
      interactivity: 90,
      qualityScore: 94,
      imageUrl: 'https://developers.google.com/static/machine-learning/crash-course/images/GradientDescentGif.gif',
      tags: ['backpropagation', 'visualization', 'interactive', 'google']
    }
  ],
  'Gradient Descent': [
    {
      title: 'Gradient Descent, Step-by-Step',
      url: 'https://www.youtube.com/watch?v=sDv4f4s2SB8',
      description: 'Detailed tutorial on how gradient descent works with visual explanations and examples.',
      type: 'video',
      sourceAuthority: 85,
      visualRichness: 80,
      interactivity: 10,
      qualityScore: 88,
      imageUrl: 'https://i.ytimg.com/vi/sDv4f4s2SB8/maxresdefault.jpg',
      tags: ['gradient descent', 'optimization', 'machine learning']
    },
    {
      title: 'Visualizing Gradient Descent',
      url: 'https://www.benfrederickson.com/numerical-optimization/',
      description: 'Interactive visualization of different gradient descent optimization algorithms.',
      type: 'interactive',
      sourceAuthority: 80,
      visualRichness: 90,
      interactivity: 95,
      qualityScore: 90,
      imageUrl: 'https://www.benfrederickson.com/images/gradient-descent-images/algorithms.png',
      tags: ['gradient descent', 'optimization', 'visualization', 'interactive']
    }
  ],
  'Machine Learning': [
    {
      title: 'Machine Learning Crash Course',
      url: 'https://developers.google.com/machine-learning/crash-course',
      description: 'Google\'s fast-paced, practical introduction to machine learning with interactive visualizations and exercises.',
      type: 'course',
      sourceAuthority: 98,
      visualRichness: 85,
      interactivity: 80,
      qualityScore: 95,
      imageUrl: 'https://developers.google.com/static/machine-learning/crash-course/images/ml-hierarchy.svg',
      tags: ['machine learning', 'google', 'course', 'tensorflow']
    },
    {
      title: 'Machine Learning for Beginners',
      url: 'https://www.youtube.com/watch?v=jGwO_UgTS7I',
      description: 'A beginner-friendly introduction to machine learning concepts with visual explanations.',
      type: 'video',
      sourceAuthority: 85,
      visualRichness: 75,
      interactivity: 10,
      qualityScore: 85,
      imageUrl: 'https://i.ytimg.com/vi/jGwO_UgTS7I/maxresdefault.jpg',
      tags: ['machine learning', 'beginners', 'introduction']
    },
    {
      title: 'Interactive Machine Learning Experiments',
      url: 'https://experiments.withgoogle.com/collection/ai',
      description: 'Collection of interactive experiments that demonstrate machine learning concepts in an engaging way.',
      type: 'interactive',
      sourceAuthority: 95,
      visualRichness: 95,
      interactivity: 100,
      qualityScore: 97,
      imageUrl: 'https://experiments.withgoogle.com/assets/img/collection-thumbnails/ai.jpg',
      tags: ['machine learning', 'interactive', 'experiments', 'google']
    }
  ],
  'Convolutional Neural Networks': [
    {
      title: 'CNN Explainer',
      url: 'https://poloclub.github.io/cnn-explainer/',
      description: 'Interactive visualization of a Convolutional Neural Network, helping you understand the transformations that occur in a CNN.',
      type: 'interactive',
      sourceAuthority: 90,
      visualRichness: 95,
      interactivity: 95,
      qualityScore: 96,
      imageUrl: 'https://poloclub.github.io/cnn-explainer/assets/figures/teaser.png',
      tags: ['cnn', 'visualization', 'interactive', 'deep learning']
    },
    {
      title: 'A Comprehensive Guide to CNNs',
      url: 'https://towardsdatascience.com/a-comprehensive-guide-to-convolutional-neural-networks-the-eli5-way-3bd2b1164a53',
      description: 'An in-depth article explaining CNNs in a way that\'s easy to understand, with visualizations and examples.',
      type: 'article',
      sourceAuthority: 85,
      visualRichness: 80,
      interactivity: 10,
      qualityScore: 88,
      imageUrl: 'https://miro.medium.com/max/2000/1*vkQ0hXDaQv57sALXAJquxA.jpeg',
      tags: ['cnn', 'convolutional neural networks', 'deep learning', 'computer vision']
    }
  ],
  'Deep Learning': [
    {
      title: 'Deep Learning with PyTorch',
      url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html',
      description: 'A practical introduction to deep learning using PyTorch, with code examples and tutorials.',
      type: 'tutorial',
      sourceAuthority: 95,
      visualRichness: 70,
      interactivity: 60,
      qualityScore: 90,
      imageUrl: 'https://pytorch.org/assets/images/pytorch-logo.png',
      tags: ['deep learning', 'pytorch', 'tutorial', 'code']
    },
    {
      title: 'Deep Learning for Computer Vision',
      url: 'http://cs231n.stanford.edu/',
      description: 'Stanford\'s course on deep learning for computer vision, with lecture videos, notes, and assignments.',
      type: 'course',
      sourceAuthority: 98,
      visualRichness: 80,
      interactivity: 50,
      qualityScore: 95,
      imageUrl: 'http://cs231n.stanford.edu/assets/nn1/neural_net2.jpeg',
      tags: ['deep learning', 'computer vision', 'stanford', 'course']
    },
    {
      title: 'Understanding Deep Learning',
      url: 'https://udlbook.github.io/udlbook/',
      description: 'A free online textbook that provides a comprehensive introduction to deep learning.',
      type: 'article',
      sourceAuthority: 90,
      visualRichness: 75,
      interactivity: 20,
      qualityScore: 92,
      tags: ['deep learning', 'textbook', 'comprehensive']
    }
  ],
  'Reinforcement Learning': [
    {
      title: 'Reinforcement Learning: An Introduction',
      url: 'http://incompleteideas.net/book/the-book-2nd.html',
      description: 'The classic textbook on reinforcement learning by Richard Sutton and Andrew Barto.',
      type: 'article',
      sourceAuthority: 98,
      visualRichness: 70,
      interactivity: 10,
      qualityScore: 95,
      tags: ['reinforcement learning', 'textbook', 'sutton', 'barto']
    },
    {
      title: 'RL Visualizations',
      url: 'https://distill.pub/2020/understanding-rl-vision/',
      description: 'Interactive visualization of what reinforcement learning agents "see" when making decisions.',
      type: 'interactive',
      sourceAuthority: 95,
      visualRichness: 90,
      interactivity: 85,
      qualityScore: 94,
      imageUrl: 'https://distill.pub/2020/understanding-rl-vision/thumbnail.jpg',
      tags: ['reinforcement learning', 'visualization', 'interactive']
    }
  ],
  'Quantum Computing': [
    {
      title: 'Quantum Computing for the Very Curious',
      url: 'https://quantum.country/qcvc',
      description: 'An interactive essay introducing quantum computing concepts using spaced repetition.',
      type: 'interactive',
      sourceAuthority: 90,
      visualRichness: 80,
      interactivity: 85,
      qualityScore: 92,
      tags: ['quantum computing', 'interactive', 'spaced repetition']
    },
    {
      title: 'IBM Quantum Experience',
      url: 'https://quantum-computing.ibm.com/',
      description: 'Hands-on platform for experimenting with real quantum computers and simulators.',
      type: 'interactive',
      sourceAuthority: 98,
      visualRichness: 85,
      interactivity: 95,
      qualityScore: 96,
      imageUrl: 'https://quantum-computing.ibm.com/images/ibm-q-logo.png',
      tags: ['quantum computing', 'ibm', 'interactive', 'quantum circuits']
    },
    {
      title: 'Quantum Computing Concepts',
      url: 'https://www.youtube.com/watch?v=JhHMJCUmq28',
      description: 'PBS Infinite Series explanation of quantum computing concepts in an accessible way.',
      type: 'video',
      sourceAuthority: 90,
      visualRichness: 80,
      interactivity: 10,
      qualityScore: 88,
      imageUrl: 'https://i.ytimg.com/vi/JhHMJCUmq28/maxresdefault.jpg',
      tags: ['quantum computing', 'explainer', 'basics']
    }
  ]
};

/**
 * Seeds the database with learning resources for common concepts
 */
async function seedResources() {
  try {
    console.log('Starting resource seeding...');
    
    // Get all concepts from the database
    const concepts = await storage.getAllConcepts();
    
    // Track how many resources were added
    let resourcesAdded = 0;
    let conceptsUpdated = 0;
    
    for (const concept of concepts) {
      // Find resources for this concept by name or similar names
      const conceptName = concept.name.toLowerCase();
      
      let resourcesForConcept: SeedResource[] = [];
      
      // Try to find an exact match first
      const exactMatch = Object.keys(resourcesByConceptName).find(
        name => name.toLowerCase() === conceptName
      );
      
      if (exactMatch) {
        resourcesForConcept = resourcesByConceptName[exactMatch];
      } else {
        // Try to find partial matches
        const partialMatches = Object.keys(resourcesByConceptName).filter(
          name => conceptName.includes(name.toLowerCase()) || 
                 name.toLowerCase().includes(conceptName)
        );
        
        if (partialMatches.length > 0) {
          // Use the first partial match
          resourcesForConcept = resourcesByConceptName[partialMatches[0]];
        }
      }
      
      // If we found matching resources, add them to the database
      if (resourcesForConcept.length > 0) {
        console.log(`Adding ${resourcesForConcept.length} resources for concept: ${concept.name}`);
        
        for (const resourceData of resourcesForConcept) {
          // Check if the resource already exists by URL
          const existingResources = await db
            .select()
            .from(resources)
            .where(eq(resources.url, resourceData.url));
          
          let resourceId: number;
          
          if (existingResources.length === 0) {
            // Create new resource
            const [createdResource] = await db
              .insert(resources)
              .values(resourceData)
              .returning();
            
            resourceId = createdResource.id;
            resourcesAdded++;
          } else {
            // Resource already exists
            resourceId = existingResources[0].id;
          }
          
          // Check if the concept-resource connection already exists
          const existingConnections = await db
            .select()
            .from(conceptResources)
            .where(eq(conceptResources.conceptId, concept.id))
            .where(eq(conceptResources.resourceId, resourceId));
          
          if (existingConnections.length === 0) {
            // Create connection between concept and resource
            await db
              .insert(conceptResources)
              .values({
                conceptId: concept.id,
                resourceId: resourceId,
                relevanceScore: 90, // High relevance score for seeded resources
                isRequired: false
              });
          }
        }
        
        conceptsUpdated++;
      }
    }
    
    console.log(`Resource seeding complete. Added ${resourcesAdded} new resources for ${conceptsUpdated} concepts.`);
  } catch (error) {
    console.error('Error seeding resources:', error);
  }
}

// Run the seeding function
seedResources().then(() => {
  console.log('Resource seeding script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Error running resource seeding script:', error);
  process.exit(1);
});
