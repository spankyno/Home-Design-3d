import React, { Suspense, lazy, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from './state/useEditorStore';
import { loadLastSessionProject } from './storage';
import { Header } from './components/Header';
import { ToolSidebar } from './components/ToolSidebar';
import { PropertyInspector } from './components/PropertyInspector';
import { StatusBar } from './components/StatusBar';
import { EditorCanvas2D } from './editor2d/EditorCanvas2D';
import { Footer } from './components/Footer';
import { ProjectsModal } from './components/ProjectsModal';
import { DimensionEditModal } from './components/DimensionEditModal';

const AUTOSAVE_DELAY_MS = 1500;
/** Arrow-key nudges less than this many ms apart (taps or key-repeat) count as one undo step. */
const NUDGE_COMMIT_MS = 500;
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** True when the key event comes from a control where typing must not trigger shortcuts. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

// Heavy, rarely-needed parts load on demand: the 3D view (Three.js), the export dialog (GLTF exporter) and the
// parametric designer. This keeps the first paint (and Core Web Vitals) light.
const EditorCanvas3D = lazy(() => import('./editor3d/EditorCanvas3D').then((m) => ({ default: m.EditorCanvas3D })));
const ParametricModal = lazy(() => import('./components/ParametricModal').then((m) => ({ default: m.ParametricModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then((m) => ({ default: m.ExportModal })));

const ViewLoading: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-500">
    {label}
  </div>
);

export const App: React.FC = () => {
  const {
    viewMode,
    activeModal,
    project,
    isDirty,
    setProject,
    saveCurrentProject,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    moveSelected,
    pushHistorySnapshot,
    clearSelection,
    setActiveTool,
  } = useEditorStore(
    useShallow((s) => ({
      viewMode: s.viewMode,
      activeModal: s.activeModal,
      project: s.project,
      isDirty: s.isDirty,
      setProject: s.setProject,
      saveCurrentProject: s.saveCurrentProject,
      undo: s.undo,
      redo: s.redo,
      deleteSelected: s.deleteSelected,
      duplicateSelected: s.duplicateSelected,
      moveSelected: s.moveSelected,
      pushHistorySnapshot: s.pushHistorySnapshot,
      clearSelection: s.clearSelection,
      setActiveTool: s.setActiveTool,
    }))
  );

  // Load last session on mount
  useEffect(() => {
    let cancelled = false;
    loadLastSessionProject()
      .then((proj) => {
        // Don't clobber the project if the user already started editing.
        if (!cancelled && !useEditorStore.getState().isDirty) setProject(proj);
      })
      .catch((err) => console.error('Could not restore the last session', err));
    return () => {
      cancelled = true;
    };
  }, [setProject]);

  // Debounced autosave: runs AUTOSAVE_DELAY_MS after the *last* modification
  // (depending on `project` restarts the timer on every edit).
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(saveCurrentProject, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [project, isDirty, saveCurrentProject]);

  // Flush pending changes as soon as the tab is hidden or the page is being left.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && useEditorStore.getState().isDirty) {
        saveCurrentProject();
      }
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [saveCurrentProject]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    let nudgeTimer: ReturnType<typeof setTimeout> | undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Arrow keys nudge the selection in the plan: 10 mm, Shift = one grid cell, Alt = 1 mm.
      const arrow = ARROWS[e.key];
      if (arrow && !mod) {
        const { selectedIds, viewMode: mode, project: current } = useEditorStore.getState();
        if (mode !== '2d' || selectedIds.length === 0) return;
        e.preventDefault();
        const step = e.altKey ? 1 : e.shiftKey ? current.gridSize : 10;
        moveSelected(arrow[0] * step, arrow[1] * step);
        clearTimeout(nudgeTimer);
        nudgeTimer = setTimeout(pushHistorySnapshot, NUDGE_COMMIT_MS);
        return;
      }

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && key === 's') {
        e.preventDefault();
        saveCurrentProject();
      } else if (mod && key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') {
        clearSelection();
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(nudgeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo,
    redo,
    saveCurrentProject,
    duplicateSelected,
    deleteSelected,
    moveSelected,
    pushHistorySnapshot,
    clearSelection,
    setActiveTool,
  ]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 overflow-hidden font-sans text-slate-800 antialiased select-none">
      {/* Top Application Bar */}
      <Header />

      {/* Main Workspace (Left Sidebar + Center Canvas + Right Inspector) */}
      <main className="flex-1 flex overflow-hidden relative">
        <ToolSidebar />

        <div className="flex-1 h-full relative overflow-hidden bg-slate-100">
          {viewMode === '2d' ? (
            <EditorCanvas2D />
          ) : (
            <Suspense fallback={<ViewLoading label="Cargando la vista 3D…" />}>
              <EditorCanvas3D />
            </Suspense>
          )}
        </div>

        <PropertyInspector />
      </main>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Site footer: About page, blog, Aitor Hub, contact, copyright */}
      <Footer />

      {/* Modals & Popovers (heavy ones are mounted only while open, so their code is fetched on demand) */}
      <Suspense fallback={null}>
        {activeModal === 'parametric_designer' && <ParametricModal />}
        {activeModal === 'export' && <ExportModal />}
      </Suspense>
      <ProjectsModal />
      <DimensionEditModal />
    </div>
  );
};

export default App;
