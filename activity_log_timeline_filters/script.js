// Theme Toggling Logic
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

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