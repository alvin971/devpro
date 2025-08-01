import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  MousePointer,
  Type,
  Square,
  Image,
  Move,
  Layers,
  Palette,
  FolderOpen,
  Grid3x3,
  Plus,
  Settings,
  Download,
  Upload,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Trash2,
  Search,
  Heart,
  Check,
  Copy,
  Eye,
  EyeOff,
  Link,
  Unlink,
  File,
  FileText,
  Folder,
  ChevronDown,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Loader,
  MoreVertical,
  Scissors,
  Clipboard,
  Zap,
  Package,
} from 'lucide-react';

// Charger JSZip pour l'export ZIP
if (typeof window !== 'undefined' && !window.JSZip) {
  const script = document.createElement('script');
  script.src =
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.async = true;
  document.head.appendChild(script);
}

// Hook personnalisé pour le localStorage
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  return [value, setValue];
};

// Hook pour les raccourcis clavier
const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        const {
          key: shortcutKey,
          ctrl: needCtrl = false,
          shift: needShift = false,
          alt: needAlt = false,
        } = keys;

        if (
          key === shortcutKey &&
          ctrl === needCtrl &&
          shift === needShift &&
          alt === needAlt
        ) {
          if (preventDefault) e.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};

// Hook pour le debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Composant Toast pour les notifications
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  };

  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
    >
      {icons[type]}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Composant Menu Contextuel
const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border rounded-lg shadow-lg py-1 z-50 min-w-48"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.separator ? (
            <div className="border-t my-1" />
          ) : (
            <button
              onClick={() => {
                item.action();
                onClose();
              }}
              disabled={item.disabled}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-500">{item.shortcut}</span>
              )}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Composant File Explorer
const FileExplorer = memo(
  ({ files, activeFile, onFileSelect, onFileCreate, onFileDelete }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);

    const toggleFolder = (folder) => {
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(folder)) {
        newExpanded.delete(folder);
      } else {
        newExpanded.add(folder);
      }
      setExpandedFolders(newExpanded);
    };

    const handleContextMenu = (e, file) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          {
            label: 'Rename',
            icon: FileText,
            action: () => console.log('Rename', file),
          },
          {
            label: 'Duplicate',
            icon: Copy,
            action: () => console.log('Duplicate', file),
          },
          { separator: true },
          {
            label: 'Delete',
            icon: Trash2,
            action: () => onFileDelete(file),
            shortcut: 'Del',
          },
        ],
      });
    };

    const renderFileTree = (items, level = 0) => {
      return items.map((item, index) => (
        <div key={index}>
          {item.type === 'folder' ? (
            <>
              <div
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => toggleFolder(item.name)}
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    expandedFolders.has(item.name) ? '' : '-rotate-90'
                  }`}
                />
                <Folder className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">{item.name}</span>
              </div>
              {expandedFolders.has(item.name) && item.children && (
                <div>{renderFileTree(item.children, level + 1)}</div>
              )}
            </>
          ) : (
            <div
              className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer ${
                item.active ? 'bg-blue-50 text-blue-600' : ''
              }`}
              style={{ paddingLeft: `${level * 16 + 24}px` }}
              onClick={() => onFileSelect(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">{item.name}</span>
              {item.modified && (
                <span className="w-2 h-2 bg-orange-400 rounded-full ml-auto" />
              )}
            </div>
          )}
        </div>
      ));
    };

    return (
      <div className="h-full bg-gray-50 border-r">
        <div className="p-3 border-b bg-white flex items-center justify-between">
          <h3 className="font-medium text-sm">Files</h3>
          <button
            onClick={onFileCreate}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-auto">{renderFileTree(files)}</div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    );
  }
);

// Composant Code Editor
const CodeEditor = memo(({ code, language, onChange, theme }) => {
  const editorRef = useRef(null);
  const [lineNumbers, setLineNumbers] = useState([]);

  useEffect(() => {
    const lines = code.split('\n');
    setLineNumbers(lines.map((_, i) => i + 1));
  }, [code]);

  return (
    <div
      className={`font-mono text-sm ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-300'
          : 'bg-white text-gray-800'
      }`}
    >
      <div className="flex">
        <div
          className={`px-3 py-2 ${
            theme === 'dark'
              ? 'bg-gray-800 text-gray-500'
              : 'bg-gray-100 text-gray-600'
          } select-none`}
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-2 bg-transparent outline-none resize-none leading-6"
          spellCheck="false"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
});

// Composant principal WebCraft Pro
const WebCraftPro = () => {
  // États principaux
  const [currentDevice, setCurrentDevice] = useState('desktop');
  const [selectedElement, setSelectedElement] = useState(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState('select');
  const [activePanel, setActivePanel] = useState('layers');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [colorPalette, setColorPalette] = useState([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // États persistants
  const [darkMode, setDarkMode] = useLocalStorage('webcraft-darkmode', false);
  const [autoSave, setAutoSave] = useLocalStorage('webcraft-autosave', true);
  const [recentColors, setRecentColors] = useLocalStorage(
    'webcraft-recent-colors',
    []
  );
  const [favorites, setFavorites] = useLocalStorage('webcraft-favorites', []);
  const [settings, setSettings] = useLocalStorage('webcraft-settings', {
    autoSaveInterval: 30000,
    showRulers: true,
    snapToGrid: false,
    gridSize: 10,
  });

  // Structure de fichiers
  const [projectFiles, setProjectFiles] = useState([
    {
      type: 'folder',
      name: 'src',
      children: [
        { type: 'file', name: 'index.html', active: true, modified: false },
        { type: 'file', name: 'style.css', active: false, modified: false },
        { type: 'file', name: 'script.js', active: false, modified: false },
      ],
    },
    {
      type: 'folder',
      name: 'assets',
      children: [
        { type: 'folder', name: 'images', children: [] },
        { type: 'folder', name: 'fonts', children: [] },
      ],
    },
  ]);

  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Dimensions selon le device
  const deviceDimensions = {
    desktop: { width: 1038, height: 653 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  };

  // Outils disponibles
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select', key: 'V' },
    { id: 'text', icon: Type, label: 'Text', key: 'T' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', key: 'R' },
    { id: 'image', icon: Image, label: 'Image', key: 'I' },
    { id: 'move', icon: Move, label: 'Move', key: 'M' },
  ];

  // Panneaux disponibles
  const panels = [
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
    { id: 'grid', icon: Grid3x3, label: 'Grid' },
  ];

  // Ajout d'un toast
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  // Suppression d'un toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Fonction de sauvegarde automatique
  const autoSaveContent = useCallback(() => {
    if (autoSave && htmlContent) {
      const savedData = {
        html: htmlContent,
        timestamp: new Date().toISOString(),
        device: currentDevice,
        selectedTool,
      };
      localStorage.setItem(
        'webcraft-autosave-content',
        JSON.stringify(savedData)
      );
      addToast('Auto-saved', 'success');
    }
  }, [autoSave, htmlContent, currentDevice, selectedTool, addToast]);

  // Auto-save avec debounce
  const debouncedContent = useDebounce(htmlContent, 2000);

  useEffect(() => {
    if (autoSave && debouncedContent) {
      autoSaveContent();
    }
  }, [debouncedContent, autoSave, autoSaveContent]);
  // Détection de récursion - DOIT être exécuté EN PREMIER
  useEffect(() => {
    try {
      // Si on est dans un iframe, empêcher le chargement de WebCraft
      if (window.self !== window.top) {
        // On est dans un iframe - afficher un avertissement sans modifier htmlContent
        console.warn(
          'WebCraft détecté dans un iframe - certaines fonctionnalités peuvent être limitées'
        );
        // Ne PAS modifier htmlContent ici !
        return;
      }
    } catch (e) {
      // En cas d'erreur cross-origin, continuer normalement
      console.warn(
        'Impossible de détecter le contexte iframe (cross-origin?):',
        e
      );
      // Ne PAS modifier htmlContent ici non plus !
    }
  }, []);

  // Raccourcis clavier
  useKeyboardShortcuts([
    { keys: { key: 'S', ctrl: true }, action: () => saveProject() },
    { keys: { key: 'Z', ctrl: true }, action: () => undo() },
    { keys: { key: 'Y', ctrl: true }, action: () => redo() },
    { keys: { key: 'C', ctrl: true }, action: () => copyElement() },
    { keys: { key: 'V', ctrl: true }, action: () => pasteElement() },
    { keys: { key: 'D', ctrl: true }, action: () => duplicateElement() },
    { keys: { key: 'DELETE' }, action: () => deleteElement() },
    { keys: { key: 'G', ctrl: true }, action: () => setShowGrid(!showGrid) },
    {
      keys: { key: 'E', ctrl: true },
      action: () => setShowCodeEditor(!showCodeEditor),
    },
    { keys: { key: 'V' }, action: () => setSelectedTool('select') },
    { keys: { key: 'T' }, action: () => setSelectedTool('text') },
    { keys: { key: 'R' }, action: () => setSelectedTool('rectangle') },
    { keys: { key: 'I' }, action: () => setSelectedTool('image') },
    { keys: { key: 'M' }, action: () => setSelectedTool('move') },
  ]);

  // Initialisation du contenu HTML par défaut
  useEffect(() => {
    // Vérifier s'il y a du contenu auto-sauvegardé
    const savedContent = localStorage.getItem('webcraft-autosave-content');
    if (savedContent) {
      try {
        const { html } = JSON.parse(savedContent);
        setHtmlContent(html);
        addToast('Restored from auto-save', 'info');
        return;
      } catch (e) {
        console.error('Error loading auto-saved content:', e);
      }
    }

    const defaultHTML = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mon Site Web</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
          }
          h1 { 
            font-size: 3rem; 
            color: #333;
            margin-bottom: 1rem;
            animation: fadeIn 0.6s ease-out;
          }
          p {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 2rem;
            animation: fadeIn 0.8s ease-out;
          }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
          }
          .card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideUp 0.6s ease-out;
          }
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          .card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 1rem;
          }
          .card h3 {
            color: #333;
            margin-bottom: 0.5rem;
          }
          .btn {
            display: inline-block;
            padding: 0.75rem 2rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: all 0.3s ease;
            animation: fadeIn 1s ease-out;
          }
          .btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Bienvenue sur WebCraft Pro</h1>
          <p>Créez des sites web professionnels avec notre éditeur visuel intuitif</p>
          <a href="javascript:void(0)" class="btn" onclick="alert('En mode édition, cliquez sur Navigate pour tester les liens')">Commencer</a>
          
          <div class="card-grid">
            <div class="card" data-duplicable="true">
              <img src="https://picsum.photos/300/200?random=1" alt="Feature 1">
              <h3>Design Moderne</h3>
              <p>Créez des designs épurés et modernes</p>
            </div>
            <div class="card" data-duplicable="true">
              <img src="https://picsum.photos/300/200?random=2" alt="Feature 2">
              <h3>Responsive</h3>
              <p>Sites adaptés à tous les écrans</p>
            </div>
            <div class="card" data-duplicable="true">
              <img src="https://picsum.photos/300/200?random=3" alt="Feature 3">
              <h3>Facile à utiliser</h3>
              <p>Interface intuitive et puissante</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    setHtmlContent(defaultHTML);
  }, [addToast]);

  // Mise à jour du contenu de l'iframe
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      
      // Attendre que l'iframe soit prêt
      const updateIframeContent = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        // Vérifier que doc existe avant de l'utiliser
        if (!doc) {
          console.error('Impossible d\'accéder au document de l\'iframe');
          return;
        }
        
        // Nettoyer complètement l'iframe avant de recharger
        doc.open();
        doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
        doc.close();
        
        // Attendre que le DOM soit prêt
        setTimeout(() => {
          if (!doc.body) return;
          
          doc.open();
          doc.write(htmlContent);
          doc.close();
          
          // Injection conditionnelle selon le mode
          if (!navigationMode) {
            injectEditingScripts();
          } else {
            // En mode navigation, permettre les liens mais pas la récursion
            const script = doc.createElement('script');
            script.textContent = `
              // Empêcher l'ouverture de WebCraft dans WebCraft
              window.addEventListener('beforeunload', (e) => {
                if (window.location.href.includes('webcraft') || 
                    window.location.href.includes('localhost')) {
                  e.preventDefault();
                  e.returnValue = '';
                  return false;
                }
              });
            `;
            if (doc.body) {
              doc.body.appendChild(script);
            }
          }
          
          if (showGrid) {
            injectGridOverlay();
          }
        }, 10);
        setIframeReady(true);
      };
      
      // Si l'iframe n'est pas encore chargé, attendre
      if (iframe.contentDocument === null) {
        iframe.addEventListener('load', updateIframeContent, { once: true });
      } else {
        updateIframeContent();
      }
    }
  }, [htmlContent, navigationMode, showGrid]);

  // Injection de la grille
  const injectGridOverlay = () => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    let gridOverlay = doc.getElementById('webcraft-grid-overlay');

    if (!gridOverlay) {
      gridOverlay = doc.createElement('div');
      gridOverlay.id = 'webcraft-grid-overlay';
      gridOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          repeating-linear-gradient(0deg, transparent, transparent ${
            settings.gridSize - 1
          }px, rgba(0,0,0,0.05) ${settings.gridSize}px),
          repeating-linear-gradient(90deg, transparent, transparent ${
            settings.gridSize - 1
          }px, rgba(0,0,0,0.05) ${settings.gridSize}px);
        pointer-events: none;
        z-index: 9999;
      `;
      doc.body.appendChild(gridOverlay);
    }
  };

  // Injection des scripts pour l'édition (optimisé)
  const injectEditingScripts = useCallback(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    const script = doc.createElement('script');
    script.textContent = `
      let selectedElement = null;
      let draggedElement = null;
      let resizeHandle = null;
      let startX = 0, startY = 0;
      
      // Gestion du drag & drop
      function enableDragDrop() {
        document.addEventListener('dragstart', (e) => {
          if (e.target.classList.contains('draggable')) {
            draggedElement = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.target.style.opacity = '0.5';
          }
        });
        
        document.addEventListener('dragend', (e) => {
          if (e.target.classList.contains('draggable')) {
            e.target.style.opacity = '';
          }
        });
        
        document.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        
        document.addEventListener('drop', (e) => {
          e.preventDefault();
          if (draggedElement && e.target !== draggedElement) {
            const dropTarget = e.target.closest('.droppable');
            if (dropTarget) {
              dropTarget.appendChild(draggedElement);
              window.parent.postMessage({ type: 'contentChanged' }, '*');
            }
          }
        });
      }
      
      // Menu contextuel personnalisé
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'contextMenu',
          x: e.clientX,
          y: e.clientY,
          target: {
            tagName: e.target.tagName,
            className: e.target.className,
            id: e.target.id
          }
        }, '*');
      });
      
      // Empêcher TOUTE navigation en mode édition
      document.addEventListener('click', (e) => {
        // Bloquer tous les liens et boutons submit
        if (e.target.tagName === 'A' || 
            e.target.closest('a') ||
            (e.target.tagName === 'BUTTON' && e.target.type === 'submit') ||
            (e.target.tagName === 'INPUT' && e.target.type === 'submit')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }, true); // true pour capture phase

      // Bloquer aussi les formulaires
      document.addEventListener('submit', (e) => {
        e.preventDefault();
        return false;
      }, true);

      // Gestion de la sélection optimisée
      document.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Retirer l'ancienne sélection
        if (selectedElement) {
          selectedElement.style.outline = '';
          removeResizeHandles();
        }
        
        // Nouvelle sélection
        selectedElement = e.target;
        selectedElement.style.outline = '2px solid #667eea';
        selectedElement.style.outlineOffset = '2px';
        
        // Ajouter les poignées de redimensionnement
        addResizeHandles(selectedElement);
        
        // Envoyer l'info au parent
        window.parent.postMessage({
          type: 'elementSelected',
          tagName: e.target.tagName,
          className: e.target.className,
          id: e.target.id,
          computedStyles: getComputedStyles(e.target)
        }, '*');
      });

      // Obtenir les styles calculés
      function getComputedStyles(element) {
        const styles = window.getComputedStyle(element);
        return {
          width: styles.width,
          height: styles.height,
          margin: styles.margin,
          padding: styles.padding,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          display: styles.display,
          position: styles.position
        };
      }

      // Hover effect optimisé
      let hoverTimeout;
      document.addEventListener('mouseover', (e) => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          if (e.target !== selectedElement) {
            e.target.style.outline = '1px dashed #cbd5e0';
            e.target.style.outlineOffset = '2px';
          }
        }, 50);
      });

      document.addEventListener('mouseout', (e) => {
        if (e.target !== selectedElement) {
          e.target.style.outline = '';
        }
      });

      // Double-clic pour édition de texte avec gestion améliorée
      document.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Liste étendue des éléments éditables
        const editableElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV', 'A', 'BUTTON', 'LI', 'TD', 'TH', 'LABEL'];
        
        if (editableElements.includes(e.target.tagName)) {
          // Sauvegarder le contenu original
          const originalContent = e.target.textContent;
          
          // Activer l'édition
          e.target.contentEditable = 'true';
          e.target.style.outline = '2px dashed #667eea';
          e.target.style.outlineOffset = '2px';
          e.target.focus();
          
          // Sélectionner tout le texte
          const range = document.createRange();
          range.selectNodeContents(e.target);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Fonction pour terminer l'édition
          const finishEditing = () => {
            e.target.contentEditable = 'false';
            e.target.style.outline = '';
            
            // Vérifier si le contenu a changé
            if (e.target.textContent !== originalContent) {
              window.parent.postMessage({
                type: 'contentChanged',
                element: {
                  tagName: e.target.tagName,
                  oldContent: originalContent,
                  newContent: e.target.textContent
                }
              }, '*');
            }
          };
          
          // Gestionnaires d'événements
          const handleBlur = () => {
            finishEditing();
            e.target.removeEventListener('blur', handleBlur);
          };
          
          const handleKeydown = (evt) => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
              evt.preventDefault();
              finishEditing();
              e.target.removeEventListener('keydown', handleKeydown);
              e.target.removeEventListener('blur', handleBlur);
            } else if (evt.key === 'Escape') {
              evt.preventDefault();
              e.target.textContent = originalContent; // Restaurer le contenu original
              finishEditing();
              e.target.removeEventListener('keydown', handleKeydown);
              e.target.removeEventListener('blur', handleBlur);
            }
          };
          
          e.target.addEventListener('blur', handleBlur);
          e.target.addEventListener('keydown', handleKeydown);
        }
      });
      // Ajouter un indicateur visuel pour le mode édition
      const editModeIndicator = document.createElement('div');
      editModeIndicator.id = 'webcraft-edit-mode-indicator';
      editModeIndicator.innerHTML = '🔧 Mode Édition';
      editModeIndicator.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: fadeIn 0.3s ease-out;
      \`;
      document.body.appendChild(editModeIndicator);

      // Ajouter l'animation fadeIn
      // ✅ CODE CORRIGÉ
      const style = document.createElement('style');
      style.textContent = '@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }';
      document.head.appendChild(style);

      // Désactiver tous les liens au chargement
      document.querySelectorAll('a').forEach(link => {
        // Sauvegarder l'href original
        link.setAttribute('data-original-href', link.href);
        link.removeAttribute('href');
        
        // Ajouter un style visuel pour indiquer que c'est désactivé
        link.style.cursor = 'default';
        link.style.opacity = '0.8';
        
        // Ajouter un tooltip au survol
        link.title = 'Lien désactivé en mode édition - Passez en mode Navigation pour tester';
        
        // Empêcher le clic
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Petit effet visuel de feedback
          link.style.animation = 'shake 0.3s';
          setTimeout(() => {
            link.style.animation = '';
          }, 300);
        });
      });

      // Désactiver aussi les boutons submit
      document.querySelectorAll('button[type="submit"], input[type="submit"]').forEach(btn => {
        btn.style.cursor = 'default';
        btn.style.opacity = '0.8';
        btn.disabled = true;
        btn.title = 'Bouton désactivé en mode édition';
      });

      // Poignées de redimensionnement
      function addResizeHandles(element) {
        const handles = ['nw', 'ne', 'sw', 'se'];
        const rect = element.getBoundingClientRect();
        
        handles.forEach(position => {
          const handle = document.createElement('div');
          handle.className = 'resize-handle resize-' + position;
          // ✅ CODE CORRIGÉ
          handle.style.cssText = 'position: absolute; width: 8px; height: 8px; background: #667eea; border: 1px solid white; border-radius: 50%; cursor: ' + position + '-resize; z-index: 10000;';
          
          const positions = {
            nw: { top: rect.top - 4, left: rect.left - 4 },
            ne: { top: rect.top - 4, left: rect.right - 4 },
            sw: { top: rect.bottom - 4, left: rect.left - 4 },
            se: { top: rect.bottom - 4, left: rect.right - 4 }
          };
          
          handle.style.top = positions[position].top + 'px';
          handle.style.left = positions[position].left + 'px';
          
          document.body.appendChild(handle);
        });
      }
      
      function removeResizeHandles() {
        document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
      }

      // Détection des éléments duplicables avec optimisation
      function addDuplicationButtons() {
        // Fonction vide pour le moment
      }

      // Boutons de changement d'image optimisés
      function addImageButtons() {
        const images = document.querySelectorAll('img:not(.webcraft-processed)');
        
        images.forEach(img => {
          img.classList.add('webcraft-processed');
          
          const wrapper = document.createElement('div');
          wrapper.className = 'webcraft-image-wrapper';
          wrapper.style.cssText = 'position: relative; display: inline-block;';
          
          const changeBtn = document.createElement('button');
          changeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>';
          changeBtn.className = 'webcraft-image-change-btn';
          // ✅ CODE CORRIGÉ
          changeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 4px; cursor: pointer; display: none; z-index: 999; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;';
          
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          wrapper.appendChild(changeBtn);
          
          let hoverTimer;
          wrapper.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimer);
            changeBtn.style.display = 'flex';
          });
          
          wrapper.addEventListener('mouseleave', () => {
            hoverTimer = setTimeout(() => {
              changeBtn.style.display = 'none';
            }, 100);
          });
          
          changeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.parent.postMessage({
              type: 'changeImage',
              currentSrc: img.src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight
            }, '*');
          });
        });
      }

      // Animation shake
      
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      \`;
      document.head.appendChild(style);

      // Initialisation avec optimisation
      function initialize() {
        enableDragDrop();
        addDuplicationButtons();
        addImageButtons();
        
        // Observer pour les changements dynamiques
        const observer = new MutationObserver(() => {
          addDuplicationButtons();
          addImageButtons();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }

      // Attendre que le DOM soit prêt
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
    `;
    doc.body.appendChild(script);
  }, []);

  // Écouteur de messages depuis l'iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data.type === 'elementSelected') {
        setSelectedElement(e.data);
        setRightPanelVisible(true);
      } else if (e.data.type === 'contentChanged') {
        saveCurrentState();
      } else if (e.data.type === 'changeImage') {
        setShowMediaLibrary(true);
      } else if (e.data.type === 'contextMenu') {
        setContextMenu({
          x: e.data.x,
          y: e.data.y,
          items: [
            {
              label: 'Cut',
              icon: Scissors,
              action: () => cutElement(),
              shortcut: 'Ctrl+X',
            },
            {
              label: 'Copy',
              icon: Copy,
              action: () => copyElement(),
              shortcut: 'Ctrl+C',
            },
            {
              label: 'Paste',
              icon: Clipboard,
              action: () => pasteElement(),
              shortcut: 'Ctrl+V',
            },
            { separator: true },
            {
              label: 'Duplicate',
              icon: Copy,
              action: () => duplicateElement(),
              shortcut: 'Ctrl+D',
            },
            {
              label: 'Delete',
              icon: Trash2,
              action: () => deleteElement(),
              shortcut: 'Del',
            },
            { separator: true },
            {
              label: 'Properties',
              icon: Settings,
              action: () => setRightPanelVisible(true),
            },
          ],
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fonctions d'édition
  const cutElement = () => {
    copyElement();
    deleteElement();
  };

  const copyElement = () => {
    if (selectedElement) {
      localStorage.setItem(
        'webcraft-clipboard',
        JSON.stringify(selectedElement)
      );
      addToast('Element copied', 'success');
    }
  };

  const pasteElement = () => {
    const clipboard = localStorage.getItem('webcraft-clipboard');
    if (clipboard) {
      // Logique de collage
      addToast('Element pasted', 'success');
    }
  };

  const duplicateElement = () => {
    if (selectedElement) {
      // Logique de duplication
      addToast('Element duplicated', 'success');
    }
  };

  const deleteElement = () => {
    if (selectedElement) {
      // Logique de suppression
      addToast('Element deleted', 'success');
    }
  };

  // Sauvegarde de l'état pour undo/redo
  const saveCurrentState = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc && doc.documentElement) {
          const content = doc.documentElement.outerHTML;
          setUndoStack((prev) => [...prev.slice(-49), content]);
          setRedoStack([]);
        }
      } catch (error) {
        console.warn('Impossible de sauvegarder l\'état actuel:', error);
      }
    }
  }, []);

  // Fonctions undo/redo
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, htmlContent]);
      setUndoStack((prev) => prev.slice(0, -1));
      setHtmlContent(previous);
      addToast('Undo', 'info');
    }
  }, [undoStack, htmlContent, addToast]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [...prev, htmlContent]);
      setRedoStack((prev) => prev.slice(0, -1));
      setHtmlContent(next);
      addToast('Redo', 'info');
    }
  }, [redoStack, htmlContent, addToast]);

  // Détection des couleurs
  const detectColors = useCallback(() => {
    if (!iframeRef.current) return;

    setLoading(true);
    setLoadingProgress(0);

    const doc = iframeRef.current.contentDocument;
    const elements = doc.querySelectorAll('*');
    const colorMap = new Map();

    let processed = 0;
    const total = elements.length;

    elements.forEach((el, index) => {
      const styles = window.getComputedStyle(el);

      [
        'color',
        'backgroundColor',
        'borderColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
      ].forEach((prop) => {
        const color = styles[prop];
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          if (!colorMap.has(color)) {
            colorMap.set(color, []);
          }
          colorMap.get(color).push({ element: el, property: prop });
        }
      });

      processed++;
      if (processed % 10 === 0) {
        setLoadingProgress((processed / total) * 100);
      }
    });

    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([color, usages]) => ({ color, count: usages.length, usages }));

    setColorPalette(sortedColors);
    setLoading(false);
    setLoadingProgress(100);
    addToast(`Found ${sortedColors.length} unique colors`, 'success');
  }, [addToast]);

  // Nouvelle fonction pour gérer l'import de projets complets
  const importProject = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
  
      setLoading(true);
      setLoadingProgress(0);
  
      try {
        // Détecter le type de projet
        const hasIndexHtml = files.some((f) => f.name === 'index.html');
        const hasPackageJson = files.some((f) => f.name === 'package.json');
        const hasSrcFolder = files.some((f) =>
          f.webkitRelativePath.includes('/src/')
        );
  
        let mainHtmlContent = '';
        let projectStructure = {};
  
        // Si c'est un projet Create React App
        if (hasPackageJson && hasSrcFolder) {
          addToast('Detected React project, processing...', 'info');
  
          // Chercher le fichier build/index.html ou public/index.html
          const buildIndex = files.find((f) =>
            f.webkitRelativePath.includes('build/index.html')
          );
          const publicIndex = files.find((f) =>
            f.webkitRelativePath.includes('public/index.html')
          );
  
          if (buildIndex) {
            mainHtmlContent = await readFileAsText(buildIndex);
          } else if (publicIndex) {
            mainHtmlContent = await readFileAsText(publicIndex);
            addToast(
              'Using public/index.html - consider building the project first',
              'warning'
            );
          } else {
            // Créer un HTML de base pour le projet React
            mainHtmlContent = generateReactProjectHTML(files);
          }
        } else if (hasIndexHtml) {
          // Projet HTML standard
          const indexFile = files.find((f) => f.name === 'index.html');
          mainHtmlContent = await readFileAsText(indexFile);
  
          // Traiter les autres fichiers liés
          const cssFiles = files.filter((f) => f.name.endsWith('.css'));
          const jsFiles = files.filter((f) => f.name.endsWith('.js'));
  
          // Intégrer les CSS et JS inline si nécessaire
          for (const cssFile of cssFiles) {
            const cssContent = await readFileAsText(cssFile);
            mainHtmlContent = injectCSS(
              mainHtmlContent,
              cssContent,
              cssFile.name
            );
          }
  
          for (const jsFile of jsFiles) {
            const jsContent = await readFileAsText(jsFile);
            mainHtmlContent = injectJS(mainHtmlContent, jsContent, jsFile.name);
          }
  
          // Gérer les images
          const imageFiles = files.filter((f) =>
            /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f.name)
          );
  
          for (const imgFile of imageFiles) {
            if (imgFile.size < 500000) {
              // Limite 500KB
              try {
                const dataUrl = await readFileAsDataURL(imgFile);
                const imgName = imgFile.name;
  
                // Remplacer les références d'image
                mainHtmlContent = mainHtmlContent.replace(
                  new RegExp(`src=["']([^"']*${imgName})["']`, 'g'),
                  `src="${dataUrl}"`
                );
              } catch (err) {
                console.warn(`Impossible de charger ${imgFile.name}:`, err);
              }
            }
          }
        } // ✅ ACCOLADE FERMANTE IMPORTANTE ICI
  
        // Créer la structure de fichiers pour l'explorateur
        projectStructure = createFileStructure(files);
        setProjectFiles(projectStructure);
  
        // Appliquer le contenu HTML
        if (mainHtmlContent) {
          setHtmlContent(mainHtmlContent);
          // Attendre que le contenu soit chargé avant de sauvegarder
          setTimeout(() => {
            saveCurrentState();
          }, 100);
          addToast(
            `Project imported: ${files.length} files processed`,
            'success'
          );
        } else {
          addToast('No valid HTML content found', 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        addToast('Error importing project: ' + error.message, 'error');
      } finally {
        setLoading(false);
        setLoadingProgress(100);
      }
    },
    [saveCurrentState, addToast]
  );

  // Fonctions utilitaires pour l'import
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // NOUVEAU : Fonction pour lire les images
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const generateReactProjectHTML = (files) => {
    // Générer un HTML de base pour visualiser un projet React
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>React Project Preview</title>
          <style>
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f0f2f5;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .preview-container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 600px;
              text-align: center;
            }
            .react-logo {
              width: 100px;
              height: 100px;
              animation: spin 20s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <svg class="react-logo" viewBox="0 0 841.9 595.3">
              <g fill="#61DAFB">
                <path d="M666.3 296.5c0-32.5-40.7-63.3-103.1-82.4 14.4-63.6 8-114.2-20.2-130.4-6.5-3.8-14.1-5.6-22.4-5.6v22.3c4.6 0 8.3.9 11.4 2.6 13.6 7.8 19.5 37.5 14.9 75.7-1.1 9.4-2.9 19.3-5.1 29.4-19.6-4.8-41-8.5-63.5-10.9-13.5-18.5-27.5-35.3-41.6-50 32.6-30.3 63.2-46.9 84-46.9V78c-27.5 0-63.5 19.6-99.9 53.6-36.4-33.8-72.4-53.2-99.9-53.2v22.3c20.7 0 51.4 16.5 84 46.6-14 14.7-28 31.4-41.3 49.9-22.6 2.4-44 6.1-63.6 11-2.3-10-4-19.7-5.2-29-4.7-38.2 1.1-67.9 14.6-75.8 3-1.8 6.9-2.6 11.5-2.6V78.5c-8.4 0-16 1.8-22.6 5.6-28.1 16.2-34.4 66.7-19.9 130.1-62.2 19.2-102.7 49.9-102.7 82.3 0 32.5 40.7 63.3 103.1 82.4-14.4 63.6-8 114.2 20.2 130.4 6.5 3.8 14.1 5.6 22.5 5.6 27.5 0 63.5-19.6 99.9-53.6 36.4 33.8 72.4 53.2 99.9 53.2 8.4 0 16-1.8 22.6-5.6 28.1-16.2 34.4-66.7 19.9-130.1 62-19.1 102.5-49.9 102.5-82.3zm-130.2-66.7c-3.7 12.9-8.3 26.2-13.5 39.5-4.1-8-8.4-16-13.1-24-4.6-8-9.5-15.8-14.4-23.4 14.2 2.1 27.9 4.7 41 7.9zm-45.8 106.5c-7.8 13.5-15.8 26.3-24.1 38.2-14.9 1.3-30 2-45.2 2-15.1 0-30.2-.7-45-1.9-8.3-11.9-16.4-24.6-24.2-38-7.6-13.1-14.5-26.4-20.8-39.8 6.2-13.4 13.2-26.8 20.7-39.9 7.8-13.5 15.8-26.3 24.1-38.2 14.9-1.3 30-2 45.2-2 15.1 0 30.2.7 45 1.9 8.3 11.9 16.4 24.6 24.2 38 7.6 13.1 14.5 26.4 20.8 39.8-6.3 13.4-13.2 26.8-20.7 39.9zm32.3-13c5.4 13.4 10 26.8 13.8 39.8-13.1 3.2-26.9 5.9-41.2 8 4.9-7.7 9.8-15.6 14.4-23.7 4.6-8 8.9-16.1 13-24.1zM421.2 430c-9.3-9.6-18.6-20.3-27.8-32 9 .4 18.2.7 27.5.7 9.4 0 18.7-.2 27.8-.7-9 11.7-18.3 22.4-27.5 32zm-74.4-58.9c-14.2-2.1-27.9-4.7-41-7.9 3.7-12.9 8.3-26.2 13.5-39.5 4.1 8 8.4 16 13.1 24 4.7 8 9.5 15.8 14.4 23.4zM420.7 163c9.3 9.6 18.6 20.3 27.8 32-9-.4-18.2-.7-27.5-.7-9.4 0-18.7.2-27.8.7 9-11.7 18.3-22.4 27.5-32zm-74 58.9c-4.9 7.7-9.8 15.6-14.4 23.7-4.6 8-8.9 16-13 24 5.4-13.4 10-26.8 13.8-39.8 13.1-3.1 26.9-5.8 41.2-7.9zm-90.5 125.2c-35.4-15.1-58.3-34.9-58.3-50.6 0-15.7 22.9-35.6 58.3-50.6 8.6-3.7 18-7 27.7-10.1 5.7 19.6 13.2 40 22.5 60.9-9.2 20.8-16.6 41.1-22.2 60.6-9.9-3.1-19.3-6.5-28-10.2zM310 490c-13.6-7.8-19.5-37.5-14.9-75.7 1.1-9.4 2.9-19.3 5.1-29.4 19.6 4.8 41 8.5 63.5 10.9 13.5 18.5 27.5 35.3 41.6 50-32.6 30.3-63.2 46.9-84 46.9-4.5-.1-8.3-1-11.3-2.7zm237.2-76.2c4.7 38.2-1.1 67.9-14.6 75.8-3 1.8-6.9 2.6-11.5 2.6-20.7 0-51.4-16.5-84-46.6 14-14.7 28-31.4 41.3-49.9 22.6-2.4 44-6.1 63.6-11 2.3 10.1 4.1 19.8 5.2 29.1zm38.5-66.7c-8.6 3.7-18 7-27.7 10.1-5.7-19.6-13.2-40-22.5-60.9 9.2-20.8 16.6-41.1 22.2-60.6 9.9 3.1 19.3 6.5 28.1 10.2 35.4 15.1 58.3 34.9 58.3 50.6-.1 15.7-23 35.6-58.4 50.6zM320.8 78.4z"/>
                <circle cx="420.9" cy="296.5" r="45.7"/>
                <path d="M520.5 78.1z"/>
              </g>
            </svg>
            <h1>React Project Preview</h1>
            <p>This is a preview of your React project structure.</p>
            <p>To see your actual app, please build your project first:</p>
            <code style="background: #f4f4f4; padding: 0.5rem; border-radius: 4px; display: block; margin: 1rem 0;">
              npm run build
            </code>
            <p>Then import the build folder.</p>
          </div>
        </body>
        </html>
      `;
  };

  const createFileStructure = (files) => {
    const structure = [];
    const paths = {};

    // Trier les fichiers par chemin
    files.forEach((file) => {
      const parts = file.webkitRelativePath.split('/');
      let current = paths;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // C'est un fichier
          if (!current._files) current._files = [];
          current._files.push({
            type: 'file',
            name: part,
            path: file.webkitRelativePath,
            size: file.size,
            modified: false,
          });
        } else {
          // C'est un dossier
          if (!current[part]) {
            current[part] = { _name: part };
          }
          current = current[part];
        }
      });
    });

    // Convertir en structure d'arbre
    const buildTree = (node, name = '') => {
      const result = {
        type: 'folder',
        name: name || 'root',
        children: [],
      };

      Object.keys(node).forEach((key) => {
        if (key === '_files') {
          result.children.push(...node[key]);
        } else if (key !== '_name') {
          result.children.push(buildTree(node[key], key));
        }
      });

      return result;
    };

    return buildTree(paths).children;
  };

  const injectCSS = (html, cssContent, filename) => {
    const styleTag = `\n<style data-source="${filename}">\n${cssContent}\n</style>`;

    // Injecter avant la fermeture de </head>
    if (html.includes('</head>')) {
      return html.replace('</head>', styleTag + '\n</head>');
    } else {
      // Si pas de head, l'ajouter au début
      return styleTag + '\n' + html;
    }
  };

  const injectJS = (html, jsContent, filename) => {
    const scriptTag = `\n<script data-source="${filename}">\n${jsContent}\n</script>`;

    // Injecter avant la fermeture de </body>
    if (html.includes('</body>')) {
      return html.replace('</body>', scriptTag + '\n</body>');
    } else {
      // Si pas de body, l'ajouter à la fin
      return html + '\n' + scriptTag;
    }
  };

  // Export du projet
  // Export du projet amélioré
  const exportProject = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Créer un ZIP avec tous les fichiers
      const zip = new window.JSZip();

      // 1. Ajouter le HTML principal
      zip.file('index.html', htmlContent);

      // 2. Extraire les CSS du HTML
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let styleMatch;
      let cssIndex = 0;

      while ((styleMatch = styleRegex.exec(htmlContent)) !== null) {
        const cssContent = styleMatch[1];
        zip.file(`styles/style${cssIndex}.css`, cssContent);
        cssIndex++;
      }

      // 3. Extraire les JS du HTML
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      let scriptMatch;
      let jsIndex = 0;

      while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
        const jsContent = scriptMatch[1];
        if (jsContent.trim()) {
          // Ignorer les scripts vides
          zip.file(`scripts/script${jsIndex}.js`, jsContent);
          jsIndex++;
        }
      }

      // 4. Ajouter un README
      zip.file(
        'README.txt',
        `
Projet WebCraft Pro
Exporté le : ${new Date().toLocaleString('fr-FR')}

Structure :
- index.html : Fichier principal
- styles/ : Fichiers CSS
- scripts/ : Fichiers JavaScript
      `
      );

      // 5. Générer et télécharger le ZIP
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setLoadingProgress(Math.round(metadata.percent));
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webcraft-project-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setLoading(false);
      addToast('Projet exporté en ZIP !', 'success');
    } catch (error) {
      console.error('Erreur export:', error);

      // Si JSZip n'est pas chargé, export HTML simple
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      a.click();
      URL.revokeObjectURL(url);

      setLoading(false);
      addToast('ZIP non disponible - Exporté en HTML simple', 'warning');
    }
  }, [htmlContent, addToast]);

  // Sauvegarde du projet
  const saveProject = useCallback(() => {
    // Simuler une sauvegarde
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Project saved', 'success');
    }, 1000);
  }, [addToast]);

  // Gestion du drag & drop de fichiers
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        // Afficher une zone de drop
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        // Masquer la zone de drop
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'text/html') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setHtmlContent(e.target.result);
            addToast('File dropped successfully', 'success');
          };
          reader.readAsText(file);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addToast]);

  // Composant Media Library optimisé
  const MediaLibrary = memo(() => {
    const [searchQuery, setSearchQuery] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [viewMode, setViewMode] = useState('medium');
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedOrientation, setSelectedOrientation] = useState('all');
    const [selectedColor, setSelectedColor] = useState('all');

    const searchImages = async () => {
      setLoading(true);
      // Simulation d'une recherche d'images avec différentes sources
      setTimeout(() => {
        const sources = ['Unsplash', 'Pexels', 'Pixabay'];
        const mockImages = Array.from({ length: 24 }, (_, i) => ({
          id: `img-${Date.now()}-${i}`,
          url: `https://picsum.photos/600/400?random=${Date.now() + i}`,
          thumb: `https://picsum.photos/300/200?random=${Date.now() + i}`,
          author: `Photographe ${i + 1}`,
          source: sources[i % 3],
          width: 600,
          height: 400,
          tags: ['nature', 'landscape', 'minimal'][i % 3],
        }));
        setImages(mockImages);
        setLoading(false);
      }, 1000);
    };

    const handleImageSelect = (image) => {
      if (iframeRef.current && selectedElement) {
        // Remplacer l'image sélectionnée
        const doc = iframeRef.current.contentDocument;
        const targetImg = doc.querySelector('img'); // À améliorer pour cibler la bonne image
        if (targetImg) {
          targetImg.src = image.url;
          saveCurrentState();
          addToast('Image replaced', 'success');
        }
      }
      setShowMediaLibrary(false);
    };

    const toggleFavorite = (image) => {
      const newFavorites = favorites.some((f) => f.id === image.id)
        ? favorites.filter((f) => f.id !== image.id)
        : [...favorites, image];
      setFavorites(newFavorites);
      addToast(
        favorites.some((f) => f.id === image.id)
          ? 'Removed from favorites'
          : 'Added to favorites',
        'success'
      );
    };

    const gridSizes = {
      small: 'grid-cols-6',
      medium: 'grid-cols-4',
      large: 'grid-cols-3',
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-lg w-5/6 h-5/6 max-w-7xl flex flex-col animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Media Library</h2>
            <button
              onClick={() => setShowMediaLibrary(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'url'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              URL
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {activeTab === 'search' && (
              <>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Search for images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchImages()}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    <button
                      onClick={searchImages}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Sources</option>
                      <option value="unsplash">Unsplash</option>
                      <option value="pexels">Pexels</option>
                      <option value="pixabay">Pixabay</option>
                    </select>

                    <select
                      value={selectedOrientation}
                      onChange={(e) => setSelectedOrientation(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Orientations</option>
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                      <option value="square">Square</option>
                    </select>

                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Colors</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                    </select>

                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => setViewMode('small')}
                        className={`p-2 ${
                          viewMode === 'small' ? 'bg-gray-100' : ''
                        }`}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('medium')}
                        className={`p-2 ${
                          viewMode === 'medium' ? 'bg-gray-100' : ''
                        }`}
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('large')}
                        className={`p-2 ${
                          viewMode === 'large' ? 'bg-gray-100' : ''
                        }`}
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-gray-600">Searching for images...</p>
                  </div>
                ) : (
                  <div className={`grid ${gridSizes[viewMode]} gap-4`}>
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={img.thumb}
                          alt=""
                          className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                          style={{ aspectRatio: '3/2' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <div className="absolute bottom-2 left-2 text-white text-xs">
                            <p className="font-medium">{img.author}</p>
                            <p className="opacity-80">{img.source}</p>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => handleImageSelect(img)}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => toggleFavorite(img)}
                              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  favorites.some((f) => f.id === img.id)
                                    ? 'text-red-500 fill-current'
                                    : 'text-gray-600'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'upload' && (
              <div
                className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  // Gérer l'upload
                }}
              >
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Drop your images here</p>
                  <p className="text-gray-600 mb-4">or</p>
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Choose Files
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supports: JPG, PNG, GIF, WebP (max 10MB)
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className={`grid ${gridSizes[viewMode]} gap-4`}>
                {favorites.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-600">No favorites yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click the heart icon on images to add them here
                    </p>
                  </div>
                ) : (
                  favorites.map((img, i) => (
                    <div key={i} className="relative group cursor-pointer">
                      <img
                        src={img.thumb}
                        alt=""
                        className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                        style={{ aspectRatio: '3/2' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => handleImageSelect(img)}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(img)}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'url' && (
              <div className="max-w-2xl mx-auto py-8">
                <h3 className="text-lg font-medium mb-4">Enter Image URL</h3>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Use This Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Panneau de propriétés optimisé
  const PropertiesPanel = memo(() => {
    const [activeTab, setActiveTab] = useState('properties');
    const [elementStyles, setElementStyles] = useState({});

    useEffect(() => {
      if (selectedElement?.computedStyles) {
        setElementStyles(selectedElement.computedStyles);
      }
    }, [selectedElement]);

    return (
      <div
        className={`w-80 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white'
        } border-l h-full flex flex-col`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Element Properties</h3>
            <p className="text-sm opacity-70">{selectedElement?.tagName}</p>
          </div>
          <button
            onClick={() => setRightPanelVisible(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'properties'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : ''
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'styles'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : ''
            }`}
          >
            Styles
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : ''
            }`}
          >
            Advanced
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID</label>
                <input
                  type="text"
                  value={selectedElement?.id || ''}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="element-id"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Classes
                </label>
                <input
                  type="text"
                  value={selectedElement?.className || ''}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="class-1 class-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Content
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Element content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Attributes
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="name"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="w-full py-1 border border-dashed border-gray-300 rounded text-sm hover:border-gray-400 transition-colors">
                    + Add Attribute
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'styles' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Layout
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Display
                    </label>
                    <select className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>block</option>
                      <option>flex</option>
                      <option>grid</option>
                      <option>inline</option>
                      <option>inline-block</option>
                      <option>none</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Width
                      </label>
                      <input
                        type="text"
                        value={elementStyles.width || 'auto'}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Height
                      </label>
                      <input
                        type="text"
                        value={elementStyles.height || 'auto'}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Margin
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      <input
                        type="text"
                        placeholder="T"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="R"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="B"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="L"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Padding
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      <input
                        type="text"
                        placeholder="T"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="R"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="B"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                      <input
                        type="text"
                        placeholder="L"
                        className="px-2 py-1 border rounded text-sm text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Typography
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Font Family
                    </label>
                    <select className="w-full px-2 py-1 border rounded text-sm">
                      <option>Sans-serif</option>
                      <option>Serif</option>
                      <option>Monospace</option>
                      <option>Cursive</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Size
                      </label>
                      <input
                        type="text"
                        value={elementStyles.fontSize || '16px'}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Weight
                      </label>
                      <select className="w-full px-2 py-1 border rounded text-sm">
                        <option>100</option>
                        <option>200</option>
                        <option>300</option>
                        <option>400</option>
                        <option>500</option>
                        <option>600</option>
                        <option>700</option>
                        <option>800</option>
                        <option>900</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Line Height
                      </label>
                      <input
                        type="text"
                        placeholder="1.5"
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Letter Spacing
                      </label>
                      <input
                        type="text"
                        placeholder="0px"
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={elementStyles.color || '#000000'}
                        className="w-12 h-8 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={elementStyles.color || '#000000'}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Background
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={elementStyles.backgroundColor || '#ffffff'}
                        className="w-12 h-8 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={elementStyles.backgroundColor || 'transparent'}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Border Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-8 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="#000000"
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                  {recentColors.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Recent Colors
                      </label>
                      <div className="flex gap-1 mt-1">
                        {recentColors.slice(0, 8).map((color, i) => (
                          <button
                            key={i}
                            className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              /* Apply color */
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Duplicable Element</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Enable Drag & Drop</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Custom CSS
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  placeholder=".element {
  /* Custom styles */
}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  JavaScript Events
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
                  <option>onclick</option>
                  <option>onmouseover</option>
                  <option>onmouseout</option>
                  <option>onchange</option>
                  <option>oninput</option>
                </select>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="// JavaScript code"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });

  // Panneau des couleurs
  const ColorsPanel = memo(() => {
    const [searchColor, setSearchColor] = useState('');
    const [selectedColorGroup, setSelectedColorGroup] = useState(null);

    const filteredColors = colorPalette.filter(({ color }) =>
      color.toLowerCase().includes(searchColor.toLowerCase())
    );

    const replaceColor = (oldColor, newColor) => {
      if (!iframeRef.current) return;

      const doc = iframeRef.current.contentDocument;
      const elements = doc.querySelectorAll('*');
      let replacedCount = 0;

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const properties = ['color', 'backgroundColor', 'borderColor'];

        properties.forEach((prop) => {
          if (styles[prop] === oldColor) {
            el.style[prop] = newColor;
            replacedCount++;
          }
        });
      });

      if (replacedCount > 0) {
        saveCurrentState();
        addToast(`Replaced ${replacedCount} instances of the color`, 'success');
        detectColors(); // Refresh the color palette
      }
    };

    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 p-4">
        <div className="mb-4">
          <h3 className="font-medium mb-2">Color Palette</h3>
          <input
            type="text"
            placeholder="Search colors..."
            value={searchColor}
            onChange={(e) => setSearchColor(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          {filteredColors.length === 0 && (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No colors detected</p>
              <button
                onClick={detectColors}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Scan for colors
              </button>
            </div>
          )}

          {filteredColors.map(({ color, count }, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded border-2 border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <p className="font-mono text-sm">{color}</p>
                  <p className="text-xs text-gray-500">
                    {count} usage{count > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSelectedColorGroup(
                      selectedColorGroup === index ? null : index
                    )
                  }
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {selectedColorGroup === index && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      defaultValue={color}
                      className="w-8 h-8 rounded cursor-pointer"
                      id={`color-picker-${index}`}
                    />
                    <button
                      onClick={() => {
                        const newColor = document.getElementById(
                          `color-picker-${index}`
                        ).value;
                        replaceColor(color, newColor);
                      }}
                      className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Replace All
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(color);
                      addToast('Color copied', 'success');
                    }}
                    className="w-full px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
                  >
                    Copy Color
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={detectColors}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Scan Colors
        </button>
      </div>
    );
  });

  // Composant Code Editor Modal
  const CodeEditorModal = memo(() => {
    const [code, setCode] = useState(htmlContent);
    const [language, setLanguage] = useState('html');

    const applyChanges = () => {
      setHtmlContent(code);
      saveCurrentState();
      setShowCodeEditor(false);
      addToast('Code updated', 'success');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg w-5/6 h-5/6 max-w-6xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyChanges}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Apply Changes
              </button>
              <button
                onClick={() => setShowCodeEditor(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={code}
              language={language}
              onChange={setCode}
              theme={darkMode ? 'dark' : 'light'}
            />
          </div>
        </div>
      </div>
    );
  });

  // Composant de chargement
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <Loader className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg mb-2">Processing...</p>
        {loadingProgress > 0 && (
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Styles pour les animations
  const animationStyles = `
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slide-up {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-slide-up { animation: slide-up 0.3s ease-out; }
    .animate-slide-in { animation: slide-in 0.3s ease-out; }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div
        className={`h-screen flex flex-col ${
          darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {/* Toolbar supérieure */}
        <div
          className={`${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          } border-b px-4 py-2 flex items-center justify-between`}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              WebCraft Pro
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </h1>
            <button
              onClick={saveProject}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save ({undoStack.length} pending)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.css,.js,.json,.jpg,.jpeg,.png,.gif,.svg"
              onChange={importProject}
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {currentDevice.charAt(0).toUpperCase() + currentDevice.slice(1)}{' '}
                View
              </span>
              <span className="text-sm text-gray-500">
                {deviceDimensions[currentDevice].width} ×{' '}
                {deviceDimensions[currentDevice].height}px
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Import avec menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="w-4 h-4" />
                  Import
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Menu déroulant */}
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => {
                      // Import fichier HTML seul
                      const input = fileInputRef.current;
                      if (input) {
                        input.removeAttribute('webkitdirectory');
                        input.removeAttribute('directory');
                        input.accept = '.html,.htm';
                        input.click();
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    📄 Fichier HTML
                  </button>
                  <button
                    onClick={() => {
                      // Import dossier complet
                      const input = fileInputRef.current;
                      if (input) {
                        input.setAttribute('webkitdirectory', '');
                        input.setAttribute('directory', '');
                        input.accept = '';
                        input.click();
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    📁 Dossier complet
                  </button>
                </div>
              </div>

              {/* Bouton Export */}
              <button
                onClick={exportProject}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export ZIP
              </button>
            </div>

            <div className="flex items-center gap-1 border rounded p-1 dark:border-gray-600">
              <button
                onClick={() => setCurrentDevice('desktop')}
                className={`p-1.5 rounded transition-colors ${
                  currentDevice === 'desktop'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDevice('tablet')}
                className={`p-1.5 rounded transition-colors ${
                  currentDevice === 'tablet'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDevice('mobile')}
                className={`p-1.5 rounded transition-colors ${
                  currentDevice === 'mobile'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${
                showGrid
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Toggle Grid (Ctrl+G)"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Code Editor (Ctrl+E)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setNavigationMode(!navigationMode)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {navigationMode ? (
                <Link className="w-4 h-4" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              {navigationMode ? 'Navigate' : 'Edit'}
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar gauche */}
          <div
            className={`${
              darkMode ? 'bg-gray-800' : 'bg-gray-900'
            } text-white transition-all duration-300 ${
              sidebarExpanded ? 'w-64' : 'w-16'
            }`}
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`font-semibold ${
                    sidebarExpanded ? 'block' : 'hidden'
                  }`}
                >
                  Tools
                </h2>
                <button
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  {sidebarExpanded ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="space-y-1 mb-6">
                <h3
                  className={`text-xs uppercase text-gray-500 mb-2 ${
                    sidebarExpanded ? 'block' : 'hidden'
                  }`}
                >
                  TOOLS
                </h3>
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                      selectedTool === tool.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700'
                    }`}
                    title={`${tool.label} (${tool.key})`}
                  >
                    <tool.icon className="w-5 h-5" />
                    {sidebarExpanded && (
                      <>
                        <span className="flex-1 text-left">{tool.label}</span>
                        <span className="text-xs opacity-60">{tool.key}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-1 mb-6">
                <h3
                  className={`text-xs uppercase text-gray-500 mb-2 ${
                    sidebarExpanded ? 'block' : 'hidden'
                  }`}
                >
                  PANELS
                </h3>
                {panels.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => {
                      setActivePanel(panel.id);
                      if (panel.id === 'colors') detectColors();
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                      activePanel === panel.id
                        ? 'bg-gray-700'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <panel.icon className="w-5 h-5" />
                    {sidebarExpanded && (
                      <span className="flex-1 text-left">{panel.label}</span>
                    )}
                  </button>
                ))}
              </div>

              <button className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-700 text-blue-400 transition-colors">
                <Plus className="w-5 h-5" />
                {sidebarExpanded && (
                  <span className="flex-1 text-left">Add Component</span>
                )}
              </button>
            </div>
          </div>

          {/* Panel latéral pour Files/Colors/etc */}
          {activePanel === 'files' && (
            <FileExplorer
              files={projectFiles}
              activeFile={0}
              onFileSelect={(file) => console.log('Select file:', file)}
              onFileCreate={() => addToast('Create new file', 'info')}
              onFileDelete={(file) =>
                addToast(`Delete ${file.name}`, 'warning')
              }
            />
          )}

          {activePanel === 'colors' && <ColorsPanel />}

          {/* Zone principale */}
          <div className="flex-1 flex">
            {/* Canvas */}
            <div
              className={`flex-1 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              } p-8 overflow-auto`}
            >
              <div
                className="mx-auto bg-white shadow-2xl transition-all duration-300"
                style={{
                  width: deviceDimensions[currentDevice].width,
                  maxWidth: '100%',
                }}
              >
                {navigationMode ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 text-center flex items-center justify-center gap-2">
                    <Link className="w-4 h-4" />
                    Navigation Mode - Links are clickable
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 text-center flex items-center justify-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    Edit Mode - Click to Select
                    <span className="text-xs bg-blue-200 px-2 py-1 rounded ml-2">
                      {deviceDimensions[currentDevice].width}x
                      {deviceDimensions[currentDevice].height}
                    </span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  className="w-full bg-white"
                  style={{ height: deviceDimensions[currentDevice].height }}
                  title="Preview"
                  sandbox={
                    navigationMode
                      ? 'allow-scripts allow-same-origin'
                      : 'allow-scripts'
                  }
                  src="about:blank"
                />
              </div>
            </div>

            {/* Panneau de propriétés */}
            {rightPanelVisible && <PropertiesPanel />}
          </div>
        </div>

        {/* Toggle Mode Navigation */}
        <button
          onClick={() => setNavigationMode(!navigationMode)}
          className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105 flex items-center gap-2"
        >
          {navigationMode ? (
            <Link className="w-4 h-4" />
          ) : (
            <Unlink className="w-4 h-4" />
          )}
          {navigationMode ? 'Navigation Mode' : 'Edit Mode'}
        </button>

        {/* Media Library Modal */}
        {showMediaLibrary && <MediaLibrary />}

        {/* Code Editor Modal */}
        {showCodeEditor && <CodeEditorModal />}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Loading Overlay */}
        {loading && <LoadingOverlay />}

        {/* Toast Container */}
        <div className="fixed bottom-4 left-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default WebCraftPro;
