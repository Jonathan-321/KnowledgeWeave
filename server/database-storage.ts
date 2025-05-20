import { db } from "./db";
import {
  users, User, InsertUser,
  documents, Document, InsertDocument,
  concepts, Concept, InsertConcept,
  conceptConnections, ConceptConnection, InsertConceptConnection,
  documentConcepts, DocumentConcept, InsertDocumentConcept,
  learningProgress, LearningProgress, InsertLearningProgress,
  insights, Insight, InsertInsight
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return db.select().from(documents);
  }

  async createDocument(document: InsertDocument & { filePath?: string }): Promise<Document> {
    const { filePath, ...docData } = document;
    const [createdDoc] = await db.insert(documents).values(docData).returning();
    return createdDoc;
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    const [updatedDoc] = await db
      .update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();
    return updatedDoc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Concept methods
  async getConcept(id: number): Promise<Concept | undefined> {
    const [concept] = await db.select().from(concepts).where(eq(concepts.id, id));
    return concept;
  }

  async getConceptByName(name: string): Promise<Concept | undefined> {
    const [concept] = await db.select().from(concepts).where(eq(concepts.name, name));
    return concept;
  }

  async getAllConcepts(): Promise<Concept[]> {
    return db.select().from(concepts);
  }

  async createConcept(concept: InsertConcept): Promise<Concept> {
    const [createdConcept] = await db.insert(concepts).values(concept).returning();
    return createdConcept;
  }

  async updateConcept(id: number, data: Partial<Concept>): Promise<Concept> {
    const [updatedConcept] = await db
      .update(concepts)
      .set(data)
      .where(eq(concepts.id, id))
      .returning();
    return updatedConcept;
  }

  async deleteConcept(id: number): Promise<void> {
    await db.delete(concepts).where(eq(concepts.id, id));
  }

  // Concept connection methods
  async getConceptConnection(id: number): Promise<ConceptConnection | undefined> {
    const [connection] = await db
      .select()
      .from(conceptConnections)
      .where(eq(conceptConnections.id, id));
    return connection;
  }

  async getAllConceptConnections(): Promise<ConceptConnection[]> {
    return db.select().from(conceptConnections);
  }

  async createConceptConnection(connection: InsertConceptConnection): Promise<ConceptConnection> {
    const [createdConnection] = await db
      .insert(conceptConnections)
      .values(connection)
      .returning();
    return createdConnection;
  }

  async deleteConceptConnection(id: number): Promise<void> {
    await db.delete(conceptConnections).where(eq(conceptConnections.id, id));
  }

  // Document concept relations
  async getDocumentConcept(id: number): Promise<DocumentConcept | undefined> {
    const [docConcept] = await db
      .select()
      .from(documentConcepts)
      .where(eq(documentConcepts.id, id));
    return docConcept;
  }

  async getDocumentConceptsByConceptId(conceptId: number): Promise<DocumentConcept[]> {
    return db
      .select()
      .from(documentConcepts)
      .where(eq(documentConcepts.conceptId, conceptId));
  }

  async getDocumentConceptsByDocumentId(documentId: number): Promise<DocumentConcept[]> {
    return db
      .select()
      .from(documentConcepts)
      .where(eq(documentConcepts.documentId, documentId));
  }

  async getAllDocumentConcepts(): Promise<DocumentConcept[]> {
    return db.select().from(documentConcepts);
  }

  async createDocumentConcept(docConcept: InsertDocumentConcept): Promise<DocumentConcept> {
    const [createdDocConcept] = await db
      .insert(documentConcepts)
      .values(docConcept)
      .returning();
    return createdDocConcept;
  }

  async deleteDocumentConcept(id: number): Promise<void> {
    await db.delete(documentConcepts).where(eq(documentConcepts.id, id));
  }

  // Learning progress methods
  async getLearningProgress(id: number): Promise<LearningProgress | undefined> {
    const [progress] = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.id, id));
    return progress;
  }

  async getLearningProgressByConceptId(conceptId: number): Promise<LearningProgress | undefined> {
    const [progress] = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.conceptId, conceptId));
    return progress;
  }

  async getAllLearningProgress(): Promise<LearningProgress[]> {
    return db.select().from(learningProgress);
  }

  async createLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress> {
    const [createdProgress] = await db
      .insert(learningProgress)
      .values(progress)
      .returning();
    return createdProgress;
  }

  async updateLearningProgress(id: number, data: Partial<LearningProgress>): Promise<LearningProgress> {
    const [updatedProgress] = await db
      .update(learningProgress)
      .set(data)
      .where(eq(learningProgress.id, id))
      .returning();
    return updatedProgress;
  }

  // Insight methods
  async getInsight(id: number): Promise<Insight | undefined> {
    const [insight] = await db
      .select()
      .from(insights)
      .where(eq(insights.id, id));
    return insight;
  }

  async getAllInsights(): Promise<Insight[]> {
    return db.select().from(insights);
  }

  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [createdInsight] = await db
      .insert(insights)
      .values(insight)
      .returning();
    return createdInsight;
  }

  async updateInsight(id: number, data: Partial<Insight>): Promise<Insight> {
    const [updatedInsight] = await db
      .update(insights)
      .set(data)
      .where(eq(insights.id, id))
      .returning();
    return updatedInsight;
  }

  async deleteInsight(id: number): Promise<void> {
    await db.delete(insights).where(eq(insights.id, id));
  }
}