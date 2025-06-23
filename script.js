document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById(tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });

    const emiSelect = document.getElementById('emi');
    const emiOutput = document.getElementById('emi-output');
    const fee = 50000; // example fee

    function updateEmi() {
        const months = parseInt(emiSelect.value, 10);
        const perMonth = Math.ceil(fee / months);
        emiOutput.textContent = `₹${perMonth} per month`;
    }

    if (emiSelect) {
        emiSelect.addEventListener('change', updateEmi);
        updateEmi();
    }

    const seatCount = document.getElementById('seat-count');
    let seats = 20;
    function decrementSeat() {
        if (seats > 0) {
            seats -= 1;
            seatCount.textContent = seats;
            if (seats < 5) seatCount.style.color = 'red';
        }
    }
    document.getElementById('apply-btn').addEventListener('click', decrementSeat);
});
