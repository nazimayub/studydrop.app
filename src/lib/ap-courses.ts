import coursesData from './courses.json';

interface Course {
    name: string;
    units: string[];
}

export const courses: Course[] = coursesData;
