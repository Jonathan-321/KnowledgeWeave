import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CircleHelp, Link2, MousePointer, Network, Search, Zap, Lightbulb } from 'lucide-react';

export function ResourceGraphGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleHelp className="h-5 w-5" />
          Resource Graph Guide
        </CardTitle>
        <CardDescription>
          How to use the interactive resource graph for enhanced learning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger className="text-sm font-medium">
              What is the Resource Graph?
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <p>
                The Resource Graph is an interactive visualization that connects high-quality learning resources from across the web to help you master concepts more effectively. 
                Each node represents a learning resource (video, article, interactive tool, etc.) with connections showing relationships between resources.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Network className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">Explore connections between resources and concepts</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Link2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Access curated external resources in one place</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">Learn concepts through multiple perspectives and formats</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="navigation">
            <AccordionTrigger className="text-sm font-medium">
              How to Navigate the Graph
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <ul className="space-y-3 list-disc pl-5">
                <li><strong>Zoom</strong>: Use the zoom buttons or mouse wheel to zoom in/out</li>
                <li><strong>Pan</strong>: Click and drag the background to move around</li>
                <li><strong>Select</strong>: Click on any node to view resource details</li>
                <li><strong>Drag nodes</strong>: Click and drag individual nodes to reposition them</li>
              </ul>
              <div className="flex items-center gap-2 mt-4">
                <MousePointer className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium">Tip: Double-click the background to reset the view</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="filters">
            <AccordionTrigger className="text-sm font-medium">
              Using Filters
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <p>
                The Resource Graph allows you to filter resources to find exactly what you need:
              </p>
              <ul className="space-y-2 list-disc pl-5 mt-2">
                <li><strong>Resource Type</strong>: Filter by videos, articles, interactive tools, courses, books</li>
                <li><strong>Quality</strong>: Filter by high, medium, or basic quality resources</li>
                <li><strong>Labels</strong>: Toggle resource labels on/off for better visibility</li>
              </ul>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-medium">Use filters to focus on your preferred learning style</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="color-meaning">
            <AccordionTrigger className="text-sm font-medium">
              Understanding Colors and Connections
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <p className="mb-2">
                Colors and connections in the graph have specific meanings:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium text-xs mb-1">Node Colors:</p>
                  <ul className="space-y-1 list-none pl-0">
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#FF5252]"></span>
                      <span>Videos</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#2196F3]"></span>
                      <span>Articles</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#9C27B0]"></span>
                      <span>Interactive</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#4CAF50]"></span>
                      <span>Courses</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#FF9800]"></span>
                      <span>Books</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">Border Colors:</p>
                  <ul className="space-y-1 list-none pl-0">
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-[#FFD700]"></span>
                      <span>High Quality</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-[#C0C0C0]"></span>
                      <span>Medium Quality</span>
                    </li>
                    <li className="flex items-center gap-1 text-xs">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-[#CD7F32]"></span>
                      <span>Basic Quality</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="font-medium text-xs mt-3 mb-1">Connection Types:</p>
              <ul className="space-y-1 list-none pl-0">
                <li className="flex items-center gap-1 text-xs">
                  <span className="inline-block w-3 h-3 bg-[#ff9800]"></span>
                  <span>Prerequisite (should be learned before)</span>
                </li>
                <li className="flex items-center gap-1 text-xs">
                  <span className="inline-block w-3 h-3 bg-[#4caf50]"></span>
                  <span>Extension (builds on the concept)</span>
                </li>
                <li className="flex items-center gap-1 text-xs">
                  <span className="inline-block w-3 h-3 bg-[#2196f3]"></span>
                  <span>Alternative (different approach to same topic)</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tips">
            <AccordionTrigger className="text-sm font-medium">
              Learning Strategy Tips
            </AccordionTrigger>
            <AccordionContent className="text-sm">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs"><strong>Mix Resource Types</strong>: Combine videos, articles, and interactive resources for better understanding and retention.</p>
                </div>
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs"><strong>Follow the Connections</strong>: Resources connected by lines are related. Follow these paths to build knowledge systematically.</p>
                </div>
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs"><strong>High-Quality First</strong>: Start with gold-bordered high-quality resources for the most accurate and comprehensive information.</p>
                </div>
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs"><strong>Test Your Knowledge</strong>: After exploring resources, take the adaptive quiz to identify knowledge gaps.</p>
                </div>
                <div className="flex gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs"><strong>Discover New Resources</strong>: Click the "Discover New Resources" button to find the latest content for your selected concept.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
