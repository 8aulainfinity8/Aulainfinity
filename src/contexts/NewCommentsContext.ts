import { createContext } from 'react';
import type { Comment } from '../types';

export interface NewCommentsContextType {
  newCommentsCount: number;
  newComments: Comment[];
  comments: Comment[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetchComments: () => void;
  markCommentAsRead: (commentId: string) => Promise<void> | void;
}

export const NewCommentsContext = createContext<NewCommentsContextType>({
  newCommentsCount: 0,
  newComments: [],
  comments: undefined,
  isLoading: true,
  isError: false,
  refetchComments: () => {},
  markCommentAsRead: () => {},
});