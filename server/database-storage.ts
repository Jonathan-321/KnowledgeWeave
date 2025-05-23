import { db } from "./db";
import {
  users, User, InsertUser,
  documents, Document, InsertDocument,
  concepts, Concept, InsertConcept,
  conceptConnections, ConceptConnection, InsertConceptConnection,
  documentConcepts, DocumentConcept, InsertDocumentConcept,
  learningProgress, LearningProgress, InsertLearningProgress,
  insights, Insight, InsertInsight,
  resources, conceptResources, resourceInteractions, learningStyles,
  insertResourceSchema, insertConceptResourceSchema, insertResourceInteractionSchema, insertLearningStyleSchema
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

  // Resource methods
  async getResource(id: number): Promise<any | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourcesByUrl(url: string): Promise<any[]> {
    return db.select().from(resources).where(eq(resources.url, url));
  }

  async getAllResources(): Promise<any[]> {
    return db.select().from(resources);
  }

  async createResource(resource: typeof insertResourceSchema._type): Promise<any> {
    const [createdResource] = await db.insert(resources).values(resource).returning();
    return createdResource;
  }

  async updateResource(id: number, data: Partial<typeof resources.$inferSelect>): Promise<any> {
    const [updatedResource] = await db
      .update(resources)
      .set(data)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Concept Resource methods
  async getConceptResource(id: number): Promise<any | undefined> {
    const [conceptResource] = await db
      .select()
      .from(conceptResources)
      .where(eq(conceptResources.id, id));
    return conceptResource;
  }

  async getResourcesByConceptId(conceptId: number): Promise<any[]> {
    const relations = await db
      .select()
      .from(conceptResources)
      .where(eq(conceptResources.conceptId, conceptId));
    
    // Get the full resource objects
    const resourceIds = relations.map((rel: any) => rel.resourceId);
    if (resourceIds.length === 0) return [];
    
    // Fetch all resources in one query
    const resourcesList = await db
      .select()
      .from(resources)
      .where(resources.id.in(resourceIds));
    
    // Combine with relation data (relevance scores, etc.)
    return resourcesList.map((resource: any) => {
      const relation = relations.find((rel: any) => rel.resourceId === resource.id);
      return {
        ...resource,
        relevanceScore: relation?.relevanceScore,
        learningPathOrder: relation?.learningPathOrder,
        isRequired: relation?.isRequired
      };
    });
  }

  async getConceptsByResourceId(resourceId: number): Promise<any[]> {
    const relations = await db
      .select()
      .from(conceptResources)
      .where(eq(conceptResources.resourceId, resourceId));
    
    const conceptIds = relations.map((rel: any) => rel.conceptId);
    if (conceptIds.length === 0) return [];
    
    return db
      .select()
      .from(concepts)
      .where(concepts.id.in(conceptIds));
  }
  
  async getConceptResourcesByIds(conceptId: number, resourceId: number): Promise<any[]> {
    return db
      .select()
      .from(conceptResources)
      .where(eq(conceptResources.conceptId, conceptId))
      .where(eq(conceptResources.resourceId, resourceId));
  }

  async createConceptResource(conceptResource: typeof insertConceptResourceSchema._type): Promise<any> {
    const [createdConceptResource] = await db
      .insert(conceptResources)
      .values(conceptResource)
      .returning();
    return createdConceptResource;
  }

  async updateConceptResource(id: number, data: Partial<typeof conceptResources.$inferSelect>): Promise<any> {
    const [updatedConceptResource] = await db
      .update(conceptResources)
      .set(data)
      .where(eq(conceptResources.id, id))
      .returning();
    return updatedConceptResource;
  }

  async deleteConceptResource(id: number): Promise<void> {
    await db.delete(conceptResources).where(eq(conceptResources.id, id));
  }

  // Resource Interaction methods
  async getResourceInteraction(id: number): Promise<any | undefined> {
    const [interaction] = await db
      .select()
      .from(resourceInteractions)
      .where(eq(resourceInteractions.id, id));
    return interaction;
  }

  async getResourceInteractionsByUserId(userId: number): Promise<any[]> {
    return db
      .select()
      .from(resourceInteractions)
      .where(eq(resourceInteractions.userId, userId));
  }

  async getResourceInteractionsByResourceId(resourceId: number): Promise<any[]> {
    return db
      .select()
      .from(resourceInteractions)
      .where(eq(resourceInteractions.resourceId, resourceId));
  }

  async createResourceInteraction(interaction: typeof insertResourceInteractionSchema._type): Promise<any> {
    const [createdInteraction] = await db
      .insert(resourceInteractions)
      .values(interaction)
      .returning();
    return createdInteraction;
  }

  async updateResourceInteraction(id: number, data: Partial<typeof resourceInteractions.$inferSelect>): Promise<any> {
    const [updatedInteraction] = await db
      .update(resourceInteractions)
      .set(data)
      .where(eq(resourceInteractions.id, id))
      .returning();
    return updatedInteraction;
  }

  // Learning Style methods
  async getLearningStyle(id: number): Promise<any | undefined> {
    const [style] = await db
      .select()
      .from(learningStyles)
      .where(eq(learningStyles.id, id));
    return style;
  }

  async getLearningStyleByUserId(userId: number): Promise<any | undefined> {
    const [style] = await db
      .select()
      .from(learningStyles)
      .where(eq(learningStyles.userId, userId));
    return style;
  }

  async createLearningStyle(style: typeof insertLearningStyleSchema._type): Promise<any> {
    const [createdStyle] = await db
      .insert(learningStyles)
      .values(style)
      .returning();
    return createdStyle;
  }

  async updateLearningStyle(id: number, data: Partial<typeof learningStyles.$inferSelect>): Promise<any> {
    const [updatedStyle] = await db
      .update(learningStyles)
      .set(data)
      .where(eq(learningStyles.id, id))
      .returning();
    return updatedStyle;
  }
}