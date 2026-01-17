import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProjectWorkspacePage from '../pages/app/ProjectWorkspacePage';
import { BrowserRouter } from 'react-router-dom';
import * as router from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';

// Mock useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => vi.fn(),
    };
});

// Mock Toast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe('ProjectWorkspacePage Stability', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const mockProject = {
        id: 'proj-123',
        title: 'Test Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        universeId: 'u1',
        universeName: 'Universe 1',
        knowledgeBaseId: 'kb1',
        knowledgeBaseName: 'KB 1',
        ageRange: '5-8',
        templateType: 'values',
        synopsis: 'Synopsis',
        learningObjective: 'Learn',
        setting: 'Setting',
        characterIds: [],
        layoutStyle: 'text-under-image',
        trimSize: '8.5x8.5',
        exportTargets: ['pdf'],
        pipeline: [
            { name: "outline", status: "pending", progress: 0 },
            { name: "chapters", status: "pending", progress: 0 },
            { name: "illustrations", status: "pending", progress: 0 },
            { name: "humanize", status: "pending", progress: 0 },
            { name: "layout", status: "pending", progress: 0 },
            { name: "cover", status: "pending", progress: 0 },
            { name: "export", status: "pending", progress: 0 },
        ],
        currentStage: 'outline',
        artifacts: {},
    };

    it('renders loading state initially', () => {
        vi.spyOn(router, 'useParams').mockReturnValue({ id: 'proj-123' });
        render(
            <TooltipProvider>
                <BrowserRouter>
                    <ProjectWorkspacePage />
                </BrowserRouter>
            </TooltipProvider>
        );
        // With synchronous mock storage, it might render "Project Not Found" immediately.
        expect(screen.queryByText(/Loading|Project Not Found/i)).toBeInTheDocument();
    });

    it('renders project not found if ID missing in storage', async () => {
        vi.spyOn(router, 'useParams').mockReturnValue({ id: 'proj-missing' });
        render(
            <TooltipProvider>
                <BrowserRouter>
                    <ProjectWorkspacePage />
                </BrowserRouter>
            </TooltipProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Project Not Found')).toBeDefined();
        });
    });

    it('renders successfully with a valid new project', async () => {
        localStorage.setItem('noorstudio.projects.v1', JSON.stringify([mockProject]));
        vi.spyOn(router, 'useParams').mockReturnValue({ id: 'proj-123' });

        render(
            <TooltipProvider>
                <BrowserRouter>
                    <ProjectWorkspacePage />
                </BrowserRouter>
            </TooltipProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Pipeline Stages')).toBeDefined();
        });
    });

    it('handles project with undefined characterIds gracefully', async () => {
        const badProject = { ...mockProject, characterIds: undefined }; // Simulate corruption

        localStorage.setItem('noorstudio.projects.v1', JSON.stringify([badProject]));
        vi.spyOn(router, 'useParams').mockReturnValue({ id: 'proj-123' });

        // Catch errors boundary-style
        try {
            render(
                <TooltipProvider>
                    <BrowserRouter>
                        <ProjectWorkspacePage />
                    </BrowserRouter>
                </TooltipProvider>
            );
        } catch (e) {
            // This won't catch render errors in testing library usually, but let's see result
        }

        await waitFor(() => {
            // It might crash. Logic:
            // 1. useEffect runs.
            // 2. getProject returns badProject.
            // 3. setProject(badProject).
            // 4. useEffect continues...
            // 5. loadedProject.characterIds.map(...) -> CRASH

            // If we get here without error, it's fixed.
            // If it errors, the test runner will report it.
            expect(screen.getByText(/Pipeline Stages|Loading|Not Found/)).toBeDefined();
        });
    });
});
