export interface SavannaAnimal {
    emoji: string;
    label: string;
    color: string;
}

export function getSavannaAnimal(emailOrId: string): SavannaAnimal {
    const animals: SavannaAnimal[] = [
        { emoji: '🦁', label: 'Lion de la Savane', color: 'from-amber-400 to-orange-600' },
        { emoji: '🐘', label: 'Éléphant Majestueux', color: 'from-slate-400 to-slate-600' },
        { emoji: '🦒', label: 'Girafe Élancée', color: 'from-yellow-300 to-amber-500' },
        { emoji: '🦓', label: 'Zèbre Rayé', color: 'from-gray-700 to-slate-900' },
        { emoji: '🐆', label: 'Guépard Rapide', color: 'from-yellow-400 to-orange-500' },
        { emoji: '🦏', label: 'Rhinocéros Robuste', color: 'from-zinc-500 to-zinc-700' },
        { emoji: '🦛', label: 'Hippopotame Puissant', color: 'from-blue-800 to-slate-800' },
        { emoji: '🦅', label: 'Aigle Royal', color: 'from-amber-700 to-yellow-800' },
        { emoji: '🦩', label: 'Flamant Rose', color: 'from-pink-400 to-rose-500' },
        { emoji: '🐊', label: 'Crocodile des Marais', color: 'from-emerald-600 to-teal-800' },
        { emoji: '🐗', label: 'Phacochère Doré', color: 'from-amber-800 to-stone-700' },
    ];
    
    let hash = 0;
    const str = emailOrId || 'unknown';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % animals.length;
    return animals[index];
}
