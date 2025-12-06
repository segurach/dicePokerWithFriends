export const calculateScore = (category, currentDice) => {
    const counts = {};
    currentDice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const sum = currentDice.reduce((a, b) => a + b, 0);
    const uniqueDice = [...new Set(currentDice)].sort((a, b) => a - b);

    const isConsecutive = (arr) => {
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i + 1] !== arr[i] + 1) return false;
        }
        return true;
    };

    let hasSmallStraight = false;
    if (uniqueDice.length >= 4) {
        for (let i = 0; i <= uniqueDice.length - 4; i++) {
            if (isConsecutive(uniqueDice.slice(i, i + 4))) hasSmallStraight = true;
        }
    }
    const hasLargeStraight = uniqueDice.length === 5 && isConsecutive(uniqueDice);

    switch (category) {
        case 'ones': return (counts[1] || 0) * 1;
        case 'twos': return (counts[2] || 0) * 2;
        case 'threes': return (counts[3] || 0) * 3;
        case 'fours': return (counts[4] || 0) * 4;
        case 'fives': return (counts[5] || 0) * 5;
        case 'sixes': return (counts[6] || 0) * 6;
        case 'three_of_a_kind': return Object.values(counts).some(c => c >= 3) ? sum : 0;
        case 'four_of_a_kind': return Object.values(counts).some(c => c >= 4) ? sum : 0;
        case 'full_house':
            const values = Object.values(counts);
            return (values.includes(3) && values.includes(2)) || values.includes(5) ? 25 : 0;
        case 'small_straight': return hasSmallStraight ? 30 : 0;
        case 'large_straight': return hasLargeStraight ? 40 : 0;
        case 'chance': return sum;
        case 'yahtzee': return Object.values(counts).includes(5) ? 50 : 0;
        default: return 0;
    }
};
