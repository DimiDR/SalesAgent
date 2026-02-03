'use client';

import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import type { User, Project, Document as DocType } from '@/types';

export function useAuth() {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create user profile if it doesn't exist
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'team_member',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser: User = {
        id: firebaseUser.uid,
        email,
        displayName,
        role: 'team_member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
  };
}

export function useProjects() {
  const { user, projects, setProjects, addProject, updateProject } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectList: Project[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
      })) as Project[];
      setProjects(projectList);
    });

    return () => unsubscribe();
  }, [user, setProjects]);

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const projectRef = doc(collection(db, 'projects'));
      const project: Project = {
        ...projectData,
        id: projectRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(projectRef, {
        ...project,
        createdAt: Timestamp.fromDate(project.createdAt),
        updatedAt: Timestamp.fromDate(project.updatedAt),
        deadline: project.deadline ? Timestamp.fromDate(project.deadline) : null,
      });
      addProject(project);
      return project;
    } finally {
      setLoading(false);
    }
  };

  const editProject = async (projectId: string, updates: Partial<Project>) => {
    setLoading(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
        deadline: updates.deadline ? Timestamp.fromDate(updates.deadline) : undefined,
      });
      updateProject(projectId, { ...updates, updatedAt: new Date() });
    } finally {
      setLoading(false);
    }
  };

  const removeProject = async (projectId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(projects.filter((p) => p.id !== projectId));
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    createProject,
    editProject,
    removeProject,
  };
}

export function useDocuments(projectId: string) {
  const { documents, setDocuments, addDocument, removeDocument } = useStore();
  const [loading, setLoading] = useState(false);

  const projectDocuments = documents.filter((d) => d.projectId === projectId);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'documents'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docList: DocType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as DocType[];
      setDocuments([
        ...documents.filter((d) => d.projectId !== projectId),
        ...docList,
      ]);
    });

    return () => unsubscribe();
  }, [projectId]);

  const uploadDocument = async (file: File, type: DocType['type']) => {
    setLoading(true);
    try {
      const storagePath = `projects/${projectId}/${type}/${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const docRef = doc(collection(db, 'documents'));
      const newDoc: DocType = {
        id: docRef.id,
        projectId,
        name: file.name,
        type,
        mimeType: file.type,
        url,
        storagePath,
        size: file.size,
        uploadedBy: 'current-user',
        createdAt: new Date(),
      };

      await setDoc(docRef, {
        ...newDoc,
        createdAt: Timestamp.fromDate(newDoc.createdAt),
      });

      addDocument(newDoc);
      return newDoc;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string, storagePath: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'documents', documentId));
      await deleteObject(ref(storage, storagePath));
      removeDocument(documentId);
    } finally {
      setLoading(false);
    }
  };

  return {
    documents: projectDocuments,
    loading,
    uploadDocument,
    deleteDocument,
  };
}
