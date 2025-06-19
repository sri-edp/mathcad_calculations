/**
 * Document Editor with WYSIWYG support
 * Implements REQ-011, REQ-012, REQ-013, REQ-014
 */

class DocumentEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.blocks = [];
        this.currentBlockId = null;
        this.templates = new Map();
        this.autoSaveInterval = null;
        this.spellChecker = null;

        // Initialize editor
        this.initializeEditor();

        // Initialize spell checker
        this.initializeSpellChecker();

        // Setup auto-save
        this.setupAutoSave();
    }

    /**
     * Initialize the WYSIWYG editor (REQ-011)
     */
    initializeEditor() {
        // Create editor structure
        this.container.innerHTML = `
            <div class="document-editor">
                <div class="editor-toolbar">
                    ${this.createToolbar()}
                </div>
                <div class="editor-content" contenteditable="false">
                    <div class="editor-blocks" id="editor-blocks"></div>
                </div>
                <div class="editor-footer">
                    <div class="word-count">Words: <span id="word-count">0</span></div>
                    <div class="char-count">Characters: <span id="char-count">0</span></div>
                </div>
            </div>
        `;

        // Get references
        this.blocksContainer = document.getElementById('editor-blocks');
        this.wordCountEl = document.getElementById('word-count');
        this.charCountEl = document.getElementById('char-count');

        // Bind events
        this.bindEvents();

        // Initialize with a text block
        this.addBlock('text');
    }

    /**
     * Create toolbar HTML
     */
    createToolbar() {
        return `
            <!-- Text formatting -->
            <div class="toolbar-group">
                <button class="toolbar-btn" data-command="bold" title="Bold">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="toolbar-btn" data-command="italic" title="Italic">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="toolbar-btn" data-command="underline" title="Underline">
                    <i class="fas fa-underline"></i>
                </button>
                <button class="toolbar-btn" data-command="strikethrough" title="Strikethrough">
                    <i class="fas fa-strikethrough"></i>
                </button>
            </div>

            <!-- Text alignment -->
            <div class="toolbar-group">
                <button class="toolbar-btn" data-command="justifyLeft" title="Align Left">
                    <i class="fas fa-align-left"></i>
                </button>
                <button class="toolbar-btn" data-command="justifyCenter" title="Align Center">
                    <i class="fas fa-align-center"></i>
                </button>
                <button class="toolbar-btn" data-command="justifyRight" title="Align Right">
                    <i class="fas fa-align-right"></i>
                </button>
                <button class="toolbar-btn" data-command="justifyFull" title="Justify">
                    <i class="fas fa-align-justify"></i>
                </button>
            </div>

            <!-- Lists -->
            <div class="toolbar-group">
                <button class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
                    <i class="fas fa-list-ul"></i>
                </button>
                <button class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
                    <i class="fas fa-list-ol"></i>
                </button>
                <button class="toolbar-btn" data-command="outdent" title="Decrease Indent">
                    <i class="fas fa-outdent"></i>
                </button>
                <button class="toolbar-btn" data-command="indent" title="Increase Indent">
                    <i class="fas fa-indent"></i>
                </button>
            </div>

            <!-- Insert elements -->
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="add-heading" title="Add Heading">
                    <i class="fas fa-heading"></i>
                </button>
                <button class="toolbar-btn" data-action="add-math" title="Add Math">
                    <i class="fas fa-square-root-alt"></i>
                </button>
                <button class="toolbar-btn" data-action="add-table" title="Add Table">
                    <i class="fas fa-table"></i>
                </button>
                <button class="toolbar-btn" data-action="add-image" title="Add Image">
                    <i class="fas fa-image"></i>
                </button>
                <button class="toolbar-btn" data-action="add-link" title="Add Link">
                    <i class="fas fa-link"></i>
                </button>
            </div>

            <!-- Document actions -->
            <div class="toolbar-group">
                <button class="toolbar-btn" data-action="spell-check" title="Spell Check">
                    <i class="fas fa-spell-check"></i>
                </button>
                <button class="toolbar-btn" data-action="page-break" title="Insert Page Break">
                    <i class="fas fa-file-alt"></i>
                </button>
                <button class="toolbar-btn" data-action="header-footer" title="Edit Header/Footer">
                    <i class="fas fa-th-large"></i>
                </button>
            </div>

            <!-- Styles dropdown -->
            <div class="toolbar-group">
                <select class="toolbar-select" id="style-select">
                    <option value="">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="h5">Heading 5</option>
                    <option value="h6">Heading 6</option>
                    <option value="pre">Code</option>
                    <option value="blockquote">Quote</option>
                </select>
            </div>

            <!-- Font options -->
            <div class="toolbar-group">
                <select class="toolbar-select" id="font-family">
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
                <select class="toolbar-select" id="font-size">
                    <option value="1">8pt</option>
                    <option value="2">10pt</option>
                    <option value="3">12pt</option>
                    <option value="4">14pt</option>
                    <option value="5">18pt</option>
                    <option value="6">24pt</option>
                    <option value="7">36pt</option>
                </select>
            </div>

            <!-- Color pickers -->
            <div class="toolbar-group">
                <input type="color" class="toolbar-color" id="text-color" title="Text Color">
                <input type="color" class="toolbar-color" id="bg-color" title="Background Color">
            </div>
        `;
    }

    /**
     * Bind editor events
     */
    bindEvents() {
        // Toolbar commands
        this.container.querySelectorAll('[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                this.executeCommand(command);
            });
        });

        // Toolbar actions
        this.container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.executeAction(action);
            });
        });

        // Style select
        document.getElementById('style-select').addEventListener('change', (e) => {
            this.applyStyle(e.target.value);
        });

        // Font family
        document.getElementById('font-family').addEventListener('change', (e) => {
            this.executeCommand('fontName', e.target.value);
        });

        // Font size
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.executeCommand('fontSize', e.target.value);
        });

        // Text color
        document.getElementById('text-color').addEventListener('change', (e) => {
            this.executeCommand('foreColor', e.target.value);
        });

        // Background color
        document.getElementById('bg-color').addEventListener('change', (e) => {
            this.executeCommand('backColor', e.target.value);
        });

        // Content changes
        this.blocksContainer.addEventListener('input', () => {
            this.updateCounts();
            this.onContentChange();
        });

        // Block selection
        this.blocksContainer.addEventListener('click', (e) => {
            const block = e.target.closest('.editor-block');
            if (block) {
                this.selectBlock(block.dataset.blockId);
            }
        });
    }

    /**
     * Execute formatting command
     */
    executeCommand(command, value = null) {
        const block = this.getCurrentBlock();
        if (!block || !block.contentEditable) return;

        document.execCommand(command, false, value);
        this.onContentChange();
    }

    /**
     * Execute toolbar action
     */
    executeAction(action) {
        switch (action) {
            case 'add-heading':
                this.showHeadingDialog();
                break;
            case 'add-math':
                this.addBlock('math');
                break;
            case 'add-table':
                this.showTableDialog();
                break;
            case 'add-image':
                this.showImageDialog();
                break;
            case 'add-link':
                this.insertLink();
                break;
            case 'spell-check':
                this.toggleSpellCheck();
                break;
            case 'page-break':
                this.insertPageBreak();
                break;
            case 'header-footer':
                this.showHeaderFooterDialog();
                break;
        }
    }

    /**
     * Add a new block (REQ-011, REQ-012)
     */
    addBlock(type, content = '', options = {}) {
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const blockEl = document.createElement('div');
        blockEl.className = `editor-block block-${type}`;
        blockEl.dataset.blockId = blockId;
        blockEl.dataset.blockType = type;

        let blockContent = '';

        switch (type) {
            case 'text':
                blockContent = `
                    <div class="block-content text-content" contenteditable="true">
                        ${content || '<p>Start typing here...</p>'}
                    </div>
                `;
                break;

            case 'math':
                blockContent = `
                    <div class="block-content math-content">
                        <div class="math-input" contenteditable="true" placeholder="Enter LaTeX equation...">${content}</div>
                        <div class="math-preview"></div>
                    </div>
                `;
                break;

            case 'heading':
                const level = options.level || 2;
                blockContent = `
                    <div class="block-content heading-content" contenteditable="true">
                        <h${level}>${content || 'Heading'}</h${level}>
                    </div>
                `;
                break;

            case 'table':
                blockContent = this.createTableHTML(options.rows || 3, options.cols || 3);
                break;

            case 'image':
                blockContent = `
                    <div class="block-content image-content">
                        <img src="${content}" alt="${options.alt || 'Image'}" />
                        <div class="image-caption" contenteditable="true">${options.caption || 'Caption'}</div>
                    </div>
                `;
                break;

            case 'page-break':
                blockContent = `
                    <div class="block-content page-break-content">
                        <hr class="page-break" />
                        <span class="page-break-label">Page Break</span>
                    </div>
                `;
                break;
        }

        // Add block controls
        blockEl.innerHTML = `
            <div class="block-controls">
                <button class="block-btn move-up" title="Move Up">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="block-btn move-down" title="Move Down">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="block-btn delete-block" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            ${blockContent}
        `;

        // Add to DOM
        if (this.currentBlockId) {
            const currentBlock = document.querySelector(`[data-block-id="${this.currentBlockId}"]`);
            if (currentBlock) {
                currentBlock.insertAdjacentElement('afterend', blockEl);
            } else {
                this.blocksContainer.appendChild(blockEl);
            }
        } else {
            this.blocksContainer.appendChild(blockEl);
        }

        // Bind block-specific events
        this.bindBlockEvents(blockEl);

        // Store block info
        this.blocks.push({
            id: blockId,
            type: type,
            element: blockEl
        });

        // Select new block
        this.selectBlock(blockId);

        // Initialize math preview if needed
        if (type === 'math') {
            this.initMathBlock(blockEl);
        }

        return blockId;
    }

    /**
     * Initialize math block with live preview (REQ-011)
     */
    initMathBlock(blockEl) {
        const input = blockEl.querySelector('.math-input');
        const preview = blockEl.querySelector('.math-preview');

        input.addEventListener('input', () => {
            const latex = input.textContent;
            if (latex) {
                preview.innerHTML = `\\[${latex}\\]`;
                if (window.MathJax) {
                    MathJax.typesetPromise([preview]).catch(err => {
                        preview.innerHTML = '<span class="error">Invalid LaTeX</span>';
                    });
                }
            } else {
                preview.innerHTML = '';
            }
        });

        // Trigger initial render
        input.dispatchEvent(new Event('input'));
    }

    /**
     * Create table HTML
     */
    createTableHTML(rows, cols) {
        let tableHTML = '<table class="editor-table" contenteditable="true"><tbody>';

        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += `<td contenteditable="true">Cell ${i + 1},${j + 1}</td>`;
            }
            tableHTML += '</tr>';
        }

        tableHTML += '</tbody></table>';

        return `<div class="block-content table-content">${tableHTML}</div>`;
    }

    /**
     * Bind block-specific events
     */
    bindBlockEvents(blockEl) {
        // Move up
        blockEl.querySelector('.move-up')?.addEventListener('click', () => {
            this.moveBlock(blockEl.dataset.blockId, 'up');
        });

        // Move down
        blockEl.querySelector('.move-down')?.addEventListener('click', () => {
            this.moveBlock(blockEl.dataset.blockId, 'down');
        });

        // Delete
        blockEl.querySelector('.delete-block')?.addEventListener('click', () => {
            this.deleteBlock(blockEl.dataset.blockId);
        });
    }

    /**
     * Initialize spell checker (REQ-014)
     */
    initializeSpellChecker() {
        // Simple spell checker implementation
        // In production, would integrate with a proper spell checking library
        this.spellChecker = {
            enabled: false,
            dictionary: new Set([
                // Add common words
                'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'
                // In production, load from comprehensive dictionary
            ]),

            check: (text) => {
                const words = text.toLowerCase().match(/\b\w+\b/g) || [];
                const misspelled = [];

                words.forEach(word => {
                    if (!this.spellChecker.dictionary.has(word) && word.length > 2) {
                        misspelled.push(word);
                    }
                });

                return misspelled;
            }
        };
    }

    /**
     * Toggle spell check
     */
    toggleSpellCheck() {
        this.spellChecker.enabled = !this.spellChecker.enabled;

        if (this.spellChecker.enabled) {
            this.performSpellCheck();
        } else {
            this.clearSpellCheckHighlights();
        }
    }

    /**
     * Perform spell check on all text blocks
     */
    performSpellCheck() {
        this.blocks.forEach(block => {
            if (block.type === 'text' || block.type === 'heading') {
                const content = block.element.querySelector('[contenteditable="true"]');
                if (content) {
                    const text = content.textContent;
                    const misspelled = this.spellChecker.check(text);

                    if (misspelled.length > 0) {
                        this.highlightMisspelledWords(content, misspelled);
                    }
                }
            }
        });
    }

    /**
     * Document templates (REQ-013)
     */
    loadTemplate(templateId) {
        // Load predefined templates
        const templates = {
            'report': {
                name: 'Technical Report',
                blocks: [
                    { type: 'heading', content: 'Technical Report', options: { level: 1 } },
                    { type: 'heading', content: 'Abstract', options: { level: 2 } },
                    { type: 'text', content: '<p>Brief summary of the report...</p>' },
                    { type: 'heading', content: 'Introduction', options: { level: 2 } },
                    { type: 'text', content: '<p>Background and objectives...</p>' },
                    { type: 'heading', content: 'Methodology', options: { level: 2 } },
                    { type: 'text', content: '<p>Approach and methods used...</p>' },
                    { type: 'heading', content: 'Results', options: { level: 2 } },
                    { type: 'text', content: '<p>Findings and data...</p>' },
                    { type: 'heading', content: 'Conclusion', options: { level: 2 } },
                    { type: 'text', content: '<p>Summary and recommendations...</p>' }
                ]
            },
            'memo': {
                name: 'Memorandum',
                blocks: [
                    { type: 'heading', content: 'MEMORANDUM', options: { level: 1 } },
                    { type: 'text', content: '<p><strong>TO:</strong> [Recipient]</p>' },
                    { type: 'text', content: '<p><strong>FROM:</strong> [Your Name]</p>' },
                    { type: 'text', content: '<p><strong>DATE:</strong> ' + new Date().toLocaleDateString() + '</p>' },
                    { type: 'text', content: '<p><strong>SUBJECT:</strong> [Subject]</p>' },
                    { type: 'text', content: '<hr>' },
                    { type: 'text', content: '<p>Memo content...</p>' }
                ]
            },
            'letter': {
                name: 'Business Letter',
                blocks: [
                    { type: 'text', content: '<p>[Your Name]<br>[Your Address]<br>[City, State ZIP]<br>[Date]</p>' },
                    { type: 'text', content: '<p>[Recipient Name]<br>[Company]<br>[Address]<br>[City, State ZIP]</p>' },
                    { type: 'text', content: '<p>Dear [Recipient],</p>' },
                    { type: 'text', content: '<p>Letter body...</p>' },
                    { type: 'text', content: '<p>Sincerely,<br>[Your Name]</p>' }
                ]
            }
        };

        const template = templates[templateId];
        if (template) {
            // Clear current content
            this.clearAll();

            // Load template blocks
            template.blocks.forEach(block => {
                this.addBlock(block.type, block.content, block.options || {});
            });

            showNotification(`Loaded template: ${template.name}`, 'success');
        }
    }

    /**
     * Header and footer management (REQ-013)
     */
    showHeaderFooterDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Header & Footer Settings</h5>
                        <button type="button" class="btn-close" data-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Header Text</label>
                            <input type="text" class="form-control" id="header-text"
                                   placeholder="Enter header text">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Footer Text</label>
                            <input type="text" class="form-control" id="footer-text"
                                   placeholder="Enter footer text">
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="show-page-numbers">
                                <label class="form-check-label" for="show-page-numbers">
                                    Show page numbers
                                </label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Page Number Position</label>
                            <select class="form-select" id="page-number-position">
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-left">Top Left</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-header-footer">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle save
        document.getElementById('save-header-footer').addEventListener('click', () => {
            const settings = {
                header: document.getElementById('header-text').value,
                footer: document.getElementById('footer-text').value,
                showPageNumbers: document.getElementById('show-page-numbers').checked,
                pageNumberPosition: document.getElementById('page-number-position').value
            };

            this.applyHeaderFooterSettings(settings);
            modal.remove();
        });

        // Handle close
        modal.querySelector('[data-dismiss="modal"]').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Apply header/footer settings
     */
    applyHeaderFooterSettings(settings) {
        // Store settings
        this.headerFooterSettings = settings;

        // Apply to print styles
        let styleEl = document.getElementById('print-header-footer-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'print-header-footer-styles';
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = `
            @media print {
                @page {
                    margin: 1in;
                    ${settings.header ? `@top-center { content: "${settings.header}"; }` : ''}
                    ${settings.footer ? `@bottom-center { content: "${settings.footer}"; }` : ''}
                    ${settings.showPageNumbers ? this.getPageNumberCSS(settings.pageNumberPosition) : ''}
                }
            }
        `;
    }

    /**
     * Get CSS for page numbers
     */
    getPageNumberCSS(position) {
        const positions = {
            'bottom-right': '@bottom-right { content: counter(page); }',
            'bottom-center': '@bottom-center { content: counter(page); }',
            'bottom-left': '@bottom-left { content: counter(page); }',
            'top-right': '@top-right { content: counter(page); }',
            'top-center': '@top-center { content: counter(page); }',
            'top-left': '@top-left { content: counter(page); }'
        };
        return positions[position] || positions['bottom-right'];
    }

    /**
     * Auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);
    }

    /**
     * Perform auto-save
     */
    autoSave() {
        const content = this.getContent();

        // Save to local storage
        localStorage.setItem('doc_editor_autosave', JSON.stringify({
            content: content,
            timestamp: Date.now()
        }));

        // Show indicator
        this.showAutoSaveIndicator();
    }

    /**
     * Show auto-save indicator
     */
    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = '<i class="fas fa-save"></i> Auto-saved';
        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    /**
     * Get document content
     */
    getContent() {
        const content = {
            blocks: [],
            metadata: {
                wordCount: this.getWordCount(),
                characterCount: this.getCharacterCount(),
                lastModified: Date.now()
            }
        };

        this.blocks.forEach(block => {
            const blockEl = block.element;
            const blockData = {
                id: block.id,
                type: block.type,
                content: this.getBlockContent(blockEl)
            };

            content.blocks.push(blockData);
        });

        return content;
    }

    /**
     * Get block content
     */
    getBlockContent(blockEl) {
        const type = blockEl.dataset.blockType;

        switch (type) {
            case 'text':
            case 'heading':
                return blockEl.querySelector('[contenteditable="true"]').innerHTML;

            case 'math':
                return blockEl.querySelector('.math-input').textContent;

            case 'table':
                return blockEl.querySelector('.editor-table').outerHTML;

            case 'image':
                const img = blockEl.querySelector('img');
                return {
                    src: img.src,
                    alt: img.alt,
                    caption: blockEl.querySelector('.image-caption').textContent
                };

            default:
                return '';
        }
    }

    /**
     * Load content
     */
    loadContent(content) {
        // Clear current content
        this.clearAll();

        // Load blocks
        content.blocks.forEach(blockData => {
            this.addBlock(blockData.type, blockData.content);
        });

        // Update counts
        this.updateCounts();
    }

    /**
     * Update word and character counts
     */
    updateCounts() {
        this.wordCountEl.textContent = this.getWordCount();
        this.charCountEl.textContent = this.getCharacterCount();
    }

    /**
     * Get word count
     */
    getWordCount() {
        let text = '';
        this.blocks.forEach(block => {
            const contentEl = block.element.querySelector('[contenteditable="true"]');
            if (contentEl) {
                text += ' ' + contentEl.textContent;
            }
        });

        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Get character count
     */
    getCharacterCount() {
        let text = '';
        this.blocks.forEach(block => {
            const contentEl = block.element.querySelector('[contenteditable="true"]');
            if (contentEl) {
                text += contentEl.textContent;
            }
        });

        return text.length;
    }

    /**
     * Export document
     */
    async exportDocument(format) {
        const content = this.getContent();

        switch (format) {
            case 'pdf':
                await this.exportToPDF(content);
                break;

            case 'word':
                await this.exportToWord(content);
                break;

            case 'html':
                this.exportToHTML(content);
                break;

            case 'markdown':
                this.exportToMarkdown(content);
                break;
        }
    }

    /**
     * Export to PDF (REQ-016)
     */
    async exportToPDF(content) {
        // In production, would use a proper PDF library
        // For now, use print functionality
        window.print();
    }

    /**
     * Export to Word
     */
    async exportToWord(content) {
        // Create a form to submit the content
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/export/word';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'content';
        input.value = JSON.stringify(content);

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        form.remove();
    }

    /**
     * Export to HTML
     */
    exportToHTML(content) {
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Document</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .math { text-align: center; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
        img { max-width: 100%; height: auto; }
        .page-break { page-break-after: always; }
    </style>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
`;

        content.blocks.forEach(block => {
            switch (block.type) {
                case 'text':
                case 'heading':
                    html += block.content + '\n';
                    break;

                case 'math':
                    html += `<div class="math">\\[${block.content}\\]</div>\n`;
                    break;

                case 'table':
                    html += block.content + '\n';
                    break;

                case 'image':
                    html += `<figure>
                        <img src="${block.content.src}" alt="${block.content.alt}">
                        <figcaption>${block.content.caption}</figcaption>
                    </figure>\n`;
                    break;

                case 'page-break':
                    html += '<div class="page-break"></div>\n';
                    break;
            }
        });

        html += `
</body>
</html>`;

        // Download file
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export to Markdown
     */
    exportToMarkdown(content) {
        let markdown = '';

        content.blocks.forEach(block => {
            switch (block.type) {
                case 'text':
                    markdown += this.htmlToMarkdown(block.content) + '\n\n';
                    break;

                case 'heading':
                    const level = block.content.match(/<h(\d)>/)?.[1] || '2';
                    const text = block.content.replace(/<[^>]+>/g, '');
                    markdown += '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
                    break;

                case 'math':
                    markdown += `$\n${block.content}\n$\n\n`;
                    break;

                case 'table':
                    // Convert HTML table to markdown table
                    markdown += this.tableToMarkdown(block.content) + '\n\n';
                    break;

                case 'image':
                    markdown += `![${block.content.alt}](${block.content.src})\n*${block.content.caption}*\n\n`;
                    break;

                case 'page-break':
                    markdown += '---\n\n';
                    break;
            }
        });

        // Download file
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Helper methods
     */
    getCurrentBlock() {
        if (!this.currentBlockId) return null;
        return document.querySelector(`[data-block-id="${this.currentBlockId}"]`);
    }

    selectBlock(blockId) {
        // Remove previous selection
        document.querySelectorAll('.editor-block.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new block
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (block) {
            block.classList.add('selected');
            this.currentBlockId = blockId;
        }
    }

    moveBlock(blockId, direction) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const index = this.blocks.indexOf(block);

        if (direction === 'up' && index > 0) {
            // Swap with previous block
            [this.blocks[index - 1], this.blocks[index]] = [this.blocks[index], this.blocks[index - 1]];
            block.element.previousElementSibling.insertAdjacentElement('beforebegin', block.element);
        } else if (direction === 'down' && index < this.blocks.length - 1) {
            // Swap with next block
            [this.blocks[index], this.blocks[index + 1]] = [this.blocks[index + 1], this.blocks[index]];
            block.element.nextElementSibling.insertAdjacentElement('afterend', block.element);
        }

        this.onContentChange();
    }

    deleteBlock(blockId) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;

        // Don't delete if it's the only block
        if (this.blocks.length === 1) {
            showNotification('Cannot delete the last block', 'warning');
            return;
        }

        // Remove from DOM
        this.blocks[index].element.remove();

        // Remove from array
        this.blocks.splice(index, 1);

        // Select another block
        if (this.currentBlockId === blockId) {
            const newIndex = Math.min(index, this.blocks.length - 1);
            if (this.blocks[newIndex]) {
                this.selectBlock(this.blocks[newIndex].id);
            }
        }

        this.onContentChange();
    }

    clearAll() {
        this.blocks = [];
        this.currentBlockId = null;
        this.blocksContainer.innerHTML = '';
    }

    onContentChange() {
        // Trigger content change event
        this.container.dispatchEvent(new CustomEvent('contentchange', {
            detail: {
                content: this.getContent()
            }
        }));
    }

    htmlToMarkdown(html) {
        // Simple HTML to Markdown conversion
        return html
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<p>(.*?)<\/p>/g, '$1\n')
            .replace(/<[^>]+>/g, '');
    }

    tableToMarkdown(html) {
        // Simple table to markdown conversion
        const table = document.createElement('div');
        table.innerHTML = html;

        let markdown = '';
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td, th');
            const rowText = Array.from(cells).map(cell => cell.textContent.trim()).join(' | ');
            markdown += '| ' + rowText + ' |\n';

            // Add separator after header row
            if (index === 0) {
                markdown += '|' + Array(cells.length).fill(' --- ').join('|') + '|\n';
            }
        });

        return markdown;
    }

    destroy() {
        // Clean up
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.blocks = [];
        this.container.innerHTML = '';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentEditor;
}