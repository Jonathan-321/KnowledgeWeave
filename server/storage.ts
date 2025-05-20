import { 
  users, 
  documents, 
  concepts, 
  conceptConnections, 
  documentConcepts, 
  learningProgress, 
  insights,
  type User, 
  type InsertUser, 
  type Document, 
  type InsertDocument, 
  type Concept, 
  type InsertConcept, 
  type ConceptConnection, 
  type InsertConceptConnection, 
  type DocumentConcept, 
  type InsertDocumentConcept, 
  type LearningProgress, 
  type InsertLearningProgress, 
  type Insight, 
  type InsertInsight 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument & { filePath?: string }): Promise<Document>;
  updateDocument(id: number, data: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Concept methods
  getConcept(id: number): Promise<Concept | undefined>;
  getConceptByName(name: string): Promise<Concept | undefined>;
  getAllConcepts(): Promise<Concept[]>;
  createConcept(concept: InsertConcept): Promise<Concept>;
  updateConcept(id: number, data: Partial<Concept>): Promise<Concept>;
  deleteConcept(id: number): Promise<void>;
  
  // Concept connection methods
  getConceptConnection(id: number): Promise<ConceptConnection | undefined>;
  getAllConceptConnections(): Promise<ConceptConnection[]>;
  createConceptConnection(connection: InsertConceptConnection): Promise<ConceptConnection>;
  deleteConceptConnection(id: number): Promise<void>;
  
  // Document concept relations
  getDocumentConcept(id: number): Promise<DocumentConcept | undefined>;
  getDocumentConceptsByConceptId(conceptId: number): Promise<DocumentConcept[]>;
  getDocumentConceptsByDocumentId(documentId: number): Promise<DocumentConcept[]>;
  getAllDocumentConcepts(): Promise<DocumentConcept[]>;
  createDocumentConcept(docConcept: InsertDocumentConcept): Promise<DocumentConcept>;
  deleteDocumentConcept(id: number): Promise<void>;
  
  // Learning progress methods
  getLearningProgress(id: number): Promise<LearningProgress | undefined>;
  getLearningProgressByConceptId(conceptId: number): Promise<LearningProgress | undefined>;
  getAllLearningProgress(): Promise<LearningProgress[]>;
  createLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress>;
  updateLearningProgress(id: number, data: Partial<LearningProgress>): Promise<LearningProgress>;
  
  // Insight methods
  getInsight(id: number): Promise<Insight | undefined>;
  getAllInsights(): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  updateInsight(id: number, data: Partial<Insight>): Promise<Insight>;
  deleteInsight(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private concepts: Map<number, Concept>;
  private conceptConnections: Map<number, ConceptConnection>;
  private documentConcepts: Map<number, DocumentConcept>;
  private learningProgressItems: Map<number, LearningProgress>;
  private insights: Map<number, Insight>;
  
  private userId: number;
  private documentId: number;
  private conceptId: number;
  private connectionId: number;
  private documentConceptId: number;
  private progressId: number;
  private insightId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.concepts = new Map();
    this.conceptConnections = new Map();
    this.documentConcepts = new Map();
    this.learningProgressItems = new Map();
    this.insights = new Map();
    
    this.userId = 1;
    this.documentId = 1;
    this.conceptId = 1;
    this.connectionId = 1;
    this.documentConceptId = 1;
    this.progressId = 1;
    this.insightId = 1;
    
    // Add some initial data for demo purposes
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Add a demo user
    const user: User = {
      id: this.userId++,
      username: "demo",
      password: "password"
    };
    this.users.set(user.id, user);
    
    // Add some sample concepts
    const neuralNetworksConcept: Concept = {
      id: this.conceptId++,
      name: "Neural Networks",
      description: "A computational model inspired by the structure and function of biological neural networks in the brain.",
      tags: ["Machine Learning", "Deep Learning"],
      userId: user.id,
    };
    this.concepts.set(neuralNetworksConcept.id, neuralNetworksConcept);
    
    const backpropConcept: Concept = {
      id: this.conceptId++,
      name: "Backpropagation",
      description: "A method to calculate the gradient of the loss function with respect to the weights in a neural network.",
      tags: ["Machine Learning"],
      userId: user.id,
    };
    this.concepts.set(backpropConcept.id, backpropConcept);
    
    const graphTheoryConcept: Concept = {
      id: this.conceptId++,
      name: "Graph Theory",
      description: "A branch of mathematics concerned with networks of points connected by lines.",
      tags: ["Mathematics", "Computer Science"],
      userId: user.id,
    };
    this.concepts.set(graphTheoryConcept.id, graphTheoryConcept);
    
    // Add some connections between concepts
    const connection1: ConceptConnection = {
      id: this.connectionId++,
      sourceId: neuralNetworksConcept.id,
      targetId: backpropConcept.id,
      strength: "strong",
      aiGenerated: false,
      userId: user.id,
    };
    this.conceptConnections.set(connection1.id, connection1);
    
    const connection2: ConceptConnection = {
      id: this.connectionId++,
      sourceId: neuralNetworksConcept.id,
      targetId: graphTheoryConcept.id,
      strength: "moderate",
      aiGenerated: true,
      userId: user.id,
    };
    this.conceptConnections.set(connection2.id, connection2);
    
    // Add sample documents
    const document1: Document = {
      id: this.documentId++,
      title: "Introduction to Neural Networks",
      type: "pdf",
      content: "Sample content about neural networks...",
      fileSize: 2457600, // 2.4 MB
      pageCount: 24,
      processed: true,
      uploadDate: new Date(),
      userId: user.id,
    };
    this.documents.set(document1.id, document1);
    
    const document2: Document = {
      id: this.documentId++,
      title: "Fundamentals of Graph Algorithms",
      type: "article",
      content: "Sample content about graph algorithms...",
      fileSize: 1228800, // 1.2 MB
      pageCount: 8,
      processed: true,
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      userId: user.id,
    };
    this.documents.set(document2.id, document2);
    
    const document3: Document = {
      id: this.documentId++,
      title: "CS601 Course Notes",
      type: "note",
      content: "Sample content from course notes...",
      fileSize: 3686400, // 3.6 MB
      pageCount: 32,
      processed: true,
      uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      userId: user.id,
    };
    this.documents.set(document3.id, document3);
    
    // Add document-concept relationships
    const docConcept1: DocumentConcept = {
      id: this.documentConceptId++,
      documentId: document1.id,
      conceptId: neuralNetworksConcept.id,
      pageReferences: "12-18, 24-26",
      userId: user.id,
    };
    this.documentConcepts.set(docConcept1.id, docConcept1);
    
    const docConcept2: DocumentConcept = {
      id: this.documentConceptId++,
      documentId: document1.id,
      conceptId: backpropConcept.id,
      pageReferences: "15-18",
      userId: user.id,
    };
    this.documentConcepts.set(docConcept2.id, docConcept2);
    
    const docConcept3: DocumentConcept = {
      id: this.documentConceptId++,
      documentId: document2.id,
      conceptId: graphTheoryConcept.id,
      pageReferences: "1-8",
      userId: user.id,
    };
    this.documentConcepts.set(docConcept3.id, docConcept3);
    
    const docConcept4: DocumentConcept = {
      id: this.documentConceptId++,
      documentId: document3.id,
      conceptId: neuralNetworksConcept.id,
      pageReferences: "8-15",
      userId: user.id,
    };
    this.documentConcepts.set(docConcept4.id, docConcept4);
    
    // Add learning progress
    const progress1: LearningProgress = {
      id: this.progressId++,
      conceptId: neuralNetworksConcept.id,
      comprehension: 75,
      practice: 50,
      lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      userId: user.id,
    };
    this.learningProgressItems.set(progress1.id, progress1);
    
    const progress2: LearningProgress = {
      id: this.progressId++,
      conceptId: graphTheoryConcept.id,
      comprehension: 42,
      practice: 30,
      lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (due for review)
      userId: user.id,
    };
    this.learningProgressItems.set(progress2.id, progress2);
    
    // Add insights
    const insight1: Insight = {
      id: this.insightId++,
      content: "Neural networks share fundamental principles with graph theory through the concept of node connectivity.",
      isHelpful: true,
      addedToGraph: false,
      relatedConceptIds: [neuralNetworksConcept.id, graphTheoryConcept.id],
      userId: user.id,
    };
    this.insights.set(insight1.id, insight1);
    
    const insight2: Insight = {
      id: this.insightId++,
      content: "Consider exploring backpropagation algorithms to deepen your understanding of neural network training.",
      isHelpful: false,
      addedToGraph: false,
      relatedConceptIds: [neuralNetworksConcept.id, backpropConcept.id],
      userId: user.id,
    };
    this.insights.set(insight2.id, insight2);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async createDocument(document: InsertDocument & { filePath?: string }): Promise<Document> {
    const id = this.documentId++;
    const newDocument: Document = { 
      ...document, 
      id, 
      uploadDate: new Date(),
      processed: false 
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    const updatedDocument = { ...document, ...data };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }
  
  // Concept methods
  async getConcept(id: number): Promise<Concept | undefined> {
    return this.concepts.get(id);
  }
  
  async getConceptByName(name: string): Promise<Concept | undefined> {
    return Array.from(this.concepts.values()).find(
      (concept) => concept.name === name
    );
  }
  
  async getAllConcepts(): Promise<Concept[]> {
    return Array.from(this.concepts.values());
  }
  
  async createConcept(concept: InsertConcept): Promise<Concept> {
    const id = this.conceptId++;
    const newConcept: Concept = { ...concept, id };
    this.concepts.set(id, newConcept);
    return newConcept;
  }
  
  async updateConcept(id: number, data: Partial<Concept>): Promise<Concept> {
    const concept = await this.getConcept(id);
    if (!concept) {
      throw new Error(`Concept with id ${id} not found`);
    }
    
    const updatedConcept = { ...concept, ...data };
    this.concepts.set(id, updatedConcept);
    return updatedConcept;
  }
  
  async deleteConcept(id: number): Promise<void> {
    this.concepts.delete(id);
  }
  
  // Concept connection methods
  async getConceptConnection(id: number): Promise<ConceptConnection | undefined> {
    return this.conceptConnections.get(id);
  }
  
  async getAllConceptConnections(): Promise<ConceptConnection[]> {
    return Array.from(this.conceptConnections.values());
  }
  
  async createConceptConnection(connection: InsertConceptConnection): Promise<ConceptConnection> {
    const id = this.connectionId++;
    const newConnection: ConceptConnection = { ...connection, id };
    this.conceptConnections.set(id, newConnection);
    return newConnection;
  }
  
  async deleteConceptConnection(id: number): Promise<void> {
    this.conceptConnections.delete(id);
  }
  
  // Document concept relations
  async getDocumentConcept(id: number): Promise<DocumentConcept | undefined> {
    return this.documentConcepts.get(id);
  }
  
  async getDocumentConceptsByConceptId(conceptId: number): Promise<DocumentConcept[]> {
    return Array.from(this.documentConcepts.values()).filter(
      (dc) => dc.conceptId === conceptId
    );
  }
  
  async getDocumentConceptsByDocumentId(documentId: number): Promise<DocumentConcept[]> {
    return Array.from(this.documentConcepts.values()).filter(
      (dc) => dc.documentId === documentId
    );
  }
  
  async getAllDocumentConcepts(): Promise<DocumentConcept[]> {
    return Array.from(this.documentConcepts.values());
  }
  
  async createDocumentConcept(docConcept: InsertDocumentConcept): Promise<DocumentConcept> {
    const id = this.documentConceptId++;
    const newDocConcept: DocumentConcept = { ...docConcept, id };
    this.documentConcepts.set(id, newDocConcept);
    return newDocConcept;
  }
  
  async deleteDocumentConcept(id: number): Promise<void> {
    this.documentConcepts.delete(id);
  }
  
  // Learning progress methods
  async getLearningProgress(id: number): Promise<LearningProgress | undefined> {
    return this.learningProgressItems.get(id);
  }
  
  async getLearningProgressByConceptId(conceptId: number): Promise<LearningProgress | undefined> {
    return Array.from(this.learningProgressItems.values()).find(
      (progress) => progress.conceptId === conceptId
    );
  }
  
  async getAllLearningProgress(): Promise<LearningProgress[]> {
    return Array.from(this.learningProgressItems.values());
  }
  
  async createLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress> {
    const id = this.progressId++;
    const newProgress: LearningProgress = { ...progress, id };
    this.learningProgressItems.set(id, newProgress);
    return newProgress;
  }
  
  async updateLearningProgress(id: number, data: Partial<LearningProgress>): Promise<LearningProgress> {
    const progress = await this.getLearningProgress(id);
    if (!progress) {
      throw new Error(`Learning progress with id ${id} not found`);
    }
    
    const updatedProgress = { ...progress, ...data };
    this.learningProgressItems.set(id, updatedProgress);
    return updatedProgress;
  }
  
  // Insight methods
  async getInsight(id: number): Promise<Insight | undefined> {
    return this.insights.get(id);
  }
  
  async getAllInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values());
  }
  
  async createInsight(insight: InsertInsight): Promise<Insight> {
    const id = this.insightId++;
    const newInsight: Insight = { 
      ...insight, 
      id,
      isHelpful: false,
      addedToGraph: false 
    };
    this.insights.set(id, newInsight);
    return newInsight;
  }
  
  async updateInsight(id: number, data: Partial<Insight>): Promise<Insight> {
    const insight = await this.getInsight(id);
    if (!insight) {
      throw new Error(`Insight with id ${id} not found`);
    }
    
    const updatedInsight = { ...insight, ...data };
    this.insights.set(id, updatedInsight);
    return updatedInsight;
  }
  
  async deleteInsight(id: number): Promise<void> {
    this.insights.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

// Now using the PostgreSQL database implementation
export const storage = new DatabaseStorage();
