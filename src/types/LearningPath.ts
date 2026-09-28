export interface LearningPathMetadata {
    id: string;
    title: string;
    description: string;
    subjectId: string;
    subjectName: string;
    topicId: string;
    year?: string;
    readTime?: string;
    path: string;
    fileRelativePath: string;
    version?: 1 | 3;
}

export interface LearningPathRegistry {
    updatedAt: string;
    count: number;
    paths: LearningPathMetadata[];
}
