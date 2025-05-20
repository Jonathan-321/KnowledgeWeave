import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DetailPanel from "@/components/DetailPanel";
import { Concept } from "@shared/schema";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectConcept = (concept: Concept) => {
    setSelectedConcept(concept);
    setDetailPanelOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Mobile */}
        <div 
          className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
          onClick={closeSidebar}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar closeSidebar={closeSidebar} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
        
        {/* Detail Panel - Mobile */}
        <div 
          className={`fixed inset-0 z-40 lg:hidden ${detailPanelOpen ? "block" : "hidden"}`}
          onClick={closeDetailPanel}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Detail Panel */}
        <div 
          className={`fixed inset-y-0 right-0 z-40 w-80 transform transition-transform duration-200 ease-in-out bg-white shadow-sm overflow-y-auto border-l border-neutral-200 lg:relative lg:translate-x-0 lg:z-0 ${
            detailPanelOpen ? "translate-x-0" : "translate-x-full"
          } ${selectedConcept ? "lg:block" : "lg:hidden"}`}
        >
          <DetailPanel 
            concept={selectedConcept}
            closeDetailPanel={closeDetailPanel}
          />
        </div>
      </div>
    </div>
  );
}
