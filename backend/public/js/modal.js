// Modern Modal System
class Modal {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal-backdrop" id="globalModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <div class="modal-icon" id="modalIcon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <h3 class="modal-title" id="modalTitle">Title</h3>
                    </div>
                    <p class="modal-message" id="modalMessage">Message</p>
                    <div class="modal-actions" id="modalActions">
                        <button class="modal-button primary" id="modalPrimaryBtn">OK</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const modalStyles = `
            <style>
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .modal-backdrop.active {
                    opacity: 1;
                    visibility: visible;
                }

                .modal-container {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 90%;
                    max-width: 400px;
                    transform: scale(0.9);
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .modal-backdrop.active .modal-container {
                    transform: scale(1);
                    opacity: 1;
                }

                .modal-header {
                    padding: 24px 24px 0 24px;
                    text-align: center;
                }

                .modal-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    font-size: 24px;
                }

                .modal-icon.success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .modal-icon.error {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .modal-icon.warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .modal-icon.info {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .modal-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 8px;
                }

                .modal-message {
                    color: #6b7280;
                    text-align: center;
                    line-height: 1.5;
                    padding: 0 24px;
                }

                .modal-actions {
                    padding: 24px;
                    display: flex;
                    gap: 12px;
                }

                .modal-button {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    text-align: center;
                    border: none;
                }

                .modal-button.primary {
                    background: #7c3aed;
                    color: white;
                }

                .modal-button.primary:hover {
                    background: #6d28d9;
                }

                .modal-button.secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }

                .modal-button.secondary:hover {
                    background: #e5e7eb;
                }
            </style>
        `;

        // Add to body if not exists
        if (!document.getElementById('globalModal')) {
            document.head.insertAdjacentHTML('beforeend', modalStyles);
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modal = document.getElementById('globalModal');
            this.setupEventListeners();
        } else {
            this.modal = document.getElementById('globalModal');
        }
    }

    setupEventListeners() {
        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close modal on primary button click
        document.getElementById('modalPrimaryBtn').addEventListener('click', () => {
            this.hide();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show(options = {}) {
        const {
            title = 'Information',
            message = '',
            type = 'info', // success, error, warning, info
            primaryText = 'OK',
            onPrimaryClick = null,
            showSecondary = false,
            secondaryText = 'Cancel',
            onSecondaryClick = null
        } = options;

        // Set icon and colors based on type
        const icon = document.getElementById('modalIcon');
        const iconClass = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];

        icon.className = `modal-icon ${type}`;
        icon.innerHTML = `<i class="${iconClass}"></i>`;

        // Set content
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;

        // Set up buttons
        const primaryBtn = document.getElementById('modalPrimaryBtn');
        primaryBtn.textContent = primaryText;

        if (onPrimaryClick) {
            primaryBtn.onclick = () => {
                onPrimaryClick();
                this.hide();
            };
        } else {
            primaryBtn.onclick = () => this.hide();
        }

        // Handle secondary button
        const actions = document.getElementById('modalActions');
        let secondaryBtn = document.getElementById('modalSecondaryBtn');

        if (showSecondary) {
            if (!secondaryBtn) {
                secondaryBtn = document.createElement('button');
                secondaryBtn.id = 'modalSecondaryBtn';
                secondaryBtn.className = 'modal-button secondary';
                actions.appendChild(secondaryBtn);
            }
            secondaryBtn.textContent = secondaryText;
            secondaryBtn.onclick = () => {
                if (onSecondaryClick) onSecondaryClick();
                this.hide();
            };
            secondaryBtn.style.display = 'block';
        } else if (secondaryBtn) {
            secondaryBtn.style.display = 'none';
        }

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Create global modal instance
window.modal = new Modal();

// Convenience functions
window.showSuccess = (message, title = 'Success') => {
    modal.show({ title, message, type: 'success' });
};

window.showError = (message, title = 'Error') => {
    modal.show({ title, message, type: 'error' });
};

window.showWarning = (message, title = 'Warning') => {
    modal.show({ title, message, type: 'warning' });
};

window.showInfo = (message, title = 'Information') => {
    modal.show({ title, message, type: 'info' });
};

window.showConfirm = (message, onConfirm, title = 'Confirmation') => {
    modal.show({
        title,
        message,
        type: 'warning',
        primaryText: 'Confirm',
        onPrimaryClick: onConfirm,
        showSecondary: true,
        secondaryText: 'Cancel'
    });
};