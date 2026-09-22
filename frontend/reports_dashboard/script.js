// Micro-interaction: Active state logic is already handled by class placement in HTML

// Simple search animation focus
const searchInput = document.querySelector('input[type="text"]');

searchInput.addEventListener('focus', () => {
    searchInput.parentElement.classList.add('ring-2', 'ring-primary/20');
});

searchInput.addEventListener('blur', () => {
    searchInput.parentElement.classList.remove('ring-2', 'ring-primary/20');
});

// Hover effect for report cards
document.querySelectorAll('.report-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.classList.add('translate-y-[-4px]');
    });

    card.addEventListener('mouseleave', () => {
        card.classList.remove('translate-y-[-4px]');
    });
});