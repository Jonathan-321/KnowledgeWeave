import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Zap, Plus, Brain } from "lucide-react";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import InsightCard from "@/components/InsightCard";
import ProgressBar from "@/components/ProgressBar";
import ConceptExplorer from "@/components/ConceptExplorer";
import ConceptDetails from "@/components/ConceptDetails";
import { Concept } from "@shared/schema";

export default function Home() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [exploringConceptId, setExploringConceptId] = useState<number | null>(null);
  const [learningConceptId, setLearningConceptId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["/api/insights"],
  });

  const { data: learningProgress = [] } = useQuery({
    queryKey: ["/api/learning"],
  });
  
  const { data: concepts = [] } = useQuery({
    queryKey: ["/api/concepts"],
  });

  // Get recent documents (up to 3)
  const recentDocuments = [...documents]
    .sort((a: any, b: any) => {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    })
    .slice(0, 3);

  // Get random insights (up to 2)
  const randomInsights = insights.slice(0, 2);

  // Get learning progress for a few concepts
  const conceptProgress = learningProgress.slice(0, 2);

  return (
    <div className="flex-1 p-6">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Knowledge Graph</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Visualizing connections between your learning materials
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button variant="outline">
                <History className="mr-2" size={16} />
                <span>History</span>
              </Button>
              <Button>
                <Zap className="mr-2" size={16} />
                <span>Generate Insights</span>
              </Button>
            </div>
          </div>
          
          <KnowledgeGraph onSelectConcept={(concept) => {
            setSelectedConcept(concept);
            setExploringConceptId(concept.id);
          }} />
          
          {/* Interactive Concept Explorer Dialog */}
          {exploringConceptId && (
            <ConceptExplorer
              conceptId={exploringConceptId}
              onClose={() => setExploringConceptId(null)}
              onNavigateToConcept={(conceptId) => {
                setExploringConceptId(conceptId);
                // Find the concept to pass to the explorer
                const concept = concepts.find((c: any) => c.id === conceptId);
                if (concept) {
                  setSelectedConcept(concept);
                }
              }}
              onStartLearning={(conceptId) => {
                setLearningConceptId(conceptId);
                setExploringConceptId(null);
              }}
            />
          )}
          
          {/* Learning Session Dialog */}
          {learningConceptId && (
            <ConceptDetails 
              concept={concepts.find((c: any) => c.id === learningConceptId)}
              onClose={() => setLearningConceptId(null)}
              updateProgress={(data) => {
                // This callback gets triggered when learning session is completed
                // The data contains comprehension and practice scores
                console.log("Learning progress updated:", data);
                setLearningConceptId(null);
              }}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Documents</h3>
                <Link href="/documents">
                  <a className="text-primary text-sm hover:underline">View all</a>
                </Link>
              </div>
              
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc: any) => (
                  <div key={doc.id} className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm mb-2 flex items-start">
                    <span className="material-icons text-gray-400 mr-2 mt-0.5">description</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Added {new Date(doc.uploadDate).toLocaleDateString()} · {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No documents yet</p>
                </div>
              )}
            </div>
            
            <div className="bg-neutral-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">AI-Generated Insights</h3>
                <button className="text-primary text-sm hover:underline">Refresh</button>
              </div>
              
              {randomInsights.length > 0 ? (
                randomInsights.map((insight: any) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              ) : (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No insights yet</p>
                </div>
              )}
            </div>
            
            <div className="bg-neutral-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Learning Progress</h3>
                <Link href="/learning">
                  <a className="text-primary text-sm hover:underline">Details</a>
                </Link>
              </div>
              
              {conceptProgress.length > 0 ? (
                conceptProgress.map((progress: any) => (
                  <div key={progress.id} className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {progress.conceptName}
                      </h4>
                      <span className="text-xs font-medium text-green-600">
                        {progress.comprehension}% Mastered
                      </span>
                    </div>
                    <ProgressBar value={progress.comprehension} color="green" />
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm mb-3 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No learning progress yet</p>
                </div>
              )}
              
              <Button className="w-full mt-3">
                <span className="material-icons mr-2">psychology</span>
                <span>Start Learning Session</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recently Added Documents</h2>
            <Link href="/documents">
              <a className="text-primary text-sm hover:underline flex items-center">
                <span>View Library</span>
                <span className="material-icons text-sm ml-1">chevron_right</span>
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDocuments.length > 0 ? (
              recentDocuments.map((doc: any) => (
                <div key={doc.id} className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                  <div className="p-4 flex items-start">
                    <div className="rounded-md w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-primary">
                      <span className="material-icons">description</span>
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.type.toUpperCase()} · {doc.pageCount} pages · {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <div className="mt-1 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${doc.processed ? "bg-green-500" : "bg-yellow-500"} mr-1`}></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.processed ? "Processed" : "Processing..."}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="px-4 py-3 bg-neutral-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between">
                      <span>Added {new Date(doc.uploadDate).toLocaleDateString()}</span>
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-primary dark:hover:text-primary">
                          <span className="material-icons text-sm">visibility</span>
                        </button>
                        <button className="text-gray-400 hover:text-primary dark:hover:text-primary">
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-500">
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center p-8">
                <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2" size={16} />
            <span>Upload More Documents</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
