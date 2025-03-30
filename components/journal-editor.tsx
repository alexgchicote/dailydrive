// components/JournalEditor.tsx
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { LabelMark } from './LabelMark';
import { X } from 'lucide-react';
import { TextSelection } from 'prosemirror-state';
import { createClient } from '@/utils/supabase/client';
import isEqual from 'lodash/isEqual';

interface JournalEditorProps {
    userId: string;
    date: string;
    onSave?: (content: JSONContent) => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ userId, date, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [savedStatus, setSavedStatus] = useState<'saved' | 'unsaved' | 'error' | null>(null);
    const [hasJournalEntry, setHasJournalEntry] = useState(false);
    const [initialContent, setInitialContent] = useState<JSONContent | null>(null);
    const supabase = createClient();

    const editor = useEditor({
        extensions: [
            StarterKit, 
            LabelMark,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (!initialContent && editor.isEmpty) {
                setSavedStatus(null);
                return;
            }
            
            const currentContent = editor.getJSON();
            
            if (initialContent) {
                if (isEqual(currentContent, initialContent)) {
                    setSavedStatus('saved');
                } else {
                    setSavedStatus('unsaved');
                }
            } else {
                setSavedStatus('unsaved');
            }
        }
    });

    // Fetch existing journal entry when the component mounts or date changes
    useEffect(() => {
        const loadJournalEntry = async () => {
            if (!editor || !userId || !date) return;
            
            try {
                // First clear the editor content
                editor.commands.clearContent();
                
                // Fetch existing content from Supabase
                const { data, error } = await supabase
                    .from('user_daily_journals')
                    .select('content')
                    .eq('user_id', userId)
                    .eq('log_date', date)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching journal entry:', error);
                    setHasJournalEntry(false);
                    setInitialContent(null);
                    setSavedStatus(null);
                    return;
                }

                if (data?.content) {
                    // Content exists, set it in the editor
                    editor.commands.setContent(data.content);
                    setInitialContent(data.content);
                    setHasJournalEntry(true);
                    setSavedStatus('saved');
                } else {
                    // No content for this date
                    editor.commands.clearContent();
                    setHasJournalEntry(false);
                    setInitialContent(null);
                    setSavedStatus(null);
                }
            } catch (error) {
                console.error('Error loading journal entry:', error);
            }
        };

        loadJournalEntry();
    }, [editor, userId, date, supabase]);

    // On pointerup, adjust selection boundaries to full words.
    useEffect(() => {
        const handlePointerUp = () => {
            if (!editor) return;
            const domSelection = window.getSelection();
            if (!domSelection || domSelection.rangeCount === 0) return;
            const range = domSelection.getRangeAt(0);
            if (range.collapsed) return;
            
            try {
                const expandedRange = range.cloneRange();
                
                // Expand start until whitespace or beginning
                if (expandedRange.startContainer.nodeType === Node.TEXT_NODE) {
                    while (
                        expandedRange.startOffset > 0 &&
                        expandedRange.startContainer.textContent &&
                        !/\s/.test(expandedRange.startContainer.textContent[expandedRange.startOffset - 1])
                    ) {
                        expandedRange.setStart(expandedRange.startContainer, expandedRange.startOffset - 1);
                    }
                }
                
                // Expand end until whitespace or end
                if (expandedRange.endContainer.nodeType === Node.TEXT_NODE) {
                    const textContent = expandedRange.endContainer.textContent || '';
                    while (
                        expandedRange.endOffset < textContent.length &&
                        !/\s/.test(textContent[expandedRange.endOffset])
                    ) {
                        expandedRange.setEnd(expandedRange.endContainer, expandedRange.endOffset + 1);
                    }
                }
                
                // Update editor selection
                const newFrom = editor.view.posAtDOM(expandedRange.startContainer, expandedRange.startOffset);
                const newTo = editor.view.posAtDOM(expandedRange.endContainer, expandedRange.endOffset);
                editor.commands.setTextSelection({ from: newFrom, to: newTo });
            } catch (error) {
                console.error("Error while adjusting selection:", error);
                // If selection adjustment fails, keep the original selection
            }
        };
        
        document.addEventListener('pointerup', handlePointerUp);
        return () => {
            document.removeEventListener('pointerup', handlePointerUp);
        };
    }, [editor]);

    // Function to apply a label based on the current selection.
    const applyLabel = (category: string) => {
        if (!editor) return;
        editor.chain().focus().setMark('label', { category, letter: category.charAt(0) }).run();
        setSavedStatus('unsaved');
    };

    // Function to remove the label mark.
    const removeLabel = () => {
        if (!editor) return;
        editor.chain().focus().unsetMark('label').run();
        setSavedStatus('unsaved');
    };

    // Save journal entry to Supabase
    const saveJournalEntry = async () => {
        if (!editor || !userId || !date) return;

        setIsSaving(true);
        setSavedStatus(null);

        try {
            // Get the current editor content as JSON
            const content = editor.getJSON();

            // Save to Supabase using upsert (insert if not exists, update if exists)
            const { error } = await supabase
                .from('user_daily_journals')
                .upsert({
                    user_id: userId,
                    log_date: date,
                    content: content,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,log_date' });

            if (error) {
                console.error('Error saving journal entry:', error);
                setSavedStatus('error');
                return;
            }

            // Update initial content to match what was just saved
            setInitialContent(content);
            setHasJournalEntry(true);

            // Call the onSave callback if provided
            if (onSave) {
                onSave(content);
            }

            setSavedStatus('saved');
        } catch (error) {
            console.error('Error in save process:', error);
            setSavedStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // Global click handler to detect clicks on a highlighted (labeled) span.
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!editor) return;
            const target = event.target as HTMLElement;
            const labelSpan = target.closest('.label-highlight') as HTMLElement;
            
            // First, remove active class from all highlights
            document.querySelectorAll('.label-highlight').forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.classList.remove('active');
                if (htmlEl.style.backgroundColor) {
                    htmlEl.style.backgroundColor = htmlEl.style.backgroundColor.replace('0.3', '0.15');
                }
            });
            
            if (labelSpan) {
                event.preventDefault();
                event.stopPropagation();
                
                // Activate this label
                labelSpan.classList.add('active');
                const activeBg = labelSpan.getAttribute('data-active-bg');
                if (activeBg) {
                    labelSpan.style.backgroundColor = activeBg;
                }
                
                // Set selection in the editor model but don't show it visually
                if (editor) {
                    // Get positions for the start and end of the labeled text
                    const from = editor.view.posAtDOM(labelSpan, 0);
                    const to = editor.view.posAtDOM(labelSpan, labelSpan.childNodes.length);
                    
                    // Create a proper TextSelection and dispatch it to the view
                    editor.view.dispatch(
                        editor.state.tr.setSelection(
                            TextSelection.create(editor.state.doc, from, to)
                        )
                    );
                    
                    // Add a class to the editor to hide text selection
                    document.querySelector('.ProseMirror')?.classList.add('hide-selection');
                }
            } else {
                // Clicking elsewhere - remove the hide-selection class
                document.querySelector('.ProseMirror')?.classList.remove('hide-selection');
            }
        };
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [editor]);

    if (!editor) return null;

    // Determine the active category (if the current selection is inside a label).
    const activeCategory = editor.isActive('label') ? (editor.getAttributes('label') as {category?: string}).category : null;

    return (
        <div>
            <div className="border rounded-lg border-zinc-800 dark:border-zinc-600 mb-4 bg-white dark:bg-gray-800">
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{
                        duration: 100,
                        offset: [0, 8],
                        placement: 'top',
                        animation: 'fade'
                    }}
                >
                    <div className="flex items-center space-x-1 p-1 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => applyLabel('Habit')}
                            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center h-7 ${activeCategory === 'Habit'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            type="button"
                        >
                            Habit
                        </button>
                        <button
                            onClick={() => applyLabel('Goal')}
                            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center h-7 ${activeCategory === 'Goal'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            type="button"
                        >
                            Goal
                        </button>
                        <button
                            onClick={() => applyLabel('Milestone')}
                            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors flex items-center h-7 ${activeCategory === 'Milestone'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            type="button"
                        >
                            Milestone
                        </button>
                        {activeCategory && (
                            <button
                                onClick={removeLabel}
                                className="text-gray-500 dark:text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center h-7 w-7"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </BubbleMenu>
                <EditorContent editor={editor} className="prose prose-sm dark:prose-invert p-4" />
            </div>
            
            <div className="flex justify-between items-center">
                <button 
                    onClick={saveJournalEntry}
                    disabled={isSaving || savedStatus === 'saved' || (editor?.isEmpty && !hasJournalEntry)}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                        isSaving 
                            ? 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                            : savedStatus === 'saved' || (editor?.isEmpty && !hasJournalEntry)
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'
                    }`}
                    type="button"
                >
                    {isSaving ? 'Saving...' : savedStatus === 'saved' ? 'Saved' : 'Save'}
                </button>
                {savedStatus === 'error' && (
                    <span className="text-red-600 dark:text-red-400 text-sm">
                        Error saving. Please try again.
                    </span>
                )}
                {savedStatus === 'unsaved' && (
                    <span className="text-amber-600 dark:text-amber-400 text-sm">
                        Unsaved changes
                    </span>
                )}
            </div>
            <style jsx global>{`
                .ProseMirror {
                    min-height: 150px;
                    outline: none;
                    padding: 0.5em;
                }
                
                /* Add direct text color control for light/dark modes */
                .ProseMirror {
                    color: #1f2937 !important; /* gray-900 for light mode */
                }
                
                .dark .ProseMirror {
                    color: #d1d5db !important; /* gray-50 for dark mode */
                }
                
                /* Ensure all paragraphs, spans, and text follow the same color scheme */
                .ProseMirror p, 
                .ProseMirror span, 
                .ProseMirror div,
                .ProseMirror h1,
                .ProseMirror h2,
                .ProseMirror h3,
                .ProseMirror h4,
                .ProseMirror h5,
                .ProseMirror h6,
                .ProseMirror ul,
                .ProseMirror ol,
                .ProseMirror li {
                    color: inherit !important;
                }
                
                .ProseMirror p {
                    margin: 0 0 1em;
                    line-height: 1.6;
                }
                
                /* Label highlight styles */
                .label-highlight {
                    cursor: pointer;
                    position: relative;
                }
                
                .label-highlight:hover {
                    filter: brightness(1.1);
                }
                
                .label-highlight.active::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    bottom: -2px;
                    left: -2px;
                    border: 1px solid;
                    border-radius: 4px;
                    pointer-events: none;
                    border-color: inherit;
                    opacity: 0.7;
                }
                
                /* Hide text selection when editor has hide-selection class */
                .ProseMirror.hide-selection *::selection {
                    background-color: transparent !important;
                }
                
                .ProseMirror.hide-selection .label-highlight.active {
                    caret-color: transparent;
                }
                
                /* Override browser's default selection background for our editor */
                .ProseMirror ::selection {
                    background-color: rgba(200, 200, 255, 0.2);
                }
                
                /* Smooth fade animation for bubble menu */
                .tippy-box[data-animation=fade][data-state=hidden] {
                    opacity: 0;
                }
                
                /* Additional dark mode styles for editor content */
                @media (prefers-color-scheme: dark) {
                    /* Adjust highlight colors for dark mode */
                    .label-highlight[data-label="Habit"] {
                        background-color: rgba(0, 122, 255, 0.25) !important;
                        border-bottom-color: rgba(0, 122, 255, 0.7) !important;
                    }
                    
                    .label-highlight[data-label="Goal"] {
                        background-color: rgba(255, 59, 48, 0.25) !important;
                        border-bottom-color: rgba(255, 59, 48, 0.7) !important;
                    }
                    
                    .label-highlight[data-label="Milestone"] {
                        background-color: rgba(175, 82, 222, 0.25) !important;
                        border-bottom-color: rgba(175, 82, 222, 0.7) !important;
                    }
                    
                    .label-highlight.active[data-label="Habit"] {
                        background-color: rgba(0, 122, 255, 0.4) !important;
                    }
                    
                    .label-highlight.active[data-label="Goal"] {
                        background-color: rgba(255, 59, 48, 0.4) !important;
                    }
                    
                    .label-highlight.active[data-label="Milestone"] {
                        background-color: rgba(175, 82, 222, 0.4) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default JournalEditor;