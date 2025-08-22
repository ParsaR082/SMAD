'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { exportToPDF, exportToPNG } from '@/utils/exportUtils';

interface ExportButtonProps {
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportType, setExportType] = useState<'png' | 'pdf' | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType('pdf');
    setShowDropdown(false);
    
    try {
      await exportToPDF();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportAllPNG = async () => {
    setIsExporting(true);
    setExportType('png');
    setShowDropdown(false);
    
    try {
      await exportToPNG();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-neon-magenta/20 to-neon-cyan/20 border border-neon-magenta/30 rounded-lg text-sm font-medium text-foreground hover:border-neon-magenta/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-magenta/20 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {exportType === 'pdf' ? 'Exporting PDF...' : 'Exporting PNGs...'}
            </span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </>
        )}
      </motion.button>

      {showDropdown && !isExporting && (
        <motion.div
          className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-2">
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors duration-200"
              onClick={handleExportPDF}
            >
              <FileText className="w-4 h-4 text-neon-magenta" />
              <div className="text-left">
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-muted-foreground">All charts in one document</div>
              </div>
            </button>
            
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors duration-200"
              onClick={handleExportAllPNG}
            >
              <FileImage className="w-4 h-4 text-neon-cyan" />
              <div className="text-left">
                <div className="font-medium">Export as PNG</div>
                <div className="text-xs text-muted-foreground">Individual chart images</div>
              </div>
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;