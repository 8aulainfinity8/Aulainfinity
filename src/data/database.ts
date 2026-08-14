import type { Video, Subject, CourseLevel } from '../types';

// Memoization cache to avoid re-processing the same data structure.
// This is a significant performance optimization.
let lastCourses: CourseLevel[] | null = null;
const videoMap = new Map<string, { video: Video; subject: Subject; level: CourseLevel }>();

const processCourseData = (courses: CourseLevel[]) => {
    // Only re-process if the course data array instance has changed.
    if (courses === lastCourses && videoMap.size > 0) {
        return;
    }

    videoMap.clear();
    courses.forEach(level => {
        (level.subjects || []).forEach(subject => {
            // Process videos directly in the subject (legacy)
            (subject.videos || []).forEach(video => {
                videoMap.set(video.id, { video, subject, level });
            });
            // Process videos inside blocks
            (subject.blocks || []).forEach(block => {
                (block.videos || []).forEach(video => {
                    videoMap.set(video.id, { video, subject, level });
                });
            });
        });
    });
    lastCourses = courses;
};


// --- EFFICIENT LOOKUP FUNCTIONS ---

/**
 * Finds a video by its ID using a pre-computed map for O(1) complexity.
 * @param videoId The ID of the video to find.
 * @param courses The array of all course levels.
 * @returns The video object or undefined if not found.
 */
export const findVideoById = (videoId: string, courses: CourseLevel[]): Video | undefined => {
    processCourseData(courses);
    return videoMap.get(videoId)?.video;
};

/**
 * Finds a video and its context (subject, index, and level) by its ID using a pre-computed map.
 * @param videoId The ID of the video to find.
 * @param courses The array of all course levels.
 * @returns An object with level, subject, video, and videoIndex, or null if not found.
 */
export const findSubjectAndVideoById = (videoId: string, courses: CourseLevel[]): { level: CourseLevel; subject: Subject; video: Video; videoIndex: number } | null => {
    processCourseData(courses);
    const context = videoMap.get(videoId);
    if (!context) {
        return null;
    }

    const { level, video, subject } = context;
    
    // Find the index of the video within all videos of the subject (from both root and blocks).
    const allVideosInSubject = [...(subject.videos || []), ...(subject.blocks?.flatMap(b => b.videos) || [])];
    const videoIndex = allVideosInSubject.findIndex(v => v.id === videoId);
    
    if (videoIndex === -1) {
        // This should not happen if the map is correct, but serves as a safeguard.
        return null; 
    }

    return { level, subject, video, videoIndex };
};