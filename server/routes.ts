import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processDocument } from "./services/documentProcessor";
import { generateInsights, extractConcepts, generateQuizQuestions } from "./services/anthropic";
import { getRecommendedConcepts } from "./services/vectordb";
import {
  insertDocumentSchema,
  insertConceptSchema,
  insertConceptConnectionSchema,
  insertLearningProgressSchema,
  insertInsightSchema,
} from "@shared/schema";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(import.meta.dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, text, Markdown, and Word documents are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Documents API
  app.post("/api/documents", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const parsedData = insertDocumentSchema.safeParse({
        title: req.body.title || req.file.originalname,
        type: req.body.type || path.extname(req.file.originalname).substring(1),
        content: "", // Will be filled by document processor
        fileSize: req.file.size,
        pageCount: 0, // Will be updated after processing
        userId: 1, // Default user for now
      });

      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: parsedData.error.errors 
        });
      }

      const document = await storage.createDocument({
        ...parsedData.data,
        filePath: req.file.path,
      });

      // Process document asynchronously
      processDocument(document, req.file.path)
        .then(async (processedDoc) => {
          await storage.updateDocument(document.id, {
            content: processedDoc.content,
            pageCount: processedDoc.pageCount,
            processed: true,
          });

          // Extract concepts and create connections
          const concepts = await extractConcepts(processedDoc.content);
          for (const concept of concepts) {
            if (concept.name) {
              const existingConcept = await storage.getConceptByName(concept.name);
              if (!existingConcept) {
                await storage.createConcept({
                  name: concept.name,
                  description: concept.description || 'No description available',
                  tags: concept.tags || [],
                  userId: concept.userId || 1
                });
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error processing document:", error);
        });

      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error uploading document", error: error.message });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching documents", error: error.message });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching document", error: error.message });
    }
  });

  // Concepts API
  app.get("/api/concepts", async (req, res) => {
    try {
      const concepts = await storage.getAllConcepts();
      res.json(concepts);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching concepts", error: error.message });
    }
  });

  app.get("/api/concepts/:id", async (req, res) => {
    try {
      const concept = await storage.getConcept(parseInt(req.params.id));
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      res.json(concept);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching concept", error: error.message });
    }
  });

  app.post("/api/concepts", async (req, res) => {
    try {
      const parsedData = insertConceptSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid concept data", 
          errors: parsedData.error.errors 
        });
      }

      const concept = await storage.createConcept(parsedData.data);
      res.status(201).json(concept);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating concept", error: error.message });
    }
  });

  // Concept connections API
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getAllConceptConnections();
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching connections", error: error.message });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const parsedData = insertConceptConnectionSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid connection data", 
          errors: parsedData.error.errors 
        });
      }

      const connection = await storage.createConceptConnection(parsedData.data);
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating connection", error: error.message });
    }
  });

  // Knowledge Graph API
  app.get("/api/graph", async (req, res) => {
    try {
      const concepts = await storage.getAllConcepts();
      const documents = await storage.getAllDocuments();
      const connections = await storage.getAllConceptConnections();
      const documentConcepts = await storage.getAllDocumentConcepts();

      // Construct knowledge graph
      const nodes = [
        ...concepts.map(concept => ({
          id: concept.id,
          label: concept.name,
          type: 'concept' as const,
          description: concept.description,
        })),
        ...documents.filter(doc => doc.processed).map(document => ({
          id: document.id + 10000, // Adding offset to avoid ID conflicts
          label: document.title,
          type: 'document' as const,
        }))
      ];

      const links = [
        ...connections.map(conn => ({
          source: conn.sourceId,
          target: conn.targetId,
          strength: conn.strength as 'strong' | 'moderate' | 'weak',
        })),
        ...documentConcepts.map(dc => ({
          source: dc.documentId + 10000, // Adding same offset as above
          target: dc.conceptId,
          strength: 'strong' as const,
        }))
      ];

      res.json({ nodes, links });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching knowledge graph", error: error.message });
    }
  });

  // Insights API
  app.get("/api/insights", async (req, res) => {
    try {
      const insights = await storage.getAllInsights();
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching insights", error: error.message });
    }
  });

  app.post("/api/insights/generate", async (req, res) => {
    try {
      const conceptIds = req.body.conceptIds;
      if (!conceptIds || !Array.isArray(conceptIds)) {
        return res.status(400).json({ message: "conceptIds must be an array" });
      }

      const concepts = [];
      for (const id of conceptIds) {
        const concept = await storage.getConcept(id);
        if (concept) {
          concepts.push(concept);
        }
      }

      if (concepts.length === 0) {
        return res.status(400).json({ message: "No valid concepts found" });
      }

      const generatedInsights = await generateInsights(concepts);
      
      const savedInsights = [];
      for (const insight of generatedInsights) {
        const parsedData = insertInsightSchema.safeParse({
          content: insight.content,
          relatedConceptIds: insight.relatedConceptIds,
          userId: 1, // Default user for now
        });
        
        if (parsedData.success) {
          const savedInsight = await storage.createInsight(parsedData.data);
          savedInsights.push(savedInsight);
        }
      }

      res.json(savedInsights);
    } catch (error: any) {
      res.status(500).json({ message: "Error generating insights", error: error.message });
    }
  });

  app.patch("/api/insights/:id/helpful", async (req, res) => {
    try {
      const insightId = parseInt(req.params.id);
      const insight = await storage.getInsight(insightId);
      
      if (!insight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      const updatedInsight = await storage.updateInsight(insightId, {
        isHelpful: req.body.isHelpful,
      });
      
      res.json(updatedInsight);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating insight", error: error.message });
    }
  });

  app.patch("/api/insights/:id/add-to-graph", async (req, res) => {
    try {
      const insightId = parseInt(req.params.id);
      const insight = await storage.getInsight(insightId);
      
      if (!insight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      const updatedInsight = await storage.updateInsight(insightId, {
        addedToGraph: true,
      });
      
      // Create connections based on this insight if needed
      if (insight.relatedConceptIds && insight.relatedConceptIds.length >= 2) {
        for (let i = 0; i < insight.relatedConceptIds.length - 1; i++) {
          for (let j = i + 1; j < insight.relatedConceptIds.length; j++) {
            await storage.createConceptConnection({
              sourceId: insight.relatedConceptIds[i],
              targetId: insight.relatedConceptIds[j],
              strength: 'moderate',
              aiGenerated: true,
              userId: 1, // Default user for now
            });
          }
        }
      }
      
      res.json(updatedInsight);
    } catch (error: any) {
      res.status(500).json({ message: "Error adding insight to graph", error: error.message });
    }
  });

  // Learning Progress API with enhanced spaced repetition
  app.get("/api/learning", async (_req, res) => {
    try {
      // Initialize with empty array if no progress exists yet
      const allProgress = await storage.getAllLearningProgress() || [];
      res.json(allProgress);
    } catch (error: any) {
      console.error("Learning progress error:", error);
      // Return empty array instead of error to prevent frontend errors
      res.json([]);
    }
  });
  app.get("/api/learning/concept/:conceptId", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const progress = await storage.getLearningProgressByConceptId(conceptId);
      
      if (!progress) {
        // If no progress exists, create initial progress
        const newProgress = await storage.createLearningProgress({
          conceptId,
          userId: 1, // Default user
          comprehension: 0,
          practice: 0,
          lastReviewed: new Date(),
          nextReviewDate: new Date()
        });
        return res.json(newProgress);
      }
      
      res.json(progress);
    } catch (error: any) {
      // Return empty object instead of error to prevent frontend issues
      res.json({
        conceptId: parseInt(req.params.conceptId),
        userId: 1,
        comprehension: 0,
        practice: 0,
        lastReviewed: new Date(),
        nextReviewDate: new Date()
      });
    }
  });

  app.post("/api/learning/:conceptId", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const concept = await storage.getConcept(conceptId);
      
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      
      const parsedData = insertLearningProgressSchema.safeParse({
        conceptId,
        comprehension: req.body.comprehension || 0,
        practice: req.body.practice || 0,
        lastReviewed: new Date(),
        nextReviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
        userId: 1, // Default user for now
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid learning progress data", 
          errors: parsedData.error.errors 
        });
      }

      const progress = await storage.createLearningProgress(parsedData.data);
      res.status(201).json(progress);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating learning progress", error: error.message });
    }
  });

  app.post("/api/learning/progress/:conceptId", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const progress = await storage.getLearningProgressByConceptId(conceptId);
      
      if (!progress) {
        return res.status(404).json({ message: "Learning progress not found" });
      }
      
      const updates: any = {};
      if (req.body.comprehension !== undefined) {
        updates.comprehension = req.body.comprehension;
      }
      if (req.body.practice !== undefined) {
        updates.practice = req.body.practice;
      }
      
      updates.lastReviewed = new Date();
      
      // Use our enhanced spaced repetition algorithm
      const { updateLearningProgress } = await import('./services/spaceRepetition');
      
      // Convert request body to input for enhanced algorithm
      const quality = req.body.quality !== undefined ? req.body.quality : 3; // Default to medium quality
      const duration = req.body.duration !== undefined ? req.body.duration : 60; // Default to 1 minute
      
      // Update learning progress with enhanced spaced repetition data
      const updatedProgressData = await updateLearningProgress(
        conceptId,
        quality,
        duration
      );
      
      // Return the updated progress directly from our algorithm
      return res.json(updatedProgressData);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating learning progress", error: error.message });
    }
  });

  // Get related concepts for a concept
  app.get("/api/concepts/:conceptId/related", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const concept = await storage.getConcept(conceptId);
      
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      
      // Get all concept connections where this concept is either source or target
      const conceptConnections = await storage.getAllConceptConnections();
      const relatedConnections = conceptConnections.filter(conn => 
        conn.sourceId === conceptId || conn.targetId === conceptId
      );
      
      // Get the IDs of related concepts
      const relatedConceptIds = relatedConnections.map(conn => 
        conn.sourceId === conceptId ? conn.targetId : conn.sourceId
      );
      
      // Get the related concepts
      const allConcepts = await storage.getAllConcepts();
      const relatedConcepts = allConcepts.filter(c => relatedConceptIds.includes(c.id));
      
      // Format as graph nodes
      const result = relatedConcepts.map(c => ({
        id: c.id,
        label: c.name,
        type: "concept"
      }));
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching related concepts", error: error.message });
    }
  });
  
  // Get documents for a concept
  app.get("/api/concepts/:conceptId/documents", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      
      // Get document-concept relations for this concept
      const documentConcepts = await storage.getDocumentConceptsByConceptId(conceptId);
      const documentIds = documentConcepts.map(dc => dc.documentId);
      
      // Get the documents
      const documents = [];
      for (const docId of documentIds) {
        const doc = await storage.getDocument(docId);
        if (doc) {
          documents.push(doc);
        }
      }
      
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching concept documents", error: error.message });
    }
  });
  
  // Get insights for a concept
  app.get("/api/concepts/:conceptId/insights", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      
      // Get all insights
      const allInsights = await storage.getAllInsights();
      
      // Filter insights that relate to this concept
      const conceptInsights = allInsights.filter(insight => 
        insight.relatedConceptIds && 
        insight.relatedConceptIds.includes(conceptId)
      );
      
      res.json(conceptInsights);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching concept insights", error: error.message });
    }
  });

  // Adaptive quiz generation API for enhanced spaced repetition learning
  app.get("/api/quiz/:conceptId", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const concept = await storage.getConcept(conceptId);
      
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      
      // Get related documents and concepts
      const documentConcepts = await storage.getDocumentConceptsByConceptId(conceptId);
      const documentIds = documentConcepts.map(dc => dc.documentId);
      const documents = [];
      
      for (const docId of documentIds) {
        const doc = await storage.getDocument(docId);
        if (doc) {
          documents.push(doc);
        }
      }
      
      // Get learning progress to adapt difficulty based on user's level
      let progress = await storage.getLearningProgressByConceptId(conceptId);
            
      // Format documents to provide relevant context
      const documentContext = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 300) // Shorter excerpt for prompt
      }));
      
      // If no progress exists, create initial progress
      if (!progress) {
        progress = await storage.createLearningProgress({
          conceptId,
          userId: 1,
          comprehension: 0,
          practice: 0,
          lastReviewed: new Date(),
          nextReviewDate: new Date()
        });
      }
      
      // Generate adaptive quiz questions using Claude AI
      const { generateQuizQuestions } = await import('./services/anthropic'); 
      try {
        const questions = await generateQuizQuestions(
          concept,
          progress,
          documentContext
        );
        
        // Ensure we're returning valid questions even if Claude fails
        const validQuestions = questions && questions.length > 0 ? questions : [
          {
            question: `What is the primary focus of ${concept.name}?`,
            options: [
              concept.description.split('.')[0],
              "It's not related to any computational models",
              "It only works with specific hardware devices",
              "None of the above"
            ],
            correctAnswer: 0,
            explanation: `${concept.name} is primarily about ${concept.description.split('.')[0]}.`,
            difficulty: "basic",
            conceptArea: concept.name
          }
        ];
        
        res.json({ questions: validQuestions, progress });
      } catch (error) {
        console.error("Error generating quiz questions:", error);
        // Return fallback questions if Claude API fails
        const fallbackQuestions = [
          {
            question: `What is ${concept.name} primarily used for?`,
            options: [
              concept.description.split('.')[0],
              "It has no practical applications",
              "Only for theoretical research",
              "None of the above"
            ],
            correctAnswer: 0,
            explanation: `${concept.name} is primarily used for ${concept.description.split('.')[0]}.`,
            difficulty: "basic",
            conceptArea: concept.name
          }
        ];
        
        res.json({ questions: fallbackQuestions, progress });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error generating quiz", error: error.message });
    }
  });
  
  // Recommended concepts API
  app.get("/api/recommendations/:conceptId", async (req, res) => {
    try {
      const conceptId = parseInt(req.params.conceptId);
      const concept = await storage.getConcept(conceptId);
      
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      
      // Get related concepts based on vector similarity
      const recommendedConcepts = await getRecommendedConcepts(concept);
      res.json(recommendedConcepts);
    } catch (error: any) {
      res.status(500).json({ message: "Error getting recommendations", error: error.message });
    }
  });

  // Using our existing extractConcepts function from the imported module

  const httpServer = createServer(app);
  return httpServer;
}
