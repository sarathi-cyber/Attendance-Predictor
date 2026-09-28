import { Section } from '@/types/attendance';
export const sections: Section[] = Array.from({ length: 10 }, (_, i) => ({ id: `section-${i + 1}`, name: `Section ${String.fromCharCode(65 + i)}` }));
