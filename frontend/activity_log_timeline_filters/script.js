// Theme Toggling Logic
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

if (themeToggle && themeIcon) {
    themeToggle.addEventListener('click', () => {
        if (htmlElement.classList.contains('light')) {
            htmlElement.classList.remove('light');
            htmlElement.classList.add('dark');
            themeIcon.innerText = 'light_mode';
        } else {
            htmlElement.classList.remove('dark');
            htmlElement.classList.add('light');
            themeIcon.innerText = 'dark_mode';
        }
    });
}


// Demo Empty State Toggle
// In a real app, this would be triggered by filter results
function toggleEmptyState(isEmpty) {
    const timeline = document.getElementById('activityTimeline');
    const empty = document.getElementById('emptyState');

    if (isEmpty) {
        timeline.classList.add('hidden');
        empty.classList.remove('hidden');
    } else {
        timeline.classList.remove('hidden');
        empty.classList.add('hidden');
    }
}


// Micro-interactions for buttons
document.querySelectorAll('.active\\:scale-95').forEach(el => {
    el.addEventListener('mousedown', () => {
        el.style.transform = 'scale(0.95)';
    });

    el.addEventListener('mouseup', () => {
        el.style.transform = 'scale(1)';
    });

    el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
    });
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderActivityLogs(logs) {
    const timeline = document.getElementById('activityTimeline');
    const emptyState = document.getElementById('emptyState');

    if (!timeline || !emptyState) {
        return;
    }

    if (!logs.length) {
        timeline.innerHTML = '';
        timeline.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    timeline.classList.remove('hidden');
    timeline.innerHTML = logs.map((log) => {
        const actor = escapeHtml(log.created_by || 'System');
        const product = escapeHtml(log.product);
        const action = escapeHtml(log.action);
        const quantity = Math.abs(Number(log.quantity) || 0);
        const timestamp = new Date(log.created_at).toLocaleString();

        return `
            <article class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm dark:bg-surface-container-dark dark:border-outline">
                <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg" aria-hidden="true">
                            ${escapeHtml(actor.slice(0, 2).toUpperCase())}
                        </div>
                        <div>
                            <p class="text-on-surface font-semibold dark:text-inverse-on-surface">${actor}</p>
                            <p class="text-body-md text-on-surface-variant">${action}: ${quantity} units of <span class="font-medium text-primary dark:text-primary-fixed-dim">${product}</span></p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-label-sm text-secondary uppercase tracking-tighter mb-1">Inventory</div>
                        <p class="text-xs text-secondary">${escapeHtml(timestamp)}</p>
                    </div>
                </div>
            </article>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(
            'http://127.0.0.1:8000/api/activity-logs/',
            { credentials: 'include' }
        );
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = '../login_page/code.html';
            return;
        }
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Unable to load activity logs.');
        }

        renderActivityLogs(data.logs || []);
    } catch (error) {
        console.error('Activity log loading failed:', error);
        renderActivityLogs([]);
    }
});